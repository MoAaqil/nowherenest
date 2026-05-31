const express = require('express');
const router = express.Router();
const { requestPayout, getMyPayouts, getAllPayouts, updatePayoutStatus } = require('../controllers/payoutController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('owner'), requestPayout);
router.get('/me', protect, authorize('owner'), getMyPayouts);
router.get('/', protect, authorize('admin'), getAllPayouts);
router.put('/:id/status', protect, authorize('admin'), updatePayoutStatus);

module.exports = router;
