const mongoose = require('mongoose')

const JoinRequestSchema = new mongoose.Schema({
    projectNotice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectNotice'
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
})

JoinRequestSchema.index({ student: 1 })
JoinRequestSchema.index({ group: 1 })
JoinRequestSchema.index({ status: 1 })

module.exports = mongoose.model('JoinRequest', JoinRequestSchema)
