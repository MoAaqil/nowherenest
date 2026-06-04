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

    // Check if dates are explicitly blocked
    const requestedDates = getDatesInRange(start, end);
    const roomBlockedDatesStr = room.blockedDates.map(d => new Date(d).toDateString());
    const isDateBlocked = requestedDates.some(d => roomBlockedDatesStr.includes(d.toDateString()));
    if (isDateBlocked) {
      return res.status(400).json({ success: false, message: 'Selected room is not available for the requested dates' });
    }

    // Check strict real-time inventory capacity to prevent double bookings
    const activeBookings = await Booking.countDocuments({
      room: room._id,
      status: { $in: ['confirmed', 'checked_in'] },
      startDate: { $lt: end },
      endDate: { $gt: start }
    });
    
    const totalInventory = room.totalInventory || 1;
    const maintenanceBlocks = room.maintenanceBlocks || 0;
    const availableRooms = Math.max(0, totalInventory - activeBookings - maintenanceBlocks);

    if (availableRooms < 1) {
      return res.status(400).json({ success: false, message: 'This room is currently sold out for the selected dates.' });
    }

    // 3. Financial calculations
    let baseAmount = 0;
    if (bookingType === 'hourly' && durationHours) {
      // Hourly pricing: room.price is per night (8h). Charge proportionally.
      const days = Math.ceil(durationHours / 8) || 1;
      baseAmount = room.price * days;
    } else {
      let dCurr = new Date(start);
      while (dCurr < end) {
        const dayOfWeek = dCurr.getDay();
        // 5 is Friday, 6 is Saturday
        if ((dayOfWeek === 5 || dayOfWeek === 6) && room.weekendPrice && room.weekendPrice > 0) {
          baseAmount += room.weekendPrice;
        } else {
          baseAmount += room.price;
        }
        dCurr.setDate(dCurr.getDate() + 1);
      }
      if (baseAmount === 0) baseAmount = room.price; // fallback
    }

    // Apply Surge Pricing if enabled and occupancy >= 80%
    const occupiedRoomsForSurge = activeBookings + (room.maintenanceBlocks || 0);
    if (room.enableSurgePricing && (room.totalInventory || 1) > 0) {
      const occupancyRate = occupiedRoomsForSurge / (room.totalInventory || 1);
      if (occupancyRate >= 0.8) {
        // Apply 15% surge
        baseAmount = Math.round(baseAmount * 1.15);
      }
    }
    let discountApplied = 0;

    // Apply Nest Partner Program Discount (10% for Grand/Prestige/Royal users)
    const customer = await User.findById(req.user.id);
    const host = await User.findById(property.owner);
    let isNestPartnerDiscountApplied = false;
    
    if (customer && customer.owlsPoints >= 250 && host && host.nestPartner) {
      const npDiscount = Math.round(baseAmount * 0.10);
      discountApplied += npDiscount;
      isNestPartnerDiscountApplied = true;
    }

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
      paymentStatus: 'pending', // Will be updated by Razorpay Webhook
      noteToOwner: noteToOwner || '',
      guests: guests || [],
      bookingType: bookingType || 'nightly',
      durationHours: bookingType === 'hourly' ? (durationHours || null) : null,
      selectedUsps: Array.isArray(selectedUsps) ? selectedUsps.map(u => ({
        title: u.title,
        description: u.description || '',
        price: parseFloat(u.price) || 0,
        chargeType: u.chargeType || 'per_family',
        scheduledDate: null,
        status: 'pending'
      })) : []
    });

    // 5. Block the dates in Room model (Keep this synchronous to prevent double booking immediately)
    room.blockedDates.push(...requestedDates);
    await room.save();

    // 6. Generate Razorpay Order
    let razorpayOrderId = null;
    if (process.env.RAZORPAY_KEY_ID) {
      const Razorpay = require('razorpay');
      const rzp = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
      try {
        const order = await rzp.orders.create({
          amount: totalAmount * 100, // paise
          currency: 'INR',
          receipt: booking._id.toString()
        });
        razorpayOrderId = order.id;
      } catch (err) {
        console.error('Razorpay Order Creation Failed:', err);
      }
    } else {
      // Mock order ID for local dev
      razorpayOrderId = 'order_mock_' + Math.floor(Math.random() * 100000);
    }

    // Award Owls Points to customer (25 points per ₹1000 spent)
    if (customer) {
      const earnedPoints = Math.floor(totalAmount / 1000) * 25;
      customer.owlsPoints = (customer.owlsPoints || 0) + earnedPoints;
      await customer.save();
    }

    // Do NOT credit owner wallet until webhook verifies payment
    // Owner wallet credit moved to paymentController.js webhook

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking,
      razorpayOrderId
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

    const now = new Date();
    let updated = false;
    for (let b of bookings) {
      if (['confirmed', 'checked_in'].includes(b.status) && now > new Date(b.endDate)) {
        b.status = 'checked_out';
        b.checkedOutAt = b.endDate;
        await b.save();
        updated = true;
      }
    }

    let finalBookings = bookings;
    if (updated) {
      finalBookings = await Booking.find({ customer: req.user.id })
        .populate('property')
        .populate('room')
        .sort('-createdAt');
    }

    res.status(200).json({ success: true, count: finalBookings.length, bookings: finalBookings });
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
    const isCustomer = booking.customer.toString() === req.user.id;

    if (!isOwner && !isAuthorizedStaff && !isCustomer && req.user.role !== 'admin') {
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

// Extend Booking Stay by custom days and experiences
exports.extendBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only customer who booked or owner/admin can extend
    if (booking.customer.toString() !== req.user.id && req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized stay extension request' });
    }

    const { days = 1, selectedUsps = [] } = req.body;
    const daysNum = parseInt(days) || 1;

    // 1. Calculate new dates to block and validate availability
    const oldEnd = new Date(booking.endDate);
    const newEnd = new Date(booking.endDate);
    newEnd.setDate(newEnd.getDate() + daysNum);

    const newBlockedDates = [];
    let dCurr = new Date(oldEnd);
    dCurr.setDate(dCurr.getDate() + 1);
    while (dCurr <= newEnd) {
      newBlockedDates.push(new Date(dCurr));
      dCurr.setDate(dCurr.getDate() + 1);
    }

    if (booking.room) {
      const roomBlockedDatesStr = booking.room.blockedDates.map(d => new Date(d).toDateString());
      const isDateBlocked = newBlockedDates.some(d => roomBlockedDatesStr.includes(d.toDateString()));
      if (isDateBlocked) {
        return res.status(400).json({ success: false, message: 'The stay cannot be extended because the subsequent dates are already booked.' });
      }
    }

    // Update checkout date
    booking.endDate = newEnd;

    // 2. Room extension cost
    const dailyPrice = booking.room ? booking.room.price : 0;
    const roomExtensionCost = daysNum * dailyPrice;
    booking.baseAmount += roomExtensionCost;

    // 3. Experiences (HDS) cost calculation
    let uspsAmount = 0;
    const guestsCount = (Array.isArray(booking.guests) && booking.guests.length > 0) ? booking.guests.length : 1;
    
    const property = await Property.findById(booking.property);
    
    const formattedNewUsps = selectedUsps.map(u => {
      const matchedPropertyUsp = property?.usps?.find(pu => pu.title === u.title);
      const priceVal = matchedPropertyUsp ? matchedPropertyUsp.price : (parseFloat(u.price) || 0);
      const chargeType = matchedPropertyUsp ? matchedPropertyUsp.chargeType : (u.chargeType || 'per_family');
      
      let finalCost = priceVal;
      if (chargeType === 'per_person') {
        finalCost = priceVal * guestsCount;
      }
      
      uspsAmount += finalCost;
      
      return {
        title: u.title,
        description: matchedPropertyUsp?.description || u.description || '',
        price: priceVal,
        chargeType: chargeType,
        scheduledDate: null,
        status: 'pending'
      };
    });

    booking.uspsAmount += uspsAmount;
    
    const totalAdded = roomExtensionCost + uspsAmount;
    booking.totalAmount += totalAdded;

    // 4. Recalculate platforms fee split
    const rateEnv = parseFloat(process.env.COMMISSION_RATE) || 0.08;
    const commissionRate = Math.min(Math.max(rateEnv, 0.05), 0.12);
    
    const newCommissionAmount = Math.round(booking.totalAmount * commissionRate);
    const addedCommission = newCommissionAmount - booking.commissionAmount;
    
    booking.commissionAmount = newCommissionAmount;
    booking.ownerAmount = booking.totalAmount - booking.commissionAmount;

    // Append new experiences
    if (formattedNewUsps.length > 0) {
      booking.selectedUsps.push(...formattedNewUsps);
    }

    // Block new dates in Room model
    if (booking.room) {
      booking.room.blockedDates.push(...newBlockedDates);
      await booking.room.save();
    }

    // 5. Credit Owner Wallet with added owner share
    const addedOwnerAmount = totalAdded - addedCommission;
    if (property && property.owner) {
      const owner = await User.findById(property.owner);
      if (owner) {
        owner.walletBalance += addedOwnerAmount;
        await owner.save();
      }
    }

    await booking.save();
    res.status(200).json({ success: true, message: `Stay extended by ${daysNum} day${daysNum !== 1 ? 's' : ''} successfully!`, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Booking experience details (schedule/status)
exports.updateBookingUsp = async (req, res) => {
  try {
    const { scheduledDate, status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only host, staff, or admin can schedule experiences
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ success: false, message: 'Only host administrators can schedule experiences' });
    }

    const usp = booking.selectedUsps.id(req.params.uspId);
    if (!usp) {
      return res.status(404).json({ success: false, message: 'Experience not found on this booking' });
    }

    if (scheduledDate) {
      usp.scheduledDate = new Date(scheduledDate);
    }
    if (status) {
      usp.status = status;
    }

    await booking.save();
    res.status(200).json({ success: true, message: 'Experience tracking updated successfully', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel a Booking (by customer only, if status is 'confirmed')
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room').populate('property');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only the customer who booked can cancel
    if (booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the booking customer can cancel this reservation' });
    }

    // Can only cancel if still 'confirmed' (not checked_in, checked_out, or already cancelled)
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: `Booking cannot be cancelled because its status is '${booking.status}'. Only confirmed bookings can be cancelled.` });
    }

    // 1. Unblock dates from the Room
    if (booking.room && booking.room.blockedDates) {
      const bookingDatesStr = new Set();
      let curr = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      while (curr <= end) {
        bookingDatesStr.add(curr.toDateString());
        curr.setDate(curr.getDate() + 1);
      }
      booking.room.blockedDates = booking.room.blockedDates.filter(
        d => !bookingDatesStr.has(new Date(d).toDateString())
      );
      await booking.room.save();
    }

    // 2. Debit owner wallet (reverse the credit)
    if (booking.property && booking.property.owner) {
      const owner = await User.findById(booking.property.owner);
      if (owner) {
        owner.walletBalance = Math.max(0, (owner.walletBalance || 0) - booking.ownerAmount);
        await owner.save();
      }
    }

    // 3. Deduct Owls Points from customer
    const customer = await User.findById(booking.customer);
    if (customer) {
      const earnedPoints = Math.floor(booking.totalAmount / 1000) * 25;
      customer.owlsPoints = Math.max(0, (customer.owlsPoints || 0) - earnedPoints);
      await customer.save();
    }

    // 4. Update booking status
    booking.status = 'cancelled';
    booking.paymentStatus = 'refunded';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled and refund initiated successfully.',
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
