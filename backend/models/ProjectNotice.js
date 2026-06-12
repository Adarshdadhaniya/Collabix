const mongoose = require('mongoose')

const ProjectNoticeSchema = new mongoose.Schema({
    title: String,
    description: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    eligibilityRules: [
        {
            department: String,
            year: Number,
            section: String
        }
    ],
    minTeamSize: Number,
    maxTeamSize: Number,
    cgpaRules: [
        {
            minCgpa: Number,
            requiredCount: Number
        }
    ],
    visibilityType: {
        type: String,
        enum: ['college', 'department', 'class']
    },
    allowStudentCreatedGroups: {
        type: Boolean,
        default: true
    },
    leaderPolicy: {
        type: String,
        enum: [
            'creator_becomes_leader',
            'highest_cgpa',
            'assigned_by_teacher'
        ]
    },
    assignedLeaders: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('ProjectNotice', ProjectNoticeSchema)
