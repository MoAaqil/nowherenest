const express = require('express');
const router = express.Router();
const { createRide, getMyRides, getRideById, simulateRideProgress, getRideRoutePath } = require('../controllers/rideController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createRide);
router.get('/me', protect, getMyRides);
router.get('/:id', protect, getRideById);
router.post('/:id/simulate', protect, simulateRideProgress);
router.get('/:id/route', protect, getRideRoutePath);

module.exports = router;
