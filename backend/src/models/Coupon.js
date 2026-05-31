const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true
  },
  code: { type: String, required: true, uppercase: true }, // e.g. SUMMER20
  discountPercent: { type: Number, required: true, min: 0, max: 100 }, // e.g. 20 for 20%
  isActive: { type: Boolean, default: true },
  expiryDate: { type: Date, required: true },
  maxUses: { type: Number, default: 100 },
  usesCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Ensure codes are unique per property
couponSchema.index({ property: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Coupon', couponSchema);
