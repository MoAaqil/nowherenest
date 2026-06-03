const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getChannelDashboard,
  simulateSync,
  updateRoomInventory,
  exportRoomIcal,
  syncExternalIcal,
  addExternalIcalLink,
  removeExternalIcalLink
} = require('../controllers/channelController');

// Admin only — Channel Manager routes
router.get('/dashboard', protect, authorize('admin', 'owner'), getChannelDashboard);
router.post('/sync', protect, authorize('admin', 'owner'), simulateSync);
router.put('/rooms/:roomId/inventory', protect, authorize('admin', 'owner'), updateRoomInventory);

// iCal endpoints
router.get('/ical/:roomId', exportRoomIcal); // public export link
router.post('/rooms/:roomId/ical/sync', protect, authorize('admin', 'owner'), syncExternalIcal);
router.post('/rooms/:roomId/ical', protect, authorize('admin', 'owner'), addExternalIcalLink);
router.delete('/rooms/:roomId/ical/:linkId', protect, authorize('admin', 'owner'), removeExternalIcalLink);

module.exports = router;
