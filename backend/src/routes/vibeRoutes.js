const express = require('express');
const router = express.Router();
const vibeController = require('../controllers/vibeController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, vibeController.getVibes)
  .post(protect, vibeController.createVibe);

router.route('/:id')
  .delete(protect, vibeController.deleteVibe);

router.post('/:id/like', protect, vibeController.toggleLikeVibe);

module.exports = router;
