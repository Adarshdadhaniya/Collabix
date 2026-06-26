const express = require('express');
const router = express.Router();
const RoomBooking = require('../models/RoomBooking');
const RoomRequest = require('../models/RoomRequest');
const User = require('../models/User');

const ROOMS = ['R101', 'R102', 'R103', 'R104', 'R201', 'R202', 'R203', 'R204'];
const SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const seedInitialBookings = async () => {
    try {
        const count = await RoomBooking.countDocuments();
        if (count > 0) return;

        const teachers = await User.find({ role: { $in: ['teacher', 'admin'] } }).select('name');
        if (teachers.length === 0) return;
        const teacherNames = teachers.map(t => t.name);

        const bookingsToInsert = [];
        ROOMS.forEach((room, rIndex) => {
            DAYS.forEach((day, dIndex) => {
                SLOTS.forEach((slot, sIndex) => {
                    const hash = (rIndex * 13 + dIndex * 7 + sIndex * 3) % 100;
                    if (hash < 35) {
                        const teacherIndex = (hash * 5) % teacherNames.length;
                        bookingsToInsert.push({
                            roomId: room,
                            day: day,
                            timeSlot: slot,
                            teacherName: teacherNames[teacherIndex],
                            subject: ['Physics', 'Math', 'Computer Science', 'Chemistry', 'Biology'][hash % 5]
                        });
                    }
                });
            });
        });

        if (bookingsToInsert.length > 0) {
            await RoomBooking.insertMany(bookingsToInsert);
            console.log("Seeded initial room bookings.");
        }
    } catch (err) {
        console.error("Error seeding bookings:", err);
    }
};

seedInitialBookings();

router.get('/', async (req, res) => {
    try {
        const bookings = await RoomBooking.find({});
        const requests = await RoomRequest.find({});
        res.json({ bookings, requests });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/book', async (req, res) => {
    try {
        const { roomId, day, timeSlot, teacherName, subject } = req.body;
        const booking = await RoomBooking.findOneAndUpdate(
            { roomId, day, timeSlot },
            { teacherName, subject },
            { upsert: true, new: true }
        );
        res.json(booking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/cancel', async (req, res) => {
    try {
        const { roomId, day, timeSlot } = req.body;
        await RoomBooking.findOneAndDelete({ roomId, day, timeSlot });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/request', async (req, res) => {
    try {
        const { fromTeacher, toTeacher, roomId, day, timeSlot, message } = req.body;
        const newReq = new RoomRequest({
            fromTeacher, toTeacher, roomId, day, timeSlot, message, status: 'pending'
        });
        await newReq.save();
        res.json(newReq);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/request/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const request = await RoomRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ error: 'Request not found' });

        request.status = status;
        await request.save();

        if (status === 'accepted') {
            await RoomBooking.findOneAndUpdate(
                { roomId: request.roomId, day: request.day, timeSlot: request.timeSlot },
                { teacherName: request.fromTeacher, subject: 'Transferred Class' },
                { upsert: true, new: true }
            );
        }

        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
