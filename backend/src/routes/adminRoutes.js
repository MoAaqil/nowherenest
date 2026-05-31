const express = require('express');
const router = express.Router();
const { 
  getAdminStats, 
  updateGlobalCommissionRate,
  getHosts,
  verifyHost,
  getProperties,
  licenseProperty
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, authorize('admin'), getAdminStats);
router.put('/commission', protect, authorize('admin'), updateGlobalCommissionRate);

// Verification and Licensing Routes
router.get('/hosts', protect, authorize('admin'), getHosts);
router.put('/hosts/:id/verify', protect, authorize('admin'), verifyHost);
router.get('/properties', protect, authorize('admin'), getProperties);
router.put('/properties/:id/license', protect, authorize('admin'), licenseProperty);

module.exports = router;
