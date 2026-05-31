/**
 * Auth Middleware — DwellGo
 *
 * All role checks use UPPERCASE to match the database enum values (USER, ADMIN).
 * This file is the SINGLE source of truth for auth/permission middleware.
 */

const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const { isAdmin: _isAdmin } = require('../utils/roleHelpers');

// ── Rate Limiter ──────────────────────────────────────────────────────────────

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Token Extraction Helper ───────────────────────────────────────────────────

const getUserDataFromReq = (req) => {
    return new Promise((resolve, reject) => {
        const { token } = req.cookies;
        if (!token) return reject(new Error('No token'));
        jwt.verify(token, process.env.JWT_SECRET, {}, (err, userData) => {
            if (err) return reject(err);
            resolve(userData);
        });
    });
};

// ── optionalAuth ──────────────────────────────────────────────────────────────
// Tries to authenticate but does NOT fail if no token is present.
// req.user is set when authenticated; undefined otherwise.

const optionalAuth = async (req, res, next) => {
    try {
        const userData = await getUserDataFromReq(req);
        const userDoc = await prisma.user.findUnique({
            where: { id: userData.id },
            include: { profile: true }
        });
        if (userDoc && !userDoc.isBanned) req.user = userDoc;
    } catch {
        // No token or invalid — just continue without req.user
    }
    next();
};

// ── requireAuth ───────────────────────────────────────────────────────────────
// Verifies JWT and attaches full user document to req.user.

const requireAuth = async (req, res, next) => {
    try {
        const userData = await getUserDataFromReq(req);
        const userDoc = await prisma.user.findUnique({
            where: { id: userData.id },
            include: { profile: true }
        });
        if (!userDoc) return res.status(401).json({ error: 'Not authenticated' });

        // Refuse banned users (non-admins only)
        if (userDoc.isBanned && userDoc.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
        }

        req.user = userDoc;
        next();
    } catch (err) {
        if (
            err.message === 'No token' ||
            err.name === 'JsonWebTokenError' ||
            err.name === 'TokenExpiredError'
        ) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        console.error('requireAuth error:', err);
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
};

// ── requireAdmin ──────────────────────────────────────────────────────────────
// Allows ONLY ADMIN users. Must be chained AFTER requireAuth.

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// ── requireNotAdmin ───────────────────────────────────────────────────────────
// Blocks ADMIN users. Used for actions admins should never perform.
// Must be chained AFTER requireAuth.

const requireNotAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        return res.status(403).json({ error: 'Admins cannot perform this action' });
    }
    next();
};

// ── requireHost ───────────────────────────────────────────────────────────────
// Allows only users who have isHost=true (and are not admin).
// Must be chained AFTER requireAuth.

const requireHost = (req, res, next) => {
    if (!req.user || req.user.role === 'ADMIN') {
        return res.status(403).json({ error: 'Host access required' });
    }
    if (!req.user.isHost) {
        return res.status(403).json({ error: 'You need to activate host mode first' });
    }
    next();
};

module.exports = {
    authLimiter,
    getUserDataFromReq,
    optionalAuth,
    requireAuth,
    requireAdmin,
    requireNotAdmin,
    requireHost,
};
