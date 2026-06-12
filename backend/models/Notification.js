const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: [
            'join_request',
            'invitation',
            'request_accepted',
            'request_rejected'
        ]
    },
    message: String,
    isRead: {
        type: Boolean,
        default: false
    },
    relatedId: mongoose.Schema.Types.ObjectId
}, {
    timestamps: true
})

module.exports = mongoose.model('Notification', NotificationSchema)
