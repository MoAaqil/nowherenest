const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { verifyWebhook } = require('../controllers/paymentController');

// Verify Razorpay payment
router.post('/verify', protect, verifyWebhook);

module.exports = router;
