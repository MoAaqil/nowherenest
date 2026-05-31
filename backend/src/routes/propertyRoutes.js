const express = require('express');
const router = express.Router();
const { 
  createProperty, 
  getProperties, 
  getOwnerProperties, 
  getPropertyById, 
  updateProperty, 
  deleteProperty,
  getPropertyStats
} = require('../controllers/propertyController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getProperties);
router.get('/owner', protect, getOwnerProperties);
router.get('/:id', getPropertyById);
router.get('/:id/stats', protect, getPropertyStats);

router.post('/', protect, createProperty);
router.put('/:id', protect, updateProperty);
router.delete('/:id', protect, deleteProperty);

module.exports = router;
