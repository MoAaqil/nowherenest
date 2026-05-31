const express = require('express');
const router = express.Router();
const { 
  addStaff, 
  getPropertyStaff, 
  updateStaff, 
  removeStaff 
} = require('../controllers/staffController');
const { protect } = require('../middleware/auth');

router.get('/property/:propertyId', protect, getPropertyStaff);
router.post('/', protect, addStaff);
router.put('/:id', protect, updateStaff);
router.delete('/:id', protect, removeStaff);

module.exports = router;
