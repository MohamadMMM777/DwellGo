const express = require('express');
const { uploadByLink, uploadFiles, photosMiddleware } = require('../controllers/uploadController');

const router = express.Router();

router.post('/by-link', uploadByLink);
router.post('/', photosMiddleware.array('photos', 100), uploadFiles);

module.exports = router;
