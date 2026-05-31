const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { nextShortId } = require('../utils/shortId');

const bcryptSalt = bcrypt.genSaltSync(10);

// ── Helper: issue JWT cookie ──────────────────────────────────────────────────

const issueToken = (res, user) => {
    return new Promise((resolve, reject) => {
        jwt.sign({ email: user.email, id: user.id }, process.env.JWT_SECRET, {}, (err, token) => {
            if (err) return reject(err);
            res.cookie('token', token, {
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                path: '/'
            });
            resolve(token);
        });
    });
};

// ── Helper: build safe user payload ──────────────────────────────────────────

const buildUserPayload = (userDoc, wishlistIds = []) => ({
    _id: userDoc.id,
    id: userDoc.id,
    email: userDoc.email,
    role: userDoc.role, // keep UPPERCASE — frontend normalises as needed
    isHost: userDoc.isHost,
    isBanned: userDoc.isBanned,
    name: userDoc.profile?.name || null,
    wishlistIds
});

// ── register ──────────────────────────────────────────────────────────────────

const register = async (req, res) => {
    // SECURITY: role is NEVER accepted from client body.
    // All new users start as USER (GUEST mode, isHost=false).
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, bcryptSalt);
        const shortId = await nextShortId('user');

        const userDoc = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'USER',      // hardcoded — cannot be overridden
                isHost: false,
                shortId,
                profile: { create: { name } }
            },
            include: { profile: true }
        });

        await issueToken(res, userDoc);
        res.json(buildUserPayload(userDoc));
    } catch (e) {
        console.error('Registration error:', e);
        if (e.code === 'P2002') {
            return res.status(422).json({ error: 'Email already registered' });
        }
        res.status(500).json({ error: 'Server error during registration' });
    }
};

// ── login ─────────────────────────────────────────────────────────────────────

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userDoc = await prisma.user.findUnique({
            where: { email },
            include: { profile: true, wishlists: true }
        });
        if (!userDoc) return res.status(404).json({ error: 'Email not found' });

        const passOk = await bcrypt.compare(password, userDoc.password);
        if (!passOk) return res.status(422).json({ error: 'Incorrect password' });

        if (userDoc.isBanned && userDoc.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
        }

        const wishlistIds = userDoc.wishlists?.map(w => w.placeId) || [];
        await issueToken(res, userDoc);
        res.json(buildUserPayload(userDoc, wishlistIds));
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
};

// ── profile (GET) ─────────────────────────────────────────────────────────────

const profile = (req, res) => {
    const { token } = req.cookies;
    if (!token) return res.json(null);

    jwt.verify(token, process.env.JWT_SECRET, {}, async (err, userData) => {
        if (err) return res.json(null);
        try {
            const userDoc = await prisma.user.findUnique({
                where: { id: userData.id },
                include: { profile: true, wishlists: true }
            });
            if (!userDoc) return res.json(null);

            if (userDoc.isBanned && userDoc.role !== 'ADMIN') {
                res.clearCookie('token');
                return res.json(null);
            }

            const wishlistIds = userDoc.wishlists?.map(w => w.placeId) || [];
            res.json(buildUserPayload(userDoc, wishlistIds));
        } catch (e) {
            console.error('Profile fetch error:', e);
            res.json(null);
        }
    });
};

// ── updateProfile (PUT) ───────────────────────────────────────────────────────

const updateProfile = async (req, res) => {
    const { name, phone, bio, oldPassword, password: newPassword } = req.body;
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    try {
        const userData = await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) reject(err);
                else resolve(decoded);
            });
        });

        const user = await prisma.user.findUnique({
            where: { id: userData.id },
            include: { profile: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Name / phone / bio update — Admin cannot change name
        const profileData = {};
        if (name !== undefined) {
            if (user.role === 'ADMIN') {
                return res.status(403).json({ error: 'Admin accounts cannot change display name' });
            }
            profileData.name = name;
        }
        if (phone !== undefined) profileData.phone = phone;
        if (bio !== undefined) profileData.bio = bio;

        if (Object.keys(profileData).length > 0) {
            await prisma.profile.update({ where: { userId: user.id }, data: profileData });
        }

        // Password update
        if (newPassword) {
            if (newPassword.trim().length < 6) {
                return res.status(422).json({ error: 'New password must be at least 6 characters' });
            }
            if (!oldPassword) {
                return res.status(422).json({ error: 'Current password is required' });
            }
            const passOk = bcrypt.compareSync(oldPassword, user.password);
            if (!passOk) return res.status(422).json({ error: 'Current password is incorrect' });

            const isSame = bcrypt.compareSync(newPassword, user.password);
            if (isSame) return res.status(422).json({ error: 'New password must be different from current' });

            await prisma.user.update({
                where: { id: user.id },
                data: { password: bcrypt.hashSync(newPassword, bcryptSalt) }
            });
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

// ── getPublicProfile (GET /users/:id) ────────────────────────────────────────

const getPublicProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                isHost: true,
                hostSince: true,
                createdAt: true,
                profile: { select: { name: true, bio: true, avatarUrl: true, languages: true } }
            }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Only return PUBLISHED places on public profiles
        const places = await prisma.place.findMany({
            where: { ownerId: userId, status: 'PUBLISHED' },
            include: {
                photos: true,
                pricing: true,
                location: true,
                capacity: true,
                amenities: { include: { amenity: true } }
            }
        });

        const placeIds = places.map(p => p.id);
        const reviews = await prisma.review.findMany({ where: { placeId: { in: placeIds } } });

        let avgRating = 0;
        if (reviews.length > 0) {
            const validRatings = reviews.filter(r => r.rating != null);
            if (validRatings.length > 0) {
                avgRating = (validRatings.reduce((s, r) => s + r.rating, 0) / validRatings.length).toFixed(1);
            }
        }

        const mappedPlaces = places.map(p => ({
            ...p,
            _id: p.id,
            owner: p.ownerId,
            photos: p.photos?.map(ph => ph.url) || [],
            perks: p.amenities?.map(pa => pa.amenity.name) || [],
            price: p.pricing?.basePrice || 0,
            city: p.location?.city || '',
            district: p.location?.district || '',
            maxGuests: p.capacity?.maxGuests || 1
        }));

        res.json({
            user: { ...user, name: user.profile?.name, _id: user.id },
            places: mappedPlaces,
            totalReviews: reviews.length,
            averageRating: Number(avgRating)
        });
    } catch (error) {
        console.error('Get public profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// ── becomeHost (POST /become-host) ───────────────────────────────────────────
// Activates host mode for the authenticated user.

const becomeHost = async (req, res) => {
    try {
        const userId = req.user.id;
        if (req.user.isHost) {
            return res.json({ message: 'Host mode already active', isHost: true });
        }
        await prisma.user.update({
            where: { id: userId },
            data: { isHost: true, hostSince: new Date() }
        });
        res.json({ message: 'Host mode activated! You can now create listings.', isHost: true });
    } catch (err) {
        console.error('becomeHost error:', err);
        res.status(500).json({ error: 'Failed to activate host mode' });
    }
};

// ── logout ────────────────────────────────────────────────────────────────────

const logout = (req, res) => {
    res.cookie('token', '', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        expires: new Date(0)
    }).json(true);
};

module.exports = { register, login, profile, getPublicProfile, updateProfile, becomeHost, logout };
