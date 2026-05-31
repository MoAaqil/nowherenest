const Coupon = require('../models/Coupon');
const Property = require('../models/Property');
const Staff = require('../models/Staff');

// Create a Coupon
exports.createCoupon = async (req, res) => {
  try {
    const { propertyId, code, discountPercent, expiryDate, maxUses } = req.body;

    const isOwner = await Property.exists({ _id: propertyId, owner: req.user.id });
    const isMgmt = await Staff.exists({
      property: propertyId,
      user: req.user.id,
      role: { $in: ['manager', 'accountant'] },
      status: 'active'
    });

    if (!isOwner && !isMgmt && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to create coupons for this property' });
    }

    const coupon = await Coupon.create({
      property: propertyId,
      code: code.toUpperCase(),
      discountPercent,
      expiryDate: new Date(expiryDate),
      maxUses: maxUses || 100
    });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists for this property' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Coupons for Property
exports.getPropertyCoupons = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const isOwner = await Property.exists({ _id: propertyId, owner: req.user.id });
    const isStaff = await Staff.exists({ property: propertyId, user: req.user.id, status: 'active' });

    if (!isOwner && !isStaff && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view coupons' });
    }

    const coupons = await Coupon.find({ property: propertyId });
    res.status(200).json({ success: true, count: coupons.length, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Validate Coupon
exports.validateCoupon = async (req, res) => {
  try {
    const { propertyId, code } = req.body;

    const coupon = await Coupon.findOne({
      property: propertyId,
      code: code.toUpperCase(),
      isActive: true
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code or coupon is disabled' });
    }

    // Expiry check
    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ success: false, message: 'This coupon has expired' });
    }

    // Usage check
    if (coupon.usesCount >= coupon.maxUses) {
      return res.status(400).json({ success: false, message: 'This coupon usage limit has been reached' });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon is valid',
      discountPercent: coupon.discountPercent,
      couponId: coupon._id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    const isOwner = await Property.exists({ _id: coupon.property, owner: req.user.id });
    const isMgmt = await Staff.exists({
      property: coupon.property,
      user: req.user.id,
      role: { $in: ['manager', 'accountant'] },
      status: 'active'
    });

    if (!isOwner && !isMgmt && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this coupon' });
    }

    await coupon.deleteOne();
    res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
