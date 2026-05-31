const express = require('express');
const router = express.Router();
const { createListing, getListings, getListingById, getOwnerListings, updateListing, deleteListing } = require('../controllers/listingController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getListings);
router.get('/owner', protect, authorize('owner'), getOwnerListings);
router.get('/:id', getListingById);
router.post('/', protect, authorize('owner'), createListing);
router.put('/:id', protect, updateListing);
router.delete('/:id', protect, deleteListing);

module.exports = router;
