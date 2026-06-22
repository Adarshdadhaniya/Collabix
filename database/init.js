// database/init.js

const mongoose = require('mongoose');

// ✅ ENRICHED STUDENT SCHEMA
const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  
  // ✅ NEW: Enriched skill structure
  skills: {
    programming_languages: [
      {
        name: { type: String },                    // "Python", "JavaScript"
        proficiency: { 
          type: String, 
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
          default: 'intermediate'
        },
        years_of_experience: { type: Number },     // 2, 5, etc.
        projects_count: { type: Number },          // How many projects used this
        last_used: { type: Date }                  // Recency matters
      }
    ],
    
    frameworks: [
      {
        name: { type: String },                    // "React", "Django", "Unity"
        proficiency: { 
          type: String, 
          enum: ['beginner', 'intermediate', 'advanced'],
          default: 'intermediate'
        },
        years_of_experience: { type: Number },
        projects_count: { type: Number }
      }
    ],
    
    databases: [
      {
        name: { type: String },
        proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
        years_of_experience: { type: Number }
      }
    ],
    
    tools: [
      {
        name: { type: String },                    // "Git", "Docker", "AWS"
        proficiency: { type: String },
        years_of_experience: { type: Number }
      }
    ],
    
    soft_skills: [
      {
        name: { type: String },                    // "Leadership", "Communication"
        level: { type: String, enum: ['basic', 'intermediate', 'advanced'] }
      }
    ],
    
    domains: [String]                              // "Web Development", "Game Dev", "DevOps"
  },
  
  // ✅ NEW: Project portfolio
  projects: [
    {
      title: { type: String },
      description: { type: String },
      technologies: [String],                      // ["React", "Node.js", "MongoDB"]
      role: { type: String },                      // "Frontend Lead", "Solo Dev"
      impact: { type: String },                    // "1K+ users", "Reduced latency by 40%"
      link: { type: String }
    }
  ],
  
  // ✅ NEW: Experience summary
  experience_summary: {
    total_years: { type: Number },
    primary_domain: { type: String },             // "Web Development"
    strongest_skill: { type: String },            // "React"
    learning_velocity: { type: String, enum: ['slow', 'moderate', 'fast'] }
  },
  
  // ✅ NEW: Interest & availability
  interests: [String],                            // ["Frontend", "AI/ML"]
  availability: { 
    type: String, 
    enum: ['immediately', '1-2 weeks', '3+ weeks']
  },
  
  // Metadata
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// INDEX FOR FAST QUERIES
StudentSchema.index({ 'skills.programming_languages.name': 1 });
StudentSchema.index({ 'skills.frameworks.name': 1 });
StudentSchema.index({ 'interests': 1 });

module.exports = mongoose.model('Student', StudentSchema);
