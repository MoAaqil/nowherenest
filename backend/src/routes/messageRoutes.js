const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, getThreads, deleteMessage, clearChat } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.get('/:propertyId/threads', protect, getThreads);
router.get('/:propertyId/:customerId', protect, getMessages);
router.post('/:propertyId/:customerId', protect, sendMessage);
router.delete('/:messageId', protect, deleteMessage);
router.delete('/:propertyId/:customerId/clear', protect, clearChat);

module.exports = router;
