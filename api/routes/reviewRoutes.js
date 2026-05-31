const express = require('express');
const router = express.Router({ mergeParams: true });
const reviewController = require('../controllers/reviewController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Get all reviews for a place
router.get('/', reviewController.getPlaceReviews);

// Add a new review (Must be logged in)
router.post('/', requireAuth, reviewController.createReview);

module.exports = router;
