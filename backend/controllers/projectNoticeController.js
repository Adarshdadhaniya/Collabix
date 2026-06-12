const ProjectNotice = require('../models/ProjectNotice');
const StudentProfile = require('../models/StudentProfile');
const Group = require('../models/Group');

exports.createProjectNotice = async (req, res) => {
    try {
        const {
            title,
            description,
            minTeamSize,
            maxTeamSize,
            visibilityType,
            leaderPolicy,
            eligibilityRules,
            assignedLeaders
        } = req.body;

        let finalAssignedLeaders = assignedLeaders || [];

        // If policy is highest_cgpa, automatically select top leaders
        if (leaderPolicy === 'highest_cgpa') {
            if (eligibilityRules && eligibilityRules.length > 0) {
                const orConditions = eligibilityRules.map(rule => ({
                    department: rule.department,
                    year: Number(rule.year),
                    section: rule.section
                }));

                const profiles = await StudentProfile.find({ $or: orConditions })
                    .sort({ cgpa: -1 });

                const numLeaders = Math.ceil(profiles.length / (minTeamSize || 1));
                finalAssignedLeaders = profiles.slice(0, numLeaders).map(p => p.user);
            }
        }

        const projectNotice = new ProjectNotice({
            title,
            description,
            createdBy: req.user._id,
            eligibilityRules,
            minTeamSize,
            maxTeamSize,
            visibilityType,
            leaderPolicy,
            assignedLeaders: finalAssignedLeaders
        });

        await projectNotice.save();
        res.status(201).json(projectNotice);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error creating project notice', error: err.message });
    }
};

exports.getProjectNotices = async (req, res) => {
    try {
        if (req.user.role === 'student') {
            const profile = await StudentProfile.findOne({ user: req.user._id });
            if (!profile) {
                return res.json([]);
            }

            // Filter notices matching student's department, year, and section
            const notices = await ProjectNotice.find({
                eligibilityRules: {
                    $elemMatch: {
                        department: profile.department,
                        year: profile.year,
                        section: profile.section
                    }
                }
            }).sort({ createdAt: -1 });

            return res.json(notices);
        } else {
            const notices = await ProjectNotice.find({}).sort({ createdAt: -1 });
            return res.json(notices);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching project notices', error: err.message });
    }
};

exports.getProjectNoticeById = async (req, res) => {
    try {
        const notice = await ProjectNotice.findById(req.params.projectId);
        if (!notice) {
            return res.status(404).json({ message: 'Project notice not found' });
        }
        res.json(notice);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching project notice', error: err.message });
    }
};

exports.getEligibleStudentsForTriplets = async (req, res) => {
    try {
        const { eligibilityRules } = req.body;
        if (!eligibilityRules || eligibilityRules.length === 0) {
            return res.json([]);
        }

        const orConditions = eligibilityRules.map(rule => ({
            department: rule.department,
            year: Number(rule.year),
            section: rule.section
        }));

        const profiles = await StudentProfile.find({ $or: orConditions })
            .populate('user', 'name email')
            .sort({ cgpa: -1 });

        const formatted = profiles
            .filter(p => p.user)
            .map(p => ({
                _id: p.user._id,
                name: p.user.name,
                profile: {
                    department: p.department,
                    year: p.year,
                    section: p.section,
                    cgpa: p.cgpa
                }
            }));

        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching eligible students', error: err.message });
    }
};

exports.getUnassignedStudents = async (req, res) => {
    try {
        const { projectId } = req.params;
        const projectNotice = await ProjectNotice.findById(projectId);
        if (!projectNotice) {
            return res.status(404).json({ message: 'Project notice not found' });
        }

        const groups = await Group.find({ projectNotice: projectId });
        const assignedStudentIds = [];
        groups.forEach(g => {
            if (g.members) {
                g.members.forEach(m => {
                    if (m.student) {
                        assignedStudentIds.push(m.student.toString());
                    }
                });
            }
        });

        const orConditions = projectNotice.eligibilityRules.map(rule => ({
            department: rule.department,
            year: Number(rule.year),
            section: rule.section
        }));

        const profiles = await StudentProfile.find({
            $and: [
                { $or: orConditions },
                { user: { $nin: assignedStudentIds } }
            ]
        }).populate('user', 'name email');

        const formatted = profiles
            .filter(p => p.user)
            .map(p => ({
                _id: p.user._id,
                name: p.user.name,
                profile: {
                    department: p.department,
                    year: p.year,
                    section: p.section,
                    cgpa: p.cgpa
                }
            }));

        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching unassigned students', error: err.message });
    }
};

