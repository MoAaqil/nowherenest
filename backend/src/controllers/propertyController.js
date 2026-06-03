const Property = require('../models/Property');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Staff = require('../models/Staff');
const User = require('../models/User');

// Helper to check property access
const hasPropertyAccess = async (userId, role, property) => {
  if (role === 'admin') return true;
  if (role === 'owner' && property.owner.toString() === userId.toString()) return true;
  if (role === 'staff') {
    const staff = await Staff.findOne({ property: property._id, user: userId, status: 'active' });
    return !!staff;
  }
  return false;
};

// Create a Property
exports.createProperty = async (req, res) => {
  try {
    const { name, description, type, address, location, checkInTime, checkOutTime, amenities, photos, identityProofType, identityProofNumber, usps, state, district } = req.body;
    
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only owners can create properties' });
    }

    const property = await Property.create({
      owner: req.user.id,
      name,
      description,
      type,
      address,
      location,
      starRating: 3,
      checkInTime,
      checkOutTime,
      amenities: amenities || [],
      photos: photos || [],
      identityProofType,
      identityProofNumber,
      usps: usps || [],
      state: state || '',
      district: district || ''
    });

    res.status(201).json({ success: true, property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Properties (for customers, or admin filtering)
exports.getProperties = async (req, res) => {
  try {
    const { type, search, amenities } = req.query;
    let query = { status: 'active' };

    if (type) query.type = type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }
    if (amenities) {
      const amenitiesArr = amenities.split(',');
      query.amenities = { $all: amenitiesArr };
    }

    const properties = await Property.find(query).populate('owner', 'name email phone isLicensed profileImage');

    res.status(200).json({ success: true, count: properties.length, properties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Host Properties
exports.getOwnerProperties = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'owner') {
      query.owner = req.user.id;
    } else if (req.user.role === 'staff') {
      // Find properties where this user is staff
      const staffAssignments = await Staff.find({ user: req.user.id, status: 'active' });
      const propertyIds = staffAssignments.map(s => s.property);
      query._id = { $in: propertyIds };
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to host properties' });
    }

    const properties = await Property.find(query);
    res.status(200).json({ success: true, count: properties.length, properties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Property By ID
exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('owner', 'name email phone bankDetails isLicensed profileImage nestPartner');

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Query bookings that have reviews for this property
    const bookings = await Booking.find({ property: property._id, 'review.rating': { $gt: 0 } })
      .populate('customer', 'name email profileImage')
      .populate('room', 'category')
      .sort('-review.reviewedAt');

    const reviews = bookings.map(b => ({
      _id: b._id,
      customerName: b.customer?.name || 'Anonymous Guest',
      customerProfileImage: b.customer?.profileImage || '',
      rating: b.review.rating,
      comment: b.review.comment,
      reviewedAt: b.review.reviewedAt,
      roomCategory: b.room ? b.room.category : ''
    }));

    // Dynamically calculate and sync average rating if there are reviews
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      const average = Math.round((sum / reviews.length) * 10) / 10;
      if (property.starRating !== average) {
        property.starRating = average;
        await property.save();
      }
    }

    res.status(200).json({ success: true, property, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Property
exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const hasAccess = await hasPropertyAccess(req.user.id, req.user.role, property);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this property' });
    }

    // Enforce ratings are only dynamically generated from user reviews
    delete req.body.starRating;

    const updatedProperty = await Property.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, property: updatedProperty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Property
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    if (property.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this property' });
    }

    // Delete associated rooms
    await Room.deleteMany({ property: property._id });
    await property.deleteOne();

    res.status(200).json({ success: true, message: 'Property and its rooms deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Property Statistics for Dashboard
exports.getPropertyStats = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const hasAccess = await hasPropertyAccess(req.user.id, req.user.role, property);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized to view stats for this property' });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Bookings related to this property
    const bookings = await Booking.find({ property: property._id }).populate('customer', 'name email phone');

    // 1. Calculations for Today
    let revenueToday = 0;
    let activeGuestsCount = 0;
    let todayCheckIns = [];
    let todayCheckOuts = [];
    let pendingBookingsCount = 0;

    bookings.forEach(b => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      
      // Check-ins today
      if (start >= todayStart && start <= todayEnd) {
        todayCheckIns.push(b);
      }
      
      // Check-outs today
      if (end >= todayStart && end <= todayEnd) {
        todayCheckOuts.push(b);
      }

      // Active guests (currently checked in, or stay overlapping today)
      if (b.status === 'checked_in') {
        activeGuestsCount++;
      } else if (b.status === 'confirmed' && start <= todayEnd && end >= todayStart) {
        activeGuestsCount++;
      }

      // Pending approval/status
      if (b.status === 'pending') {
        pendingBookingsCount++;
      }

      // Revenue today estimation (if stay matches today, or absolute sum of checked-in revenue today)
      if (b.paymentStatus === 'paid' && b.status !== 'cancelled') {
        // If checking in today, add its revenue to today's summary
        if (start >= todayStart && start <= todayEnd) {
          revenueToday += b.ownerAmount;
        }
      }
    });

    // 2. Room Inventory & Occupancy
    const totalRooms = await Room.countDocuments({ property: property._id, availability: true });
    
    // Occupied room count
    // Find rooms currently blocked/checked-in
    let occupiedRoomsCount = Math.min(activeGuestsCount, totalRooms);
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRoomsCount / totalRooms) * 100) : 0;

    // 3. Performance Trend Data (last 7 days)
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.setHours(0,0,0,0));
      const endOfDay = new Date(d.setHours(23,59,59,999));

      let dayRev = 0;
      let dayBookings = 0;

      bookings.forEach(b => {
        const checkIn = new Date(b.startDate);
        if (checkIn >= startOfDay && checkIn <= endOfDay && b.paymentStatus === 'paid' && b.status !== 'cancelled') {
          dayRev += b.ownerAmount;
          dayBookings++;
        }
      });

      trendData.push({
        date: startOfDay.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: dayRev,
        bookings: dayBookings
      });
    }

    res.status(200).json({
      success: true,
      stats: {
        revenueToday,
        activeGuests: activeGuestsCount,
        occupancyRate,
        pendingBookings: pendingBookingsCount,
        todayCheckInsCount: todayCheckIns.length,
        todayCheckOutsCount: todayCheckOuts.length,
        todayCheckIns,
        todayCheckOuts,
        totalRooms,
        trendData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
