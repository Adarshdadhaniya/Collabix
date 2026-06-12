const express = require('express');
const router = express.Router();
const { uploadResume, upsertProfile, searchTeammates, getProfile } = require('../controllers/profileController');
const passport = require('passport');
const multer = require('multer');

// Configure multer for local file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, `${req.user.id}-${Date.now()}-${file.originalname}`)
    }
});

const upload = multer({ storage: storage });

router.post(
    '/upload-resume', 
    passport.authenticate('jwt', { session: false }), 
    upload.single('resume'), 
    uploadResume
);

router.post(
    '/', 
    passport.authenticate('jwt', { session: false }), 
    upsertProfile
);

router.get(
    '/',
    passport.authenticate('jwt', { session: false }),
    getProfile
);

router.get(
    '/search',
    passport.authenticate('jwt', { session: false }),
    searchTeammates
);

module.exports = router;
