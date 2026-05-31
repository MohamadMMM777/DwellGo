const prisma = require('../prismaClient');

// ── createReview (POST /api/places/:id/reviews) ───────────────────────────────
// Requires: authenticated user + COMPLETED booking for this place.

exports.createReview = async (req, res) => {
    try {
        const placeId = req.params.id;
        const { rating, comment, cleanliness, communication, locationScore, valueScore } = req.body;
        const userId = req.user.id;

        if (!rating && (!comment || comment.trim().length === 0)) {
            return res.status(400).json({ error: 'Please provide a rating or a comment' });
        }
        if (rating && (Number(rating) < 1 || Number(rating) > 5)) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        const place = await prisma.place.findUnique({ where: { id: placeId } });
        if (!place) return res.status(404).json({ error: 'Place not found' });

        // Prevent host from reviewing their own place
        if (place.ownerId === userId) {
            return res.status(403).json({ error: 'You cannot review your own listing' });
        }

        // CRITICAL: verify the user has a COMPLETED booking for this place
        const completedBooking = await prisma.booking.findFirst({
            where: {
                userId,
                placeId,
                status: 'COMPLETED'
            },
            orderBy: { checkOut: 'desc' }
        });

        if (!completedBooking) {
            return res.status(403).json({
                error: 'You can only review places you have stayed at. Complete a booking first.'
            });
        }

        // Check if user already reviewed using this booking
        const existingReview = await prisma.review.findFirst({
            where: { bookingId: completedBooking.id }
        });
        if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this booking.' });
        }

        const newReview = await prisma.review.create({
            data: {
                userId,
                placeId,
                bookingId: completedBooking.id,
                rating: rating ? Number(rating) : null,
                cleanliness: cleanliness ? Number(cleanliness) : 5,
                communication: communication ? Number(communication) : 5,
                locationScore: locationScore ? Number(locationScore) : 5,
                valueScore: valueScore ? Number(valueScore) : 5,
                comment: comment ? comment.trim() : null
            },
            include: {
                user: { select: { id: true, profile: { select: { name: true } } } }
            }
        });

        // Notify host
        try {
            await prisma.notification.create({
                data: {
                    userId: place.ownerId,
                    title: 'Yeni Değerlendirme',
                    message: `"${place.title || 'ilanınız'}" için ${rating} yıldızlı yeni bir değerlendirme aldınız.`,
                    type: 'REVIEW_NEW',
                    relatedId: newReview.id
                }
            });
        } catch (e) { /* non-critical */ }

        res.status(201).json({
            ...newReview,
            _id: newReview.id,
            user: newReview.user
                ? { _id: newReview.user.id, name: newReview.user.profile?.name || 'DwellGo User' }
                : { _id: 'unknown', name: 'Unknown User' }
        });

    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'You have already reviewed this place.' });
        }
        console.error('createReview error:', error);
        res.status(500).json({ error: 'Failed to submit review. Please try again.' });
    }
};

// ── getPlaceReviews (GET /api/places/:id/reviews) ─────────────────────────────

exports.getPlaceReviews = async (req, res) => {
    try {
        const placeId = req.params.id;
        const reviews = await prisma.review.findMany({
            where: { placeId },
            include: {
                user: { select: { id: true, profile: { select: { name: true, avatarUrl: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const reviewsWithRating = reviews.filter(r => r.rating != null);
        const avgRating = reviewsWithRating.length > 0
            ? (reviewsWithRating.reduce((s, r) => s + r.rating, 0) / reviewsWithRating.length).toFixed(1)
            : 0;

        const mapped = reviews.map(r => ({
            ...r,
            _id: r.id,
            user: r.user
                ? { _id: r.user.id, name: r.user.profile?.name || 'DwellGo User', avatar: r.user.profile?.avatarUrl }
                : { _id: 'unknown', name: 'Unknown User' }
        }));

        res.json({ reviews: mapped, count: reviews.length, averageRating: Number(avgRating) });
    } catch (error) {
        console.error('getPlaceReviews error:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};

// ── getAuthoredReviews (GET /api/user-reviews/authored) ──────────────────────

exports.getAuthoredReviews = async (req, res) => {
    try {
        const userId = req.user.id;
        const reviews = await prisma.review.findMany({
            where: { userId },
            include: { place: { select: { title: true, photos: true, id: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const mapped = reviews.map(r => ({
            ...r,
            _id: r.id,
            place: r.place
                ? { ...r.place, photos: r.place.photos?.map(p => p.url) || [], _id: r.place.id }
                : null
        }));
        res.json(mapped);
    } catch (error) {
        console.error('getAuthoredReviews error:', error);
        res.status(500).json({ error: 'Failed to fetch your reviews' });
    }
};

// ── getReceivedReviews (GET /api/user-reviews/received) ──────────────────────

exports.getReceivedReviews = async (req, res) => {
    try {
        const userId = req.user.id;
        const places = await prisma.place.findMany({ where: { ownerId: userId }, select: { id: true } });
        const placeIds = places.map(p => p.id);

        const reviews = await prisma.review.findMany({
            where: { placeId: { in: placeIds } },
            include: {
                user: { select: { id: true, profile: { select: { name: true } } } },
                place: { select: { title: true, photos: true, id: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const mapped = reviews.map(r => ({
            ...r,
            _id: r.id,
            user: r.user ? { _id: r.user.id, name: r.user.profile?.name || 'DwellGo User' } : null,
            place: r.place ? { ...r.place, photos: r.place.photos?.map(p => p.url) || [], _id: r.place.id } : null
        }));
        res.json(mapped);
    } catch (error) {
        console.error('getReceivedReviews error:', error);
        res.status(500).json({ error: 'Failed to fetch reviews on your listings' });
    }
};

// ── updateReview (PUT /api/user-reviews/:id) ──────────────────────────────────

exports.updateReview = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        if (!rating && (!comment || comment.trim().length === 0)) {
            return res.status(400).json({ error: 'Please provide a rating or a comment' });
        }

        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review) return res.status(404).json({ error: 'Review not found' });
        if (review.userId !== userId) return res.status(403).json({ error: 'You can only edit your own reviews' });

        const updated = await prisma.review.update({
            where: { id: reviewId },
            data: {
                rating: rating ? Number(rating) : review.rating,
                comment: comment !== undefined ? comment.trim() : review.comment
            },
            include: {
                user: { select: { id: true, profile: { select: { name: true } } } },
                place: { select: { title: true, photos: true, id: true } }
            }
        });

        res.json({
            ...updated,
            _id: updated.id,
            user: updated.user ? { _id: updated.user.id, name: updated.user.profile?.name || 'DwellGo User' } : null,
            place: updated.place ? { ...updated.place, photos: updated.place.photos?.map(p => p.url) || [], _id: updated.place.id } : null
        });
    } catch (error) {
        console.error('updateReview error:', error);
        res.status(500).json({ error: 'Failed to update review' });
    }
};

// ── deleteReview (DELETE /api/user-reviews/:id) ───────────────────────────────

exports.deleteReview = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role; // DB stores as UPPERCASE

        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review) return res.status(404).json({ error: 'Review not found' });

        // Allow owner of the review OR an ADMIN (uppercase check!)
        if (review.userId !== userId && userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'You cannot delete this review' });
        }

        await prisma.review.delete({ where: { id: reviewId } });
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('deleteReview error:', error);
        res.status(500).json({ error: 'Failed to delete review' });
    }
};

// ── replyToReview (POST /api/reviews/:id/reply) ───────────────────────────────
// Host can reply to a review on their place.

exports.replyToReview = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const { reply } = req.body;
        const userId = req.user.id;

        if (!reply || reply.trim().length === 0) {
            return res.status(400).json({ error: 'Reply text is required' });
        }

        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            include: { place: true }
        });
        if (!review) return res.status(404).json({ error: 'Review not found' });
        if (review.place.ownerId !== userId) {
            return res.status(403).json({ error: 'Only the host can reply to reviews on their listings' });
        }

        const updated = await prisma.review.update({
            where: { id: reviewId },
            data: { hostReply: reply.trim(), hostReplyAt: new Date() }
        });

        res.json({ ...updated, _id: updated.id });
    } catch (error) {
        console.error('replyToReview error:', error);
        res.status(500).json({ error: 'Failed to submit reply' });
    }
};
