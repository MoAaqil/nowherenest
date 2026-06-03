const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.get('/:bookingId', protect, getMessages);
router.post('/:bookingId', protect, sendMessage);

module.exports = router;
