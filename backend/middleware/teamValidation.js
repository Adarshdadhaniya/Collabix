const ProjectNotice = require('../models/ProjectNotice');
const Group = require('../models/Group');
const StudentProfile = require('../models/StudentProfile');

// Middleware to validate before adding a member to a group
exports.validateTeamRules = async (req, res, next) => {
    try {
        const { projectId, groupId, studentId } = req.body; // Expect these in the request body for joining/inviting

        // Fetch required documents
        const project = await ProjectNotice.findById(projectId);
        const group = await Group.findById(groupId).populate('members.student');
        const studentProfile = await StudentProfile.findOne({ user: studentId });

        if (!project || !group || !studentProfile) {
            return res.status(404).json({ message: 'Project, Group, or Student not found' });
        }

        if (group.isLocked) {
            return res.status(400).json({ message: 'Group is locked and cannot accept new members' });
        }

        // 1. Team Size Limit Check
        if (group.memberCount >= project.maxTeamSize) {
            return res.status(400).json({ message: 'Group has reached maximum team size' });
        }

        // 2. Duplicate Membership Check
        const isAlreadyInProject = studentProfile.currentGroups.some(
            cg => cg.projectNotice.toString() === projectId
        );
        if (isAlreadyInProject) {
            return res.status(400).json({ message: 'Student is already in a group for this project' });
        }

        // 3. Eligibility Checks (Department, Year, Section)
        if (project.eligibleDepartments.length > 0 && !project.eligibleDepartments.includes(studentProfile.department)) {
            return res.status(400).json({ message: 'Student department is not eligible' });
        }
        if (project.eligibleYears.length > 0 && !project.eligibleYears.includes(studentProfile.year)) {
            return res.status(400).json({ message: 'Student year is not eligible' });
        }
        if (project.eligibleSections.length > 0 && !project.eligibleSections.includes(studentProfile.section)) {
            return res.status(400).json({ message: 'Student section is not eligible' });
        }

        // 4. CGPA Constraints (Optional check: We can ensure the new member helps satisfy rules, 
        // but typically final CGPA validation happens when locking the group. We can just pass for now.)

        // If all checks pass, move to the next handler
        next();

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error during validation');
    }
};
