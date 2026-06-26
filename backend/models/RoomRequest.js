const mongoose = require('mongoose');

const RoomRequestSchema = new mongoose.Schema({
    fromTeacher: { type: String, required: true },
    toTeacher: { type: String, required: true },
    roomId: { type: String, required: true },
    day: { type: String, required: true },
    timeSlot: { type: String, required: true },
    message: { type: String },
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected'], 
        default: 'pending' 
    }
}, { timestamps: true });

module.exports = mongoose.model('RoomRequest', RoomRequestSchema);
