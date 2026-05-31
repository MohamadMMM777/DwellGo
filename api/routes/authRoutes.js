const express = require('express');
const {
    register, login, profile, getPublicProfile,
    updateProfile, becomeHost, logout
} = require('../controllers/authController');
const { authLimiter, requireAuth, requireNotAdmin } = require('../middlewares/authMiddleware');
const { validate, registerSchema, loginSchema } = require('../validators/schemas');

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);

router.get('/profile', profile);
router.put('/profile', requireAuth, updateProfile);

router.get('/users/:id', getPublicProfile);

// Activate host mode — regular users only, not admin
router.post('/become-host', requireAuth, requireNotAdmin, becomeHost);

module.exports = router;
