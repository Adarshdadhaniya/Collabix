const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Join a conversation room
        socket.on('joinConversation', (conversationId) => {
            socket.join(conversationId);
            console.log(`User joined conversation: ${conversationId}`);
        });

        // Handle incoming message
        socket.on('sendMessage', async (data) => {
            try {
                const { conversationId, senderId, text } = data;

                // Save message to DB
                const message = new Message({
                    conversation: conversationId,
                    sender: senderId,
                    text: text
                });
                await message.save();
                
                // Populate sender for the frontend
                await message.populate('sender', 'name email');

                // Update conversation's lastMessage
                await Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id });

                // Broadcast message to room
                io.to(conversationId).emit('receiveMessage', message);
                
            } catch (err) {
                console.error("Socket sendMessage error:", err);
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};
