const mongoose = require('mongoose')

const GroupSchema = new mongoose.Schema({
    projectNotice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectNotice'
    },
    name: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    leader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    members: [
        {
            student: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            joinedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    memberCount: {
        type: Number,
        default: 1
    },
    status: {
        type: String,
        enum: ['forming', 'completed'],
        default: 'forming'
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    projectTitle: {
        type: String,
        default: ''
    },
    projectDescription: {
        type: String,
        default: ''
    },
    problemStatement: {
        type: String,
        default: ''
    },
    techStack: {
        type: [String],
        default: []
    },
    tools: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
})

GroupSchema.index({ projectNotice: 1 })
GroupSchema.index({ leader: 1 })
GroupSchema.index({ "members.student": 1 })

module.exports = mongoose.model('Group', GroupSchema)
