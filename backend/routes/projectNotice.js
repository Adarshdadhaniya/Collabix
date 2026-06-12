const express = require('express');
const router = express.Router();
const { createProjectNotice, getProjectNotices, getEligibleStudentsForTriplets, getUnassignedStudents } = require('../controllers/projectNoticeController');
const passport = require('passport');

router.post('/', passport.authenticate('jwt', { session: false }), createProjectNotice);
router.post('/eligible-students', passport.authenticate('jwt', { session: false }), getEligibleStudentsForTriplets);
router.get('/', passport.authenticate('jwt', { session: false }), getProjectNotices);
router.get('/:projectId', passport.authenticate('jwt', { session: false }), require('../controllers/projectNoticeController').getProjectNoticeById);
router.get('/:projectId/unassigned', passport.authenticate('jwt', { session: false }), getUnassignedStudents);

module.exports = router;
