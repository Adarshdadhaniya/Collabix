const Group = require('../models/Group');
const ProjectNotice = require('../models/ProjectNotice');
const JoinRequest = require('../models/JoinRequest');
const Invitation = require('../models/Invitation');
const StudentProfile = require('../models/StudentProfile');

// @desc    Create a Group
// @route   POST /api/groups
// @access  Private
exports.createGroup = async (req, res) => {
    try {
        const { projectId, name } = req.body;

        // Verify student doesn't already have a group for this project
        const profile = await StudentProfile.findOne({ user: req.user.id });
        const alreadyInGroup = profile.currentGroups.some(cg => cg.projectNotice.toString() === projectId);
        if (alreadyInGroup) {
            return res.status(400).json({ message: 'You are already in a group for this project' });
        }

        // Check Leader Policy Enforcement
        const projectNotice = await ProjectNotice.findById(projectId);
        if (!projectNotice) {
            return res.status(404).json({ message: 'Project notice not found' });
        }

        if (projectNotice.leaderPolicy !== 'creator_becomes_leader') {
            const isAssignedLeader = projectNotice.assignedLeaders.some(id => id.toString() === req.user.id);
            if (!isAssignedLeader) {
                return res.status(403).json({ message: 'Only assigned leaders can create groups for this project' });
            }
        }

        const group = new Group({
            projectNotice: projectId,
            name,
            createdBy: req.user.id,
            leader: req.user.id,
            members: [{ student: req.user.id }]
        });

        await group.save();

        // Add to student profile
        profile.currentGroups.push({ projectNotice: projectId, group: group._id });
        await profile.save();

        res.status(201).json(group);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Request to Join
// @route   POST /api/groups/join
// @access  Private
exports.requestJoin = async (req, res) => {
    try {
        const { projectId, groupId } = req.body;

        const request = new JoinRequest({
            projectNotice: projectId,
            group: groupId,
            student: req.user.id
        });

        await request.save();
        res.status(201).json({ message: 'Join request sent' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Invite a Student
// @route   POST /api/groups/invite
// @access  Private (Leader)
exports.inviteStudent = async (req, res) => {
    try {
        const { projectId, groupId, studentId } = req.body; // studentId is the invited user

        // Optional: Check if req.user.id is the leader of groupId here...

        const invitation = new Invitation({
            projectNotice: projectId,
            group: groupId,
            invitedStudent: studentId,
            invitedBy: req.user.id
        });

        await invitation.save();
        res.status(201).json({ message: 'Invitation sent' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Accept Join Request (Leader action)
// @route   POST /api/groups/join/:requestId/accept
// @access  Private
// Uses validation middleware before this controller
exports.acceptJoinRequest = async (req, res) => {
    try {
        const request = await JoinRequest.findById(req.params.requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Update Request
        request.status = 'accepted';
        await request.save();

        // Add member to group
        const group = await Group.findById(request.group);
        group.members.push({ student: request.student });
        group.memberCount += 1;
        await group.save();

        // Add group to student's profile
        const profile = await StudentProfile.findOne({ user: request.student });
        profile.currentGroups.push({ projectNotice: request.projectNotice, group: group._id });
        await profile.save();

        res.json({ message: 'Request accepted, member added to group' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Get all groups for a student
// @route   GET /api/groups/my-groups
// @access  Private
exports.getMyGroups = async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.user.id }).populate({
            path: 'currentGroups.group',
            populate: { path: 'projectNotice', select: 'title status' }
        });
        
        if (!profile) return res.json([]);
        
        const myGroups = profile.currentGroups.map(cg => cg.group);
        res.json(myGroups);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Get all groups for a specific project
// @route   GET /api/groups/project/:projectId
// @access  Private
exports.getProjectGroups = async (req, res) => {
    try {
        const groups = await Group.find({ projectNotice: req.params.projectId })
            .populate('leader', 'name email')
            .populate('members.student', 'name email');
        res.json(groups);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};
// @desc    Get sent join requests
// @route   GET /api/groups/sent-requests
// @access  Private
exports.getSentRequests = async (req, res) => {
    try {
        const requests = await JoinRequest.find({ student: req.user.id })
            .populate('group', 'name')
            .populate('projectNotice', 'title');
        res.json(requests);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Get received invitations
// @route   GET /api/groups/invitations
// @access  Private
exports.getReceivedInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find({ invitedStudent: req.user.id, status: 'pending' })
            .populate('group', 'name')
            .populate('projectNotice', 'title')
            .populate('invitedBy', 'name');
        res.json(invitations);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Accept Invitation
// @route   POST /api/groups/invitations/:invitationId/accept
// @access  Private
exports.acceptInvitation = async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.invitationId);
        if (!invitation || invitation.invitedStudent.toString() !== req.user.id) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        invitation.status = 'accepted';
        await invitation.save();

        // Add to group
        const group = await Group.findById(invitation.group);
        group.members.push({ student: req.user.id });
        group.memberCount += 1;
        await group.save();

        // Add to student profile
        const profile = await StudentProfile.findOne({ user: req.user.id });
        profile.currentGroups.push({ projectNotice: invitation.projectNotice, group: group._id });
        await profile.save();

        res.json({ message: 'Invitation accepted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Reject Invitation
// @route   POST /api/groups/invitations/:invitationId/reject
// @access  Private
exports.rejectInvitation = async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.invitationId);
        if (!invitation || invitation.invitedStudent.toString() !== req.user.id) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        invitation.status = 'rejected';
        await invitation.save();

        res.json({ message: 'Invitation rejected' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Get join requests for a group
// @route   GET /api/groups/:groupId/requests
// @access  Private (Leader)
exports.getJoinRequestsForGroup = async (req, res) => {
    try {
        const requests = await JoinRequest.find({ group: req.params.groupId, status: 'pending' })
            .populate('student', 'name email');
        res.json(requests);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Reject Join Request
// @route   POST /api/groups/join/:requestId/reject
// @access  Private (Leader)
exports.rejectJoinRequest = async (req, res) => {
    try {
        const request = await JoinRequest.findById(req.params.requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.status = 'rejected';
        await request.save();

        res.json({ message: 'Request rejected' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Get a group by ID
// @route   GET /api/groups/:groupId
// @access  Private
exports.getGroupById = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId)
            .populate('projectNotice', 'title minTeamSize maxTeamSize status')
            .populate('leader', 'name email')
            .populate('members.student', 'name email');
        
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        res.json(group);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update Group Project Proposal
// @route   PUT /api/groups/:groupId/proposal
// @access  Private (Group Member)
exports.updateProposal = async (req, res) => {
    try {
        const { projectTitle, projectDescription, problemStatement, techStack, tools } = req.body;
        
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Ensure user is a member
        const isMember = group.members.some(m => m.student.toString() === req.user.id);
        if (!isMember && req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Only group members can update the proposal' });
        }

        group.projectTitle = projectTitle !== undefined ? projectTitle : group.projectTitle;
        group.projectDescription = projectDescription !== undefined ? projectDescription : group.projectDescription;
        group.problemStatement = problemStatement !== undefined ? problemStatement : group.problemStatement;
        group.techStack = techStack !== undefined ? techStack : group.techStack;
        group.tools = tools !== undefined ? tools : group.tools;

        await group.save();
        res.json(group);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Evaluate Team Composition against Proposal
// @route   POST /api/groups/:groupId/evaluate
// @access  Private (Teacher/Admin)
exports.evaluateTeam = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Only teachers and admins can evaluate teams' });
        }

        const group = await Group.findById(req.params.groupId).populate('members.student', 'name');
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Check if proposal fields are filled
        if (!group.projectTitle || !group.projectDescription || !group.problemStatement || group.techStack.length === 0) {
            return res.status(400).json({ message: 'Group project proposal must be fully filled out first.' });
        }

        // Get full member details from StudentProfile
        const memberIds = group.members.map(m => m.student._id || m.student);
        const profiles = await StudentProfile.find({ user: { $in: memberIds } }).populate('user', 'name');

        const project_data = {
            projectTitle: group.projectTitle,
            projectDescription: group.projectDescription,
            problemStatement: group.problemStatement,
            techStack: group.techStack,
            tools: group.tools
        };

        const axios = require('axios');
        const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

        const aiResponse = await axios.post(`${AI_SERVICE_URL}/evaluate-team`, {
            project_data,
            members: profiles
        });

        res.json(aiResponse.data);
    } catch (err) {
        console.error(err.message);
        if (err.response && err.response.data) {
            return res.status(500).json({ message: 'AI Service Error', details: err.response.data });
        }
        res.status(500).send('Server Error');
    }
};
