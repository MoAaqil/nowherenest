const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: false // Optional for legacy compatibility
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  baseAmount: { type: Number, required: true, default: 0 },
  uspsAmount: { type: Number, default: 0 },
  discountApplied: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  commissionAmount: { type: Number, required: true }, // 5% - 12% platform fee
  ownerAmount: { type: Number, required: true },      // remainder paid to owner
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'],
    default: 'confirmed'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'paid'
  },
  checkInOTP: { type: String, default: '' },
  isOtpVerified: { type: Boolean, default: false },
  checkedInAt: { type: Date },
  checkedOutAt: { type: Date },
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    default: null
  },
  noteToOwner: { type: String, default: '' },
  guests: {
    type: [{
      name: { type: String, required: true },
      age: { type: Number, required: true }
    }],
    default: []
  },
  // Booking type: nightly (regular) or hourly (fresher/day-use checkout)
  bookingType: { type: String, enum: ['nightly', 'hourly'], default: 'nightly' },
  durationHours: { type: Number, default: null }, // for hourly bookings
  // Post-stay review submitted by customer
  review: {
    rating: { type: Number, min: 1, max: 5, default: null },
    comment: { type: String, default: '' },
    reviewedAt: { type: Date, default: null }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
