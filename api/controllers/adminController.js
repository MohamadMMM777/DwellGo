const prisma = require('../prismaClient');

// All functions already gated by requireAdmin middleware in routes.
// verifyAdmin() is kept as a secondary internal guard.
const verifyAdmin = (userDoc) => {
    if (!userDoc || userDoc.role !== 'ADMIN') throw new Error('Access denied');
};

// ── getStats (GET /api/admin/stats) ──────────────────────────────────────────

const getStats = async (req, res) => {
    try {
        verifyAdmin(req.user);

        const [totalUsers, totalHosts, totalGuests, totalPlaces, totalBookings, totalReviews, totalReports] =
            await Promise.all([
                prisma.user.count({ where: { role: 'USER' } }),
                prisma.user.count({ where: { isHost: true } }), // All hosts (including admins if any)
                prisma.user.count({ where: { role: 'USER', isHost: false } }), // Pure guests
                prisma.place.count({ where: { status: 'PUBLISHED' } }),
                prisma.booking.count(),
                prisma.review.count(),
                prisma.report.count({ where: { status: 'OPEN' } })
            ]);

        const bookingsByStatus = await prisma.booking.groupBy({
            by: ['status'],
            _count: { status: true }
        });

        const revenueResult = await prisma.booking.aggregate({
            where: { paymentStatus: 'PAID' },
            _sum: { totalPrice: true }
        });

        res.json({
            totalUsers,
            totalHosts,
            totalGuests,
            totalPlaces,
            totalBookings,
            totalReviews,
            openReports: totalReports,
            totalRevenue: revenueResult._sum.totalPrice || 0,
            bookingsByStatus: bookingsByStatus.reduce((acc, b) => {
                acc[b.status] = b._count.status;
                return acc;
            }, {})
        });
    } catch (err) {
        if (err.message === 'Access denied') return res.status(403).json({ error: 'Access denied' });
        console.error('getStats error:', err);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
};

// ── getAllUsers (GET /api/admin/users) ────────────────────────────────────────

const getAllUsers = async (req, res) => {
    try {
        verifyAdmin(req.user);

        const users = await prisma.user.findMany({
            where: { role: 'USER' }, // Admins don't see other admin accounts
            select: {
                id: true, email: true, role: true,
                isHost: true, isBanned: true, createdAt: true,
                hostSince: true,
                profile: { select: { name: true, phone: true, avatarUrl: true } },
                _count: { select: { places: true, bookings: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const mapped = users.map(u => ({
            ...u,
            _id: u.id,
            name: u.profile?.name,
            placesCount: u._count.places,
            bookingsCount: u._count.bookings
        }));

        res.json({ users: mapped, totalUsers: mapped.length });
    } catch (err) {
        if (err.message === 'Access denied') return res.status(403).json({ error: 'Access denied' });
        console.error('getAllUsers error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// ── banUser / unbanUser ───────────────────────────────────────────────────────

const banUser = async (req, res) => {
    try {
        verifyAdmin(req.user);
        const userId = req.params.id;
        if (userId === req.user.id) return res.status(400).json({ error: 'Cannot ban yourself' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.role === 'ADMIN') return res.status(400).json({ error: 'Cannot ban another admin' });

        await prisma.user.update({ where: { id: userId }, data: { isBanned: true } });
        res.json({ message: 'User banned successfully' });
    } catch (err) {
        if (err.message === 'Access denied') return res.status(403).json({ error: 'Access denied' });
        res.status(500).json({ error: 'Failed to ban user' });
    }
};

const unbanUser = async (req, res) => {
    try {
        verifyAdmin(req.user);
        await prisma.user.update({ where: { id: req.params.id }, data: { isBanned: false } });
        res.json({ message: 'User unbanned successfully' });
    } catch (err) {
        if (err.message === 'Access denied') return res.status(403).json({ error: 'Access denied' });
        res.status(500).json({ error: 'Failed to unban user' });
    }
};

// ── getAllPlaces (GET /api/admin/places) ──────────────────────────────────────

const getAllPlaces = async (req, res) => {
    try {
        verifyAdmin(req.user);

        const places = await prisma.place.findMany({
            include: {
                owner: { select: { id: true, email: true, profile: { select: { name: true } } } },
                photos: true,
                location: true,
                pricing: true,
                _count: { select: { bookings: true, reviews: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const mapped = places.map(p => ({
            ...p,
            _id: p.id,
            owner: p.owner ? { ...p.owner, _id: p.owner.id, name: p.owner.profile?.name } : null,
            photos: p.photos?.map(ph => ph.url) || [],
            city: p.location?.city || '',
            price: p.pricing?.basePrice || 0,
            bookingsCount: p._count.bookings,
            reviewsCount: p._count.reviews
        }));

        res.json({ places: mapped, totalPlaces: mapped.length });
    } catch (err) {
        if (err.message === 'Access denied') return res.status(403).json({ error: 'Access denied' });
        console.error('getAllPlaces error:', err);
        res.status(500).json({ error: 'Failed to fetch places' });
    }
};

// ── getAllBookings (GET /api/admin/bookings) ───────────────────────────────────

const getAllBookings = async (req, res) => {
    try {
        verifyAdmin(req.user);

        const bookings = await prisma.booking.findMany({
            include: {
                place: {
                    select: {
                        id: true,
                        title: true,
                        location: true,
                        ownerId: true,
                        owner: {
                            select: {
                                id: true,
                                email: true,
                                profile: { select: { name: true } }
                            }
                        }
                    }
                },
                user: { select: { id: true, email: true, profile: { select: { name: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const mapped = bookings.map(b => ({
            ...b,
            _id: b.id,
            user: { ...b.user, _id: b.user.id, name: b.user.profile?.name },
            place: b.place ? {
                ...b.place,
                _id: b.place.id,
                city: b.place.location?.city,
                owner: b.place.owner ? { ...b.place.owner, _id: b.place.owner.id, name: b.place.owner.profile?.name } : null
            } : null
        }));

        res.json({ bookings: mapped, totalBookings: mapped.length });
    } catch (err) {
        if (err.message === 'Access denied') return res.status(403).json({ error: 'Access denied' });
        console.error('getAllBookings error:', err);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};

// ── getAllReviews (GET /api/admin/reviews) ─────────────────────────────────────

const getAllReviews = async (req, res) => {
    try {
        verifyAdmin(req.user);

        const reviews = await prisma.review.findMany({
            include: {
                user: { select: { id: true, email: true, profile: { select: { name: true } } } },
                place: { select: { id: true, title: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const mapped = reviews.map(r => ({
            ...r,
            _id: r.id,
            user: { ...r.user, _id: r.user.id, name: r.user.profile?.name },
            place: r.place ? { ...r.place, _id: r.place.id } : null
        }));
        res.json({ reviews: mapped, totalReviews: mapped.length });
    } catch (err) {
        if (err.message === 'Access denied') return res.status(403).json({ error: 'Access denied' });
        console.error('getAllReviews error:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};

// ── deleteUser (DELETE /api/admin/users/:id) ──────────────────────────────────

const deleteUser = async (req, res) => {
    try {
        verifyAdmin(req.user);
        const userId = req.params.id;
        if (userId === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.role === 'ADMIN') return res.status(400).json({ error: 'Cannot delete another admin' });

        // Cascade is handled by Prisma's onDelete: Cascade on all relations.
        await prisma.user.delete({ where: { id: userId } });

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        if (err.message === 'Access denied') return res.status(403).json({ error: 'Access denied' });
        console.error('deleteUser error:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

// ── getPlaceBookings (GET /api/admin/places/:id/bookings) ─────────────────────

const getPlaceBookings = async (req, res) => {
    try {
        verifyAdmin(req.user);
        const placeId = req.params.id;

        const place = await prisma.place.findUnique({
            where: { id: placeId },
            select: { id: true, shortId: true, title: true }
        });
        if (!place) return res.status(404).json({ error: 'Place not found' });

        const bookings = await prisma.booking.findMany({
            where: { placeId },
            include: {
                user: { select: { id: true, shortId: true, email: true, profile: { select: { name: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const mapped = bookings.map(b => ({
            ...b,
            _id: b.id,
            guestName: b.user?.profile?.name || b.name,
            guestEmail: b.user?.email,
            userShortId: b.user?.shortId,
            isUpcoming: new Date(b.checkOut) > new Date()
        }));

        res.json({ place, bookings: mapped });
    } catch (err) {
        if (err.message === 'Access denied') return res.status(403).json({ error: 'Access denied' });
        console.error('getPlaceBookings error:', err);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};

// ── deletePlace (DELETE /api/admin/places/:id) ────────────────────────────────

const deletePlace = async (req, res) => {
    try {
        verifyAdmin(req.user);
        const placeId = req.params.id;

        const place = await prisma.place.findUnique({
            where: { id: placeId },
            include: { _count: { select: { bookings: true } } }
        });
        if (!place) return res.status(404).json({ error: 'Place not found' });

        // Block deletion if there are active (non-cancelled, non-completed) bookings
        const activeBookings = await prisma.booking.count({
            where: {
                placeId,
                status: { in: ['PENDING', 'APPROVED', 'CONFIRMED'] }
            }
        });
        if (activeBookings > 0) {
            return res.status(409).json({
                error: `Bu ilan silinemez — ${activeBookings} aktif rezervasyon var. Önce tüm rezervasyonları iptal edin.`,
                activeBookings
            });
        }

        // Cascade handles photos, amenities, bookings, reviews, wishlist automatically
        await prisma.place.delete({ where: { id: placeId } });

        res.json({ message: 'Listing deleted successfully' });
    } catch (err) {
        if (err.message === 'Access denied') return res.status(403).json({ error: 'Access denied' });
        console.error('deletePlace error:', err);
        res.status(500).json({ error: 'Failed to delete listing' });
    }
};

// ── adminSearch (GET /api/admin/search?type=place|user|booking&q=123) ─────────

const adminSearch = async (req, res) => {
    try {
        verifyAdmin(req.user);
        const { type, q } = req.query;
        if (!q || !type) return res.status(400).json({ error: 'type and q are required' });

        const shortIdNum = parseInt(q, 10);
        const isNumeric = !isNaN(shortIdNum);

        if (type === 'user') {
            const where = isNumeric
                ? { OR: [{ shortId: shortIdNum }, { email: { contains: q } }] }
                : { OR: [{ email: { contains: q } }, { profile: { name: { contains: q } } }] };

            const users = await prisma.user.findMany({
                where: { AND: [where, { role: 'USER' }] },
                select: {
                    id: true, shortId: true, email: true, role: true,
                    isHost: true, isBanned: true, createdAt: true,
                    profile: { select: { name: true, phone: true } },
                    _count: { select: { places: true, bookings: true } }
                },
                take: 20
            });
            return res.json({ results: users.map(u => ({ ...u, _id: u.id, name: u.profile?.name })) });
        }

        if (type === 'place') {
            const where = isNumeric
                ? { OR: [{ shortId: shortIdNum }, { title: { contains: q } }] }
                : { OR: [{ title: { contains: q } }, { location: { city: { contains: q } } }] };

            const places = await prisma.place.findMany({
                where,
                include: {
                    owner: { select: { id: true, shortId: true, profile: { select: { name: true } } } },
                    location: true,
                    pricing: true,
                    photos: { where: { isMain: true }, take: 1 },
                    _count: { select: { bookings: true } }
                },
                take: 20
            });
            return res.json({ results: places.map(p => ({
                ...p,
                _id: p.id,
                price: p.pricing?.basePrice,
                city: p.location?.city,
                ownerName: p.owner?.profile?.name,
                photo: p.photos[0]?.url || null,
                bookingsCount: p._count.bookings
            }))});
        }

        if (type === 'booking') {
            const where = isNumeric
                ? { OR: [{ shortId: shortIdNum }] }
                : { OR: [{ name: { contains: q } }, { phone: { contains: q } }] };

            const bookings = await prisma.booking.findMany({
                where,
                include: {
                    user: { select: { id: true, shortId: true, email: true, profile: { select: { name: true } } } },
                    place: { select: { id: true, shortId: true, title: true } }
                },
                take: 20
            });
            return res.json({ results: bookings.map(b => ({
                ...b,
                _id: b.id,
                guestName: b.user?.profile?.name || b.name,
                placeTitle: b.place?.title,
                placeShortId: b.place?.shortId,
                userShortId: b.user?.shortId
            }))});
        }

        res.status(400).json({ error: 'Invalid type. Use: user | place | booking' });
    } catch (err) {
        if (err.message === 'Access denied') return res.status(403).json({ error: 'Access denied' });
        console.error('adminSearch error:', err);
        res.status(500).json({ error: 'Search failed' });
    }
};

// ── deleteReview (DELETE /api/admin/reviews/:id) ──────────────────────────────

const deleteReview = async (req, res) => {
    try {
        verifyAdmin(req.user);
        const review = await prisma.review.findUnique({ where: { id: req.params.id } });
        if (!review) return res.status(404).json({ error: 'Review not found' });

        await prisma.review.delete({ where: { id: req.params.id } });
        res.json({ message: 'Review deleted successfully' });
    } catch (err) {
        if (err.message === 'Access denied') return res.status(403).json({ error: 'Access denied' });
        console.error('deleteReview error:', err);
        res.status(500).json({ error: 'Failed to delete review' });
    }
};

// ── Reports ────────────────────────────────────────────────────────────────────

const getAllReports = async (req, res) => {
    try {
        verifyAdmin(req.user);

        const reports = await prisma.report.findMany({
            include: {
                reporter: { select: { id: true, email: true, profile: { select: { name: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const mapped = reports.map(r => ({
            ...r,
            _id: r.id,
            reporter: { ...r.reporter, _id: r.reporter.id, name: r.reporter.profile?.name }
        }));

        res.json({ reports: mapped, totalReports: mapped.length });
    } catch (err) {
        if (err.message === 'Access denied') return res.status(403).json({ error: 'Access denied' });
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
};

const resolveReport = async (req, res) => {
    try {
        verifyAdmin(req.user);
        const { status, adminNotes } = req.body;

        const validStatuses = ['IN_REVIEW', 'RESOLVED', 'DISMISSED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updated = await prisma.report.update({
            where: { id: req.params.id },
            data: {
                status,
                adminNotes: adminNotes || null,
                resolvedAt: ['RESOLVED', 'DISMISSED'].includes(status) ? new Date() : null
            }
        });

        res.json({ ...updated, _id: updated.id });
    } catch (err) {
        if (err.message === 'Access denied') return res.status(403).json({ error: 'Access denied' });
        res.status(500).json({ error: 'Failed to update report' });
    }
};

module.exports = {
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
};
