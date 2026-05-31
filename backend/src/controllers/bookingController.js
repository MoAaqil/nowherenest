const Booking = require('../models/Booking');
const Property = require('../models/Property');
const Room = require('../models/Room');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const Staff = require('../models/Staff');

// Helper to get dates between start and end
const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  let curr = new Date(startDate);
  const last = new Date(endDate);
  while (curr <= last) {
    dates.push(new Date(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

// Create a Booking (Supporting Property + Room + Coupon + OTP)
exports.createBooking = async (req, res) => {
  const { propertyId, roomId, startDate, endDate, couponCode, selectedUsps, listingId, noteToOwner, guests, bookingType, durationHours } = req.body;

  try {
    // 1. Fetch Property and Room
    // If legacy listingId is passed, find listing first for fallback compatibility
    let propId = propertyId;
    let rmId = roomId;

    if (!propId && listingId) {
      // Fallback for customer-app if it is not yet updated
      const Listing = require('../models/Listing');
      const listing = await Listing.findById(listingId);
      if (!listing) {
        return res.status(404).json({ success: false, message: 'Legacy listing not found' });
      }
      
      // Let's see if we have a property matching this host
      let property = await Property.findOne({ owner: listing.owner });
      if (!property) {
        property = await Property.create({
          owner: listing.owner,
          name: listing.title,
          description: listing.description,
          type: listing.type === 'stay' ? 'hotel' : 'apartment',
          address: listing.location.address,
          location: listing.location,
          amenities: listing.amenities,
          photos: listing.images
        });
      }
      propId = property._id;

      let room = await Room.findOne({ property: propId });
      if (!room) {
        room = await Room.create({
          property: propId,
          category: 'standard',
          price: listing.price,
          capacity: 2,
          amenities: listing.amenities,
          images: listing.images
        });
      }
      rmId = room._id;
    }

    if (!propId || !rmId) {
      return res.status(400).json({ success: false, message: 'Property ID and Room ID are required' });
    }

    const property = await Property.findById(propId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const mongoose = require('mongoose');
    if (rmId === 'default_room_id' || !mongoose.Types.ObjectId.isValid(rmId)) {
      let existingRoom = await Room.findOne({ property: propId });
      if (!existingRoom) {
        existingRoom = await Room.create({
          property: propId,
          category: 'standard',
          price: 1500,
          capacity: 2,
          amenities: property.amenities || [],
          images: property.photos || []
        });
      }
      rmId = existingRoom._id;
    }

    const room = await Room.findById(rmId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room category not found' });
    }

    if (room.property.toString() !== property._id.toString()) {
      return res.status(400).json({ success: false, message: 'Room category does not belong to this property' });
    }

    // 2. Validate booking dates availability
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({ success: false, message: 'Checkout date must be after check-in date' });
    }

    // Check if dates are blocked
    const requestedDates = getDatesInRange(start, end);
    const roomBlockedDatesStr = room.blockedDates.map(d => new Date(d).toDateString());
    const isDateBlocked = requestedDates.some(d => roomBlockedDatesStr.includes(d.toDateString()));
    if (isDateBlocked) {
      return res.status(400).json({ success: false, message: 'Selected room is not available for the requested dates' });
    }

    // 3. Financial calculations
    let days = 1;
    if (bookingType === 'hourly' && durationHours) {
      // Hourly pricing: room.price is per night (8h). Charge proportionally.
      days = Math.ceil(durationHours / 8) || 1;
    } else {
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      days = diffDays > 0 ? diffDays : 1;
    }

    let baseAmount = room.price * days;
    let discountApplied = 0;

    // Apply Coupon Code
    if (couponCode) {
      const coupon = await Coupon.findOne({
        property: property._id,
        code: couponCode.toUpperCase(),
        isActive: true
      });
      if (coupon && new Date() <= new Date(coupon.expiryDate) && coupon.usesCount < coupon.maxUses) {
        discountApplied = Math.round(baseAmount * (coupon.discountPercent / 100));
        coupon.usesCount += 1;
        await coupon.save();
      }
    }

    // Add USPs (Experiences) costs if requested
    let uspsAmount = 0;
    const guestsCount = (Array.isArray(guests) && guests.length > 0) ? guests.length : 1;
    if (Array.isArray(selectedUsps)) {
      selectedUsps.forEach(selectedUsp => {
        // Look up matching USP in property schema to verify charge type and price
        const matchedPropertyUsp = property.usps.find(u => u.title === selectedUsp.title);
        const priceVal = matchedPropertyUsp ? matchedPropertyUsp.price : (parseFloat(selectedUsp.price) || 0);
        const chargeType = matchedPropertyUsp ? matchedPropertyUsp.chargeType : (selectedUsp.chargeType || 'per_family');
        
        if (chargeType === 'per_person') {
          uspsAmount += priceVal * guestsCount;
        } else {
          uspsAmount += priceVal;
        }
      });
    }

    const totalAmount = baseAmount + uspsAmount - discountApplied;

    // Determine platform commission (Default 8%)
    const rateEnv = parseFloat(process.env.COMMISSION_RATE) || 0.08;
    const commissionRate = Math.min(Math.max(rateEnv, 0.05), 0.12);
    const commissionAmount = Math.round(totalAmount * commissionRate);
    const ownerAmount = totalAmount - commissionAmount;

    // Generate Check-In OTP (6-digits)
    const checkInOTP = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Create the booking
    const booking = await Booking.create({
      customer: req.user.id,
      property: property._id,
      room: room._id,
      startDate: start,
      endDate: end,
      baseAmount,
      uspsAmount,
      discountApplied,
      totalAmount,
      commissionAmount,
      ownerAmount,
      checkInOTP,
      status: 'confirmed',
      paymentStatus: 'paid',
      noteToOwner: noteToOwner || '',
      guests: guests || [],
      bookingType: bookingType || 'nightly',
      durationHours: bookingType === 'hourly' ? (durationHours || null) : null
    });

    // 5. Block the dates in Room model
    room.blockedDates.push(...requestedDates);
    await room.save();

    // 6. Credit Owner Wallet
    const owner = await User.findById(property.owner);
    if (owner) {
      owner.walletBalance += ownerAmount;
      await owner.save();
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Bookings for Customers
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user.id })
      .populate('property')
      .populate('room')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Bookings for Owner/Staff (Host App Queue)
exports.getOwnerBookings = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'owner') {
      // Find properties owned by this user
      const properties = await Property.find({ owner: req.user.id }).select('_id');
      const propertyIds = properties.map(p => p._id);
      query.property = { $in: propertyIds };
    } else if (req.user.role === 'staff') {
      // Find properties where this user is staff
      const staffAssignments = await Staff.find({ user: req.user.id, status: 'active' });
      const propertyIds = staffAssignments.map(s => s.property);
      query.property = { $in: propertyIds };
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized booking query' });
    }

    const bookings = await Booking.find(query)
      .populate('customer', 'name email phone')
      .populate('property')
      .populate('room')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Booking By ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('property')
      .populate('room');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Auth check
    const isCustomer = booking.customer._id.toString() === req.user.id;
    const isOwner = booking.property.owner.toString() === req.user.id;
    const isStaff = await Staff.exists({ property: booking.property._id, user: req.user.id, status: 'active' });
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isOwner && !isStaff && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP Check-In
exports.verifyCheckInOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const booking = await Booking.findById(req.params.id).populate('property');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify user is receptionist/manager or owner of property
    const isOwner = booking.property.owner.toString() === req.user.id;
    const isAuthorizedStaff = await Staff.exists({
      property: booking.property._id,
      user: req.user.id,
      role: { $in: ['manager', 'receptionist'] },
      status: 'active'
    });

    if (!isOwner && !isAuthorizedStaff && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to perform check-in operations' });
    }

    if (booking.checkInOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid check-in OTP code' });
    }

    booking.status = 'checked_in';
    booking.isOtpVerified = true;
    booking.checkedInAt = new Date();
    await booking.save();

    res.status(200).json({ success: true, message: 'Guest checked in successfully', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check-Out Booking
exports.checkOutBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('property');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isOwner = booking.property.owner.toString() === req.user.id;
    const isAuthorizedStaff = await Staff.exists({
      property: booking.property._id,
      user: req.user.id,
      role: { $in: ['manager', 'receptionist'] },
      status: 'active'
    });

    if (!isOwner && !isAuthorizedStaff && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to perform check-out operations' });
    }

    booking.status = 'checked_out';
    booking.checkedOutAt = new Date();
    await booking.save();

    res.status(200).json({ success: true, message: 'Guest checked out successfully', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit Post-Stay Review (by customer)
exports.submitReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only the booking customer can submit a review
    if (booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the guest who booked can submit a review' });
    }

    // Can only review after checkout
    if (booking.status !== 'checked_out' && booking.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: 'Review can only be submitted after checkout is completed' });
    }

    // Prevent duplicate review
    if (booking.review && booking.review.rating) {
      return res.status(400).json({ success: false, message: 'Review already submitted for this booking' });
    }

    booking.review = {
      rating: parseInt(rating),
      comment: comment || '',
      reviewedAt: new Date()
    };
    await booking.save();

    // Recompute average rating for property
    const propertyId = booking.property;
    const allBookingsWithReviews = await Booking.find({
      property: propertyId,
      'review.rating': { $gt: 0 }
    });

    if (allBookingsWithReviews.length > 0) {
      const sum = allBookingsWithReviews.reduce((acc, b) => acc + b.review.rating, 0);
      const average = Math.round((sum / allBookingsWithReviews.length) * 10) / 10; // Round to 1 decimal place
      await Property.findByIdAndUpdate(propertyId, { starRating: average });
    }

    res.status(200).json({ success: true, message: 'Review submitted successfully', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
