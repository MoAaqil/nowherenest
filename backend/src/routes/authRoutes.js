const express = require('express');
const router = express.Router();
const { register, login, sendOTP, verifyOTP, getMe, updateBankDetails, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/otp/send', sendOTP);
router.post('/otp/verify', verifyOTP);
router.get('/me', protect, getMe);
router.put('/bank', protect, updateBankDetails);
router.put('/profile', protect, updateProfile);

module.exports = router;
