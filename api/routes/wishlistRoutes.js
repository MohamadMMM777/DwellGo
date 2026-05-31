const express = require('express');
const router = express.Router();
const { toggleWishlist, getWishlist } = require('../controllers/wishlistController');
const { requireAuth, requireNotAdmin } = require('../middlewares/authMiddleware');

router.use(requireAuth, requireNotAdmin);

router.post('/toggle', toggleWishlist);
router.get('/', getWishlist);

module.exports = router;
