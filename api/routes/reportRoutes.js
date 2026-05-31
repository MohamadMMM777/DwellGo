const express = require('express');
const { requireAuth, requireNotAdmin } = require('../middlewares/authMiddleware');
const { createReport, getMyReports } = require('../controllers/reportController');

const router = express.Router();

router.post('/', requireAuth, createReport);
router.get('/mine', requireAuth, getMyReports);

module.exports = router;
