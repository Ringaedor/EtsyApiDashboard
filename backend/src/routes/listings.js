const express = require('express');
const router = express.Router();
const { getActiveListings, updateListing } = require('../controllers/listingsController');

// Le rotte sono relative a /api/listings

router.get('/:shopId/active', getActiveListings);
router.patch('/:shopId/:listingId', updateListing);

module.exports = router;
