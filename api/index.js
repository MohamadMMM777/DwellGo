const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/authRoutes');
const placeRoutes        = require('./routes/placeRoutes');
const bookingRoutes      = require('./routes/bookingRoutes');
const uploadRoutes       = require('./routes/uploadRoutes');
const adminRoutes        = require('./routes/adminRoutes');
const reviewRoutes       = require('./routes/reviewRoutes');
const userReviewRoutes   = require('./routes/userReviewRoutes');
const chatRoutes         = require('./routes/chatRoutes');
const wishlistRoutes     = require('./routes/wishlistRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes       = require('./routes/reportRoutes');
const { globalErrorHandler } = require('./utils/apiError');

let turkeyLocations = [];
try { turkeyLocations = require('./turkeyLocations.js'); } catch (e) { /* optional */ }

const app = express();

// ── Security & Parsing Middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir));

const allowedOrigins = [
    'http://127.0.0.1:5173', 'http://localhost:5173',
    'http://127.0.0.1:5174', 'http://localhost:5174',
    'http://127.0.0.1:5175', 'http://localhost:5175'
];

app.use(cors({
    credentials: true,
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) ||
            origin.startsWith('http://localhost') ||
            origin.startsWith('http://127.0.0.1')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

// ── Route Registration ────────────────────────────────────────────────────────
app.use('/api',               authRoutes);
app.use('/api/places',        placeRoutes);
app.use('/api/places/:id/reviews', reviewRoutes);
app.use('/api/user-reviews',  userReviewRoutes);
app.use('/api/bookings',      bookingRoutes);
app.use('/api/upload',        uploadRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/chat',          chatRoutes);
app.use('/api/wishlist',      wishlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports',       reportRoutes);

// ── Static & Utility Routes ───────────────────────────────────────────────────
app.get('/api/locations', (req, res) => res.json(turkeyLocations));
app.get('/api/test',      (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Global Error Handler (must be last) ──────────────────────────────────────
app.use(globalErrorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
// Listen on 127.0.0.1 to match the Vite dev server host — ensures cookies are
// shared correctly between frontend (127.0.0.1:5173) and API (127.0.0.1:4000).
app.listen(PORT, '127.0.0.1', () => console.log(`✅ DwellGo API running on http://127.0.0.1:${PORT}`));

module.exports = app;
