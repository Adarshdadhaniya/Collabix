// scripts/populate_skills.js

const mongoose = require('mongoose');
const Student = require('../database/init');
const dotenv = require('dotenv');

// We need to load environment variables from backend/.env if possible, or provide a fallback connection string
dotenv.config({ path: '../backend/.env' });
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collabix';

async function enrichStudentSkills() {
  const enrichedData = [
    {
      name: "Alice Johnson",
      email: "alice@example.com",
      skills: {
        programming_languages: [
          { 
            name: "JavaScript", 
            proficiency: "advanced", 
            years_of_experience: 4,
            projects_count: 8,
            last_used: new Date()
          },
          { 
            name: "Python", 
            proficiency: "intermediate", 
            years_of_experience: 2,
            projects_count: 3
          }
        ],
        frameworks: [
          { 
            name: "React", 
            proficiency: "advanced", 
            years_of_experience: 3,
            projects_count: 5
          },
          { 
            name: "Next.js", 
            proficiency: "intermediate", 
            years_of_experience: 1,
            projects_count: 2
          }
        ],
        databases: [
          { 
            name: "MongoDB", 
            proficiency: "advanced", 
            years_of_experience: 3
          },
          { 
            name: "PostgreSQL", 
            proficiency: "intermediate", 
            years_of_experience: 1
          }
        ],
        tools: [
          { name: "Git", proficiency: "advanced", years_of_experience: 4 },
          { name: "Docker", proficiency: "intermediate", years_of_experience: 1 }
        ],
        soft_skills: [
          { name: "Leadership", level: "advanced" },
          { name: "Communication", level: "intermediate" },
          { name: "Problem Solving", level: "advanced" }
        ],
        domains: ["Web Development", "Frontend Specialist"]
      },
      
      projects: [
        {
          title: "E-commerce Platform",
          description: "Full-stack marketplace with payment integration",
          technologies: ["React", "Node.js", "MongoDB", "Stripe"],
          role: "Frontend Lead",
          impact: "5K+ users, $50K+ transactions",
          link: "https://example.com"
        },
        {
          title: "Task Management App",
          description: "Real-time collaborative task manager",
          technologies: ["React", "Firebase", "Tailwind CSS"],
          role: "Solo Dev",
          impact: "1K+ active users"
        }
      ],
      
      experience_summary: {
        total_years: 4,
        primary_domain: "Web Development",
        strongest_skill: "React",
        learning_velocity: "fast"
      },
      
      interests: ["Frontend Architecture", "Performance Optimization"],
      availability: "immediately"
    }
  ];

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to database...");
    
    // Clear existing Student data to prevent duplicates on multiple runs
    await Student.deleteMany({});
    
    await Student.insertMany(enrichedData);
    console.log("✅ Students enriched successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

enrichStudentSkills();
