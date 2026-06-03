const express = require('express');
const router = express.Router();
const { 
  createRoom, 
  getRoomsByProperty, 
  getRoomById, 
  updateRoom, 
  deleteRoom,
  bulkAddRooms,
  getRoomAvailability
} = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

router.get('/property/:propertyId', getRoomsByProperty);
router.get('/:id/availability', getRoomAvailability);
router.get('/:id', getRoomById);

router.post('/', protect, createRoom);
router.post('/bulk', protect, bulkAddRooms);
router.put('/:id', protect, updateRoom);
router.delete('/:id', protect, deleteRoom);

module.exports = router;
