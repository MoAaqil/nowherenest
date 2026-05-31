const express = require('express');
const router = express.Router();
const { 
  createTask, 
  getPropertyTasks, 
  updateTask, 
  getMyTasks 
} = require('../controllers/housekeepingController');
const { protect } = require('../middleware/auth');

router.get('/my-tasks', protect, getMyTasks);
router.get('/property/:propertyId', protect, getPropertyTasks);
router.post('/', protect, createTask);
router.put('/:id', protect, updateTask);

module.exports = router;
