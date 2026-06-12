const express = require('express');
const router = express.Router();
const passport = require('passport');
const { getConversations, getOrCreateConversation, getMessages } = require('../controllers/chatController');

// All chat routes are private
router.use(passport.authenticate('jwt', { session: false }));

// Get all conversations for user
router.get('/conversations', getConversations);

// Get or create conversation with specific user
router.get('/conversation/:userId', getOrCreateConversation);

// Get messages for a specific conversation
router.get('/messages/:conversationId', getMessages);

module.exports = router;
