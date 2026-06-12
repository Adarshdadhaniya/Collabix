const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const passport = require('passport');

router.post('/register', register);
router.post('/login', login);
router.get('/me', passport.authenticate('jwt', { session: false }), getMe);

module.exports = router;
