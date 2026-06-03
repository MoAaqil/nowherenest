const express = require('express');
const router = express.Router();
const { 
  createBooking, 
  getBookings, 
  getOwnerBookings, 
  getBookingById,
  verifyCheckInOTP,
  checkOutBooking,
  submitReview,
  extendBooking,
  updateBookingUsp,
  cancelBooking
} = require('../controllers/bookingController');

const { protect } = require('../middleware/auth');

router.post('/', protect, createBooking);
router.get('/customer', protect, getBookings);
router.get('/owner', protect, getOwnerBookings);
router.get('/:id', protect, getBookingById);
router.post('/:id/verify-otp', protect, verifyCheckInOTP);
router.post('/:id/checkout', protect, checkOutBooking);
router.post('/:id/review', protect, submitReview);
router.post('/:id/extend', protect, extendBooking);
router.post('/:id/cancel', protect, cancelBooking);
router.put('/:id/usps/:uspId', protect, updateBookingUsp);


module.exports = router;
