/**
 * Booking Controller — Full workflow:
 * PENDING → APPROVED → CONFIRMED (after payment) → COMPLETED
 *                    ↘ CANCELLED (host rejects or guest cancels)
 */

const prisma = require('../prismaClient');
const { nextShortId } = require('../utils/shortId');

// ── Helper: send a notification safely ───────────────────────────────────────

const notify = async (userId, title, message, type, relatedId) => {
    try {
        await prisma.notification.create({
            data: { userId, title, message, type, relatedId }
        });
    } catch (err) {
        console.error('Notification failed (non-critical):', err.message);
    }
};

// ── Helper: check for conflicting bookings (APPROVED or CONFIRMED) ────────────

const hasConflict = async (placeId, checkIn, checkOut, excludeBookingId = null) => {
    const conflict = await prisma.booking.findFirst({
        where: {
            placeId,
            id: excludeBookingId ? { not: excludeBookingId } : undefined,
            status: { in: ['APPROVED', 'CONFIRMED'] },
            AND: [
                { checkIn: { lt: new Date(checkOut) } },
                { checkOut: { gt: new Date(checkIn) } }
            ]
        }
    });
    return conflict !== null;
};

// ── Helper: calculate total price on server ───────────────────────────────────

const calculatePrice = (pricing, checkIn, checkOut) => {
    const nights = Math.ceil(
        (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    );
    const base = (pricing?.basePrice || 0) * nights;
    const cleaning = pricing?.cleaningFee || 0;
    const service = pricing?.serviceFee || 0;
    return { nights, base, cleaning, service, total: base + cleaning + service };
};

// ── createBooking (POST /api/bookings) ───────────────────────────────────────

const createBooking = async (req, res) => {
    try {
        const userDoc = req.user;
        const { place: placeId, checkIn, checkOut, name, phone, numberOfGuests } = req.body;

        if (!placeId || !checkIn || !checkOut || !name || !phone) {
            return res.status(400).json({ error: 'Missing required booking fields' });
        }

        // Past date check
        if (new Date(checkIn) < new Date(new Date().toDateString())) {
            return res.status(400).json({ error: 'Check-in date cannot be in the past' });
        }

        if (new Date(checkOut) <= new Date(checkIn)) {
            return res.status(400).json({ error: 'Check-out must be after check-in' });
        }

        const placeDoc = await prisma.place.findUnique({
            where: { id: placeId },
            include: { pricing: true, capacity: true }
        });
        if (!placeDoc) return res.status(404).json({ error: 'Place not found' });
        if (placeDoc.status !== 'PUBLISHED') return res.status(400).json({ error: 'This place is not available for booking' });

        // Host cannot book their own place
        if (placeDoc.ownerId === userDoc.id) {
            return res.status(400).json({ error: 'You cannot book your own listing' });
        }

        // Capacity check
        const guests = Number(numberOfGuests) || 1;
        const maxGuests = placeDoc.capacity?.maxGuests || 1;
        if (guests > maxGuests) {
            return res.status(400).json({ error: `This place allows a maximum of ${maxGuests} guests` });
        }

        // Overlap check
        const conflict = await hasConflict(placeId, checkIn, checkOut);
        if (conflict) {
            return res.status(409).json({ error: 'These dates are not available. Please choose different dates.' });
        }

        // Server-side price calculation (never trust client)
        const { total } = calculatePrice(placeDoc.pricing, checkIn, checkOut);

        const shortId = await nextShortId('booking');
        const doc = await prisma.booking.create({
            data: {
                placeId,
                userId: userDoc.id,
                checkIn: new Date(checkIn),
                checkOut: new Date(checkOut),
                name: name.trim(),
                phone: phone.trim(),
                guestsCount: guests,
                totalPrice: total,
                shortId,
                status: 'PENDING',
                paymentStatus: 'UNPAID'
            }
        });

        // Notify host
        await notify(
            placeDoc.ownerId,
            'Yeni Rezervasyon Talebi',
            `"${placeDoc.title || 'ilanınız'}" için ${name} adlı misafirden yeni bir rezervasyon talebi aldınız.`,
            'BOOKING_NEW',
            doc.id
        );

        res.status(201).json({ ...doc, _id: doc.id });
    } catch (err) {
        console.error('createBooking error:', err);
        res.status(500).json({ error: 'Failed to create booking. Please try again.' });
    }
};

// ── getGuestBookings (GET /api/bookings/guest) ────────────────────────────────

const getGuestBookings = async (req, res) => {
    try {
        const userDoc = req.user;

        const bookings = await prisma.booking.findMany({
            where: { userId: userDoc.id },
            include: {
                place: {
                    include: {
                        owner: { select: { id: true, profile: { select: { name: true } } } },
                        photos: true,
                        pricing: true,
                        location: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Auto-complete past CONFIRMED bookings lazily
        const now = new Date();
        const toComplete = bookings.filter(
            b => b.status === 'CONFIRMED' && new Date(b.checkOut) < now
        );
        if (toComplete.length > 0) {
            await prisma.booking.updateMany({
                where: { id: { in: toComplete.map(b => b.id) } },
                data: { status: 'COMPLETED' }
            });
            toComplete.forEach(b => { b.status = 'COMPLETED'; });
        }

        const mapped = bookings.map(mapBooking);
        res.json(mapped);
    } catch (err) {
        console.error('getGuestBookings error:', err);
        res.status(500).json({ error: 'Failed to fetch your bookings' });
    }
};

// ── getHostBookings (GET /api/bookings/host) ──────────────────────────────────

const getHostBookings = async (req, res) => {
    try {
        const userDoc = req.user;

        const userPlaces = await prisma.place.findMany({
            where: { ownerId: userDoc.id },
            select: { id: true }
        });
        const placeIds = userPlaces.map(p => p.id);

        if (placeIds.length === 0) return res.json([]);

        const bookings = await prisma.booking.findMany({
            where: { placeId: { in: placeIds } },
            include: {
                place: { include: { photos: true, location: true } },
                user: { select: { id: true, email: true, profile: { select: { name: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Auto-complete past CONFIRMED bookings
        const now = new Date();
        const toComplete = bookings.filter(
            b => b.status === 'CONFIRMED' && new Date(b.checkOut) < now
        );
        if (toComplete.length > 0) {
            await prisma.booking.updateMany({
                where: { id: { in: toComplete.map(b => b.id) } },
                data: { status: 'COMPLETED' }
            });
            toComplete.forEach(b => { b.status = 'COMPLETED'; });
        }

        res.json(bookings.map(mapBooking));
    } catch (err) {
        console.error('getHostBookings error:', err);
        res.status(500).json({ error: 'Failed to fetch host bookings' });
    }
};

// ── getBookingById (GET /api/bookings/:id) ────────────────────────────────────

const getBookingById = async (req, res) => {
    try {
        const booking = await prisma.booking.findUnique({
            where: { id: req.params.id },
            include: {
                place: {
                    include: {
                        owner: { select: { id: true, profile: { select: { name: true } } } },
                        photos: true,
                        pricing: true,
                        location: true,
                        capacity: true
                    }
                },
                user: { select: { id: true, email: true, profile: { select: { name: true } } } }
            }
        });

        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        const isGuest = booking.userId === req.user.id;
        const isHostOfPlace = booking.place?.ownerId === req.user.id;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isGuest && !isHostOfPlace && !isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(mapBooking(booking));
    } catch (err) {
        console.error('getBookingById error:', err);
        res.status(500).json({ error: 'Failed to fetch booking' });
    }
};

// ── approveBooking (POST /api/bookings/:id/approve) ───────────────────────────

const approveBooking = async (req, res) => {
    try {
        const booking = await prisma.booking.findUnique({
            where: { id: req.params.id },
            include: { place: true }
        });

        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.place.ownerId !== req.user.id) {
            return res.status(403).json({ error: 'Only the host can approve bookings' });
        }
        if (booking.status !== 'PENDING') {
            return res.status(400).json({ error: `Cannot approve a booking with status: ${booking.status}` });
        }

        const updated = await prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'APPROVED', approvedAt: new Date() }
        });

        await notify(
            booking.userId,
            'Rezervasyon Onaylandı!',
            `"${booking.place.title || 'ilan'}" için rezervasyon talebiniz onaylandı. Rezervasyonuzu tamamlamak için ödemenizi yapınız.`,
            'BOOKING_APPROVED',
            booking.id
        );

        res.json({ ...updated, _id: updated.id });
    } catch (err) {
        console.error('approveBooking error:', err);
        res.status(500).json({ error: 'Failed to approve booking' });
    }
};

// ── rejectBooking (POST /api/bookings/:id/reject) ────────────────────────────

const rejectBooking = async (req, res) => {
    try {
        const { reason } = req.body;
        const booking = await prisma.booking.findUnique({
            where: { id: req.params.id },
            include: { place: true }
        });

        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.place.ownerId !== req.user.id) {
            return res.status(403).json({ error: 'Only the host can reject bookings' });
        }
        if (!['PENDING', 'APPROVED'].includes(booking.status)) {
            return res.status(400).json({ error: `Cannot reject a booking with status: ${booking.status}` });
        }

        const updated = await prisma.booking.update({
            where: { id: booking.id },
            data: {
                status: 'CANCELLED',
                rejectedAt: new Date(),
                cancelReason: reason || 'Rejected by host'
            }
        });

        await notify(
            booking.userId,
            'Rezervasyon Kabul Edilmedi',
            `"${booking.place.title || 'ilan'}" için rezervasyon talebiniz ev sahibi tarafından kabul edilmedi.${reason ? ' Sebep: ' + reason : ''}`,
            'BOOKING_REJECTED',
            booking.id
        );

        res.json({ ...updated, _id: updated.id });
    } catch (err) {
        console.error('rejectBooking error:', err);
        res.status(500).json({ error: 'Failed to reject booking' });
    }
};

// ── payBooking (POST /api/bookings/:id/pay) ──────────────────────────────────
// Fake payment — always succeeds.

const payBooking = async (req, res) => {
    try {
        const booking = await prisma.booking.findUnique({
            where: { id: req.params.id },
            include: { place: true }
        });

        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.userId !== req.user.id) {
            return res.status(403).json({ error: 'Only the guest can pay for this booking' });
        }
        if (booking.status !== 'APPROVED') {
            return res.status(400).json({
                error: booking.status === 'PENDING'
                    ? 'Please wait for host approval before payment'
                    : `Payment not available for booking with status: ${booking.status}`
            });
        }

        // Generate fake transaction ID
        const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const updated = await prisma.booking.update({
            where: { id: booking.id },
            data: {
                status: 'CONFIRMED',
                paymentStatus: 'PAID',
                paidAt: new Date(),
                transactionId
            },
            include: {
                place: { include: { photos: true, location: true } }
            }
        });

        // Notify host
        await notify(
            booking.place.ownerId,
            'Ödeme Alındı!',
            `"${booking.place.title || 'ilanınız'}" için ödeme onaylandı. Rezervasyon teyit edildi.`,
            'BOOKING_CONFIRMED',
            booking.id
        );

        res.json({
            ...updated,
            _id: updated.id,
            transactionId,
            message: 'Payment successful! Your booking is now confirmed.'
        });
    } catch (err) {
        console.error('payBooking error:', err);
        res.status(500).json({ error: 'Payment processing failed. Please try again.' });
    }
};

// ── cancelBooking (POST /api/bookings/:id/cancel) ────────────────────────────

const cancelBooking = async (req, res) => {
    try {
        const { reason } = req.body;
        const booking = await prisma.booking.findUnique({
            where: { id: req.params.id },
            include: { place: true }
        });

        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.userId !== req.user.id) {
            return res.status(403).json({ error: 'Only the guest can cancel this booking' });
        }
        if (['CANCELLED', 'COMPLETED'].includes(booking.status)) {
            return res.status(400).json({ error: `Cannot cancel a booking with status: ${booking.status}` });
        }

        const updated = await prisma.booking.update({
            where: { id: booking.id },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelReason: reason || 'Cancelled by guest',
                paymentStatus: booking.paymentStatus === 'PAID' ? 'REFUNDED' : 'UNPAID'
            }
        });

        await notify(
            booking.place.ownerId,
            'Rezervasyon İptal Edildi',
            `"${booking.place.title || 'ilanınız'}" için rezervasyon misafir tarafından iptal edildi.`,
            'BOOKING_CANCELLED',
            booking.id
        );

        res.json({ ...updated, _id: updated.id, message: 'Booking cancelled successfully' });
    } catch (err) {
        console.error('cancelBooking error:', err);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
};

// ── Legacy: getUserBookings (keeps backward compat) ───────────────────────────
// The frontend currently calls GET /api/bookings — keep working until frontend updated.

const getUserBookings = async (req, res) => {
    return getGuestBookings(req, res);
};

// ── Map helper ────────────────────────────────────────────────────────────────

const mapBooking = (b) => ({
    ...b,
    _id: b.id,
    user: b.user ? { ...b.user, name: b.user.profile?.name || 'User', _id: b.user.id } : undefined,
    place: b.place ? {
        ...b.place,
        _id: b.place.id,
        photos: b.place.photos?.map(p => p.url) || [],
        city: b.place.location?.city || '',
        price: b.place.pricing?.basePrice || 0,
        owner: b.place.owner
            ? { ...b.place.owner, name: b.place.owner.profile?.name || 'Host', _id: b.place.owner.id }
            : undefined
    } : undefined
});

module.exports = {
    createBooking,
    getUserBookings,
    getGuestBookings,
    getHostBookings,
    getBookingById,
    approveBooking,
    rejectBooking,
    payBooking,
    cancelBooking
};
