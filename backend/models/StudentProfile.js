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
    skills: {
        programming_languages: [
            {
                name: { type: String },
                proficiency: { 
                    type: String, 
                    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
                    default: 'intermediate'
                },
                years_of_experience: { type: Number },
                projects_count: { type: Number },
                last_used: { type: Date }
            }
        ],
        frameworks: [
            { 
                name: { type: String }, 
                proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' }
            }
        ],
        databases: [
            { name: { type: String } }
        ],
        tools: [
            { name: { type: String } }
        ],
        soft_skills: [
            { name: { type: String } }
        ]
    },
    projects: [
        {
            title: { type: String },
            description: { type: String },
            tech_stack: [{ type: String }],
            complexity_score: { type: Number, min: 1, max: 10 },
            role: { type: String },
            link: { type: String }
        }
    ],
    experience_summary: {
        total_years: { type: Number },
        primary_domain: { type: String },
        strongest_skill: { type: String },
        learning_velocity: { type: String, enum: ['slow', 'moderate', 'fast'] }
    },
    interests: [String],
    availability: { 
        type: String, 
        enum: ['immediately', '1-2 weeks', '3+ weeks']
    },
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
