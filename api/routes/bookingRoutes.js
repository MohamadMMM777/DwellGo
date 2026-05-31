const express = require('express');
const { requireAuth, requireNotAdmin, requireHost } = require('../middlewares/authMiddleware');
const {
    createBooking,
    getUserBookings,
    getGuestBookings,
    getHostBookings,
    getBookingById,
    approveBooking,
    rejectBooking,
    payBooking,
    cancelBooking
} = require('../controllers/bookingController');

const router = express.Router();

// Legacy — keeps backward compat with current frontend
router.get('/', requireAuth, requireNotAdmin, getUserBookings);

// New separated endpoints
router.post('/', requireAuth, requireNotAdmin, createBooking);
router.get('/guest', requireAuth, requireNotAdmin, getGuestBookings);
router.get('/host', requireAuth, requireHost, getHostBookings);

// Single booking — guest, host, or admin can access
router.get('/:id', requireAuth, getBookingById);

// Host actions
router.post('/:id/approve', requireAuth, requireNotAdmin, approveBooking);
router.post('/:id/reject', requireAuth, requireNotAdmin, rejectBooking);

// Guest actions
router.post('/:id/pay', requireAuth, requireNotAdmin, payBooking);
router.post('/:id/cancel', requireAuth, requireNotAdmin, cancelBooking);

module.exports = router;
