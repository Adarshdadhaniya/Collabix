const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get all active conversations for the user
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id
        })
        .populate('participants', 'name email role')
        .populate('lastMessage')
        .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (err) {
        console.error("Error fetching conversations:", err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get or create a conversation with a specific user
// @route   GET /api/chat/conversation/:userId
// @access  Private
exports.getOrCreateConversation = async (req, res) => {
    try {
        const receiverId = req.params.userId;
        const senderId = req.user.id;

        if (receiverId === senderId) {
            return res.status(400).json({ message: "Cannot chat with yourself" });
        }

        // Find conversation where both users are participants
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        }).populate('participants', 'name email role');

        if (!conversation) {
            // Create new conversation
            conversation = new Conversation({
                participants: [senderId, receiverId]
            });
            await conversation.save();
            conversation = await conversation.populate('participants', 'name email role');
        }

        res.json(conversation);
    } catch (err) {
        console.error("Error getting/creating conversation:", err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get message history for a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res) => {
    try {
        const conversationId = req.params.conversationId;

        // Verify user is part of the conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        if (!conversation.participants.includes(req.user.id)) {
            return res.status(403).json({ message: "Not authorized to view this chat" });
        }

        const messages = await Message.find({ conversation: conversationId })
            .sort({ createdAt: 1 }); // Oldest first for chat UI

        res.json(messages);
    } catch (err) {
        console.error("Error fetching messages:", err.message);
        res.status(500).send('Server Error');
    }
};
