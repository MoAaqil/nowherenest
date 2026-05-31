const express = require('express');
const router = express.Router();
const { getAdminStats, updateGlobalCommissionRate } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, authorize('admin'), getAdminStats);
router.put('/commission', protect, authorize('admin'), updateGlobalCommissionRate);

module.exports = router;
