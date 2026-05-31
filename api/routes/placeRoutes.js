const express = require('express');
const { optionalAuth, requireAuth, requireHost } = require('../middlewares/authMiddleware');
const { validate, placeSchema } = require('../validators/schemas');
const { createPlace, getUserPlaces, getPlaceById, updatePlace, deletePlace, getAllPlaces } = require('../controllers/placeController');

const router = express.Router();

// Static protected routes — MUST come before /:id to avoid param conflicts
router.get('/user/all', requireAuth, getUserPlaces);

// Public routes (optionalAuth populates req.user if logged in)
router.get('/', getAllPlaces);
router.get('/:id', optionalAuth, getPlaceById);

// Protected mutation routes
router.post('/', requireAuth, requireHost, validate(placeSchema), createPlace);
router.put('/', requireAuth, requireHost, validate(placeSchema), updatePlace);
router.delete('/:id', requireAuth, requireHost, deletePlace);

module.exports = router;
