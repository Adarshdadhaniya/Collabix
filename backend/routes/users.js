const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all teachers
router.get('/teachers', async (req, res) => {
    try {
        const teachers = await User.find({ role: { $in: ['teacher', 'admin'] } }).select('name role');
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
