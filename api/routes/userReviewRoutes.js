const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Reviews written BY the logged-in user
router.get('/authored', requireAuth, reviewController.getAuthoredReviews);

// Reviews received ON the logged-in user's places
router.get('/received', requireAuth, reviewController.getReceivedReviews);

// Update a review written by the logged-in user
router.put('/:id', requireAuth, reviewController.updateReview);

// Delete a review (owner or admin)
router.delete('/:id', requireAuth, reviewController.deleteReview);

// Host replies to a review on their listing
router.post('/:id/reply', requireAuth, reviewController.replyToReview);

module.exports = router;
