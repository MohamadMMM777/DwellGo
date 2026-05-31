const express = require('express');
const router = express.Router();
const { requireAuth, requireNotAdmin } = require('../middlewares/authMiddleware');
const {
    getOrCreateConversation,
    getMyConversations,
    getMessages,
    sendMessage,
    markAsRead,
} = require('../controllers/chatController');

// All chat routes require authentication AND non-admin role
router.use(requireAuth, requireNotAdmin);

router.post('/conversations', getOrCreateConversation);
router.get('/conversations', getMyConversations);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', sendMessage);
router.put('/conversations/:id/read', markAsRead);

module.exports = router;
