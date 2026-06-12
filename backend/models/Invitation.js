const mongoose = require('mongoose')

const InvitationSchema = new mongoose.Schema({
    projectNotice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectNotice'
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    invitedStudent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    invitedBy: {
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

module.exports = mongoose.model('Invitation', InvitationSchema)
