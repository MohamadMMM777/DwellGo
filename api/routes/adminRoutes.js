const express = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const {
    getStats,
    getAllUsers,
    banUser,
    unbanUser,
    getAllPlaces,
    getAllBookings,
    getAllReviews,
    deleteUser,
    deletePlace,
    getPlaceBookings,
    deleteReview,
    getAllReports,
    resolveReport,
    adminSearch
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes — double guard: requireAuth then requireAdmin
router.use(requireAuth, requireAdmin);

// Stats
router.get('/stats', getStats);

// Users
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/unban', unbanUser);

// Places
router.get('/places', getAllPlaces);
router.get('/places/:id/bookings', getPlaceBookings);
router.delete('/places/:id', deletePlace);

// Search
router.get('/search', adminSearch);

// Bookings
router.get('/bookings', getAllBookings);

// Reviews
router.get('/reviews', getAllReviews);
router.delete('/reviews/:id', deleteReview);

// Reports
router.get('/reports', getAllReports);
router.put('/reports/:id/resolve', resolveReport);

module.exports = router;
