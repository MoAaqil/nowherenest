const express = require('express');
const router = express.Router();
const { 
  createCoupon, 
  getPropertyCoupons, 
  getPropertyCouponsPublic,
  validateCoupon, 
  deleteCoupon 
} = require('../controllers/couponController');
const { protect } = require('../middleware/auth');

router.get('/property/:propertyId', protect, getPropertyCoupons);
router.get('/property/:propertyId/public', getPropertyCouponsPublic);
router.post('/', protect, createCoupon);
router.post('/validate', validateCoupon); // customer can validate without logging in (or standard protect)
router.delete('/:id', protect, deleteCoupon);

module.exports = router;
