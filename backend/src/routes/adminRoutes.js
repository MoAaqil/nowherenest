const express = require('express');
const router = express.Router();
const { 
  getAdminStats, 
  updateGlobalCommissionRate,
  getHosts,
  verifyHost,
  getProperties,
  licenseProperty,
  getRegionStats,
  getPendingVibes,
  verifyVibe,
  rejectVibe,
  toggleNestPartner,
  addVibeCredits
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, authorize('admin'), getAdminStats);
router.put('/commission', protect, authorize('admin'), updateGlobalCommissionRate);

// Host Management
router.get('/hosts', protect, authorize('admin'), getHosts);
router.put('/hosts/:id/verify', protect, authorize('admin'), verifyHost);
router.put('/hosts/:id/nest-partner', protect, authorize('admin'), toggleNestPartner);
router.post('/hosts/:id/vibe-credits', protect, authorize('admin'), addVibeCredits);

// Property Management
router.get('/properties', protect, authorize('admin'), getProperties);
router.put('/properties/:id/license', protect, authorize('admin'), licenseProperty);

// Region Stats
router.get('/region-stats', protect, authorize('admin'), getRegionStats);

// Vibe Queue
router.get('/vibes/pending', protect, authorize('admin'), getPendingVibes);
router.put('/vibes/:id/verify', protect, authorize('admin'), verifyVibe);
router.put('/vibes/:id/reject', protect, authorize('admin'), rejectVibe);

module.exports = router;
