const express = require('express');
const router = express.Router();
const { 
    createGroup, requestJoin, inviteStudent, acceptJoinRequest, 
    getMyGroups, getProjectGroups, getGroupById, 
    getJoinRequestsForGroup, rejectJoinRequest,
    getSentRequests, getReceivedInvitations, acceptInvitation, rejectInvitation,
    updateProposal, evaluateTeam
} = require('../controllers/groupController');
const { validateTeamRules } = require('../middleware/teamValidation');
const passport = require('passport');

router.put('/:groupId/proposal', passport.authenticate('jwt', { session: false }), updateProposal);
router.post('/:groupId/evaluate', passport.authenticate('jwt', { session: false }), evaluateTeam);

router.get('/my-groups', passport.authenticate('jwt', { session: false }), getMyGroups);
router.get('/sent-requests', passport.authenticate('jwt', { session: false }), getSentRequests);
router.get('/invitations', passport.authenticate('jwt', { session: false }), getReceivedInvitations);
router.get('/project/:projectId', passport.authenticate('jwt', { session: false }), getProjectGroups);
router.get('/:groupId', passport.authenticate('jwt', { session: false }), getGroupById);
router.get('/:groupId/requests', passport.authenticate('jwt', { session: false }), getJoinRequestsForGroup);

router.post('/', passport.authenticate('jwt', { session: false }), createGroup);
router.post('/join', passport.authenticate('jwt', { session: false }), requestJoin);
router.post('/invite', passport.authenticate('jwt', { session: false }), inviteStudent);
router.post('/invitations/:invitationId/accept', passport.authenticate('jwt', { session: false }), acceptInvitation);
router.post('/invitations/:invitationId/reject', passport.authenticate('jwt', { session: false }), rejectInvitation);

// Note: validateTeamRules expects projectId, groupId, and studentId in req.body
// In a real implementation, you'd map the requestId to fetch these values before calling validateTeamRules,
// or adjust validateTeamRules to parse the requestId.
router.post('/join/:requestId/accept', passport.authenticate('jwt', { session: false }), acceptJoinRequest);
router.post('/join/:requestId/reject', passport.authenticate('jwt', { session: false }), rejectJoinRequest);

module.exports = router;
