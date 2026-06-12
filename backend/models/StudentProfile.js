const mongoose = require('mongoose')

const StudentProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    usn: String,
    department: String,
    year: Number,
    section: String,
    cgpa: Number,
    skills: [String],
    interests: [String],
    github: String,
    linkedin: String,
    resumeUrl: String,
    currentGroups: [
        {
            projectNotice: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ProjectNotice'
            },
            group: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Group'
            }
        }
    ],
    skillEmbedding: {
        type: [Number],
        default: []
    }
}, {
    timestamps: true
})

StudentProfileSchema.index({ cgpa: 1 })
StudentProfileSchema.index({ skills: 1 })
StudentProfileSchema.index({ year: 1 })
StudentProfileSchema.index({ section: 1 })
StudentProfileSchema.index({
    "currentGroups.projectNotice": 1
})

module.exports = mongoose.model('StudentProfile', StudentProfileSchema)
