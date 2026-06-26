const mongoose = require('mongoose');

const RoomBookingSchema = new mongoose.Schema({
    roomId: { type: String, required: true },
    day: { type: String, required: true },
    timeSlot: { type: String, required: true },
    teacherName: { type: String, required: true },
    subject: { type: String, required: true }
}, { timestamps: true });

RoomBookingSchema.index({ roomId: 1, day: 1, timeSlot: 1 }, { unique: true });

module.exports = mongoose.model('RoomBooking', RoomBookingSchema);
