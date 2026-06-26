require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collabix';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Curated student profiles for testing LLM matching
const TEST_STUDENTS = [
  // ============= FRONTEND SPECIALISTS =============
  {
    name: 'Alice Chen',
    usn: '1RV22CS001',
    department: 'Computer Science',
    year: 3,
    section: 'A',
    email: 'alice.chen@student.edu',
    cgpa: 8.9,
    skills: {
      programming_languages: [
        { name: 'JavaScript', proficiency: 'expert', years_of_experience: 3, projects_count: 8 },
        { name: 'TypeScript', proficiency: 'advanced', years_of_experience: 2, projects_count: 6 },
        { name: 'HTML/CSS', proficiency: 'expert', years_of_experience: 3, projects_count: 10 }
      ],
      frameworks: [
        { name: 'React', proficiency: 'expert', years_of_experience: 3, projects_count: 7 },
        { name: 'Next.js', proficiency: 'advanced', years_of_experience: 2, projects_count: 4 },
        { name: 'Tailwind CSS', proficiency: 'expert', years_of_experience: 2, projects_count: 5 }
      ],
      databases: [
        { name: 'Firebase' },
        { name: 'PostgreSQL' }
      ],
      tools: [
        { name: 'Git' },
        { name: 'Figma' },
        { name: 'Webpack' },
        { name: 'Docker' }
      ],
      soft_skills: [
        { name: 'UI/UX Design' },
        { name: 'Communication' },
        { name: 'Teamwork' }
      ]
    },
    projects: [
      {
        title: 'E-Commerce Platform UI',
        description: 'Built responsive React frontend with TypeScript for an e-commerce platform.',
        tech_stack: ['React', 'TypeScript', 'Tailwind CSS', 'REST API'],
        complexity_score: 8,
        role: 'Lead Developer'
      },
      {
        title: 'Design System Library',
        description: 'Created reusable component library with Storybook documentation.',
        tech_stack: ['React', 'Storybook', 'TypeScript'],
        complexity_score: 7,
        role: 'Full Stack Developer'
      }
    ],
    experience_summary: {
      total_years: 3,
      primary_domain: 'Web Development',
      strongest_skill: 'React',
      learning_velocity: 'fast'
    },
    interests: ['Web Development', 'UI/UX Design', 'Web3'],
    availability: 'immediately',
    github: 'github.com/alice-chen',
    linkedin: 'linkedin.com/in/alice-chen'
  },

  // ============= BACKEND SPECIALISTS =============
  {
    name: 'Bob Sharma',
    usn: '1RV22CS002',
    department: 'Computer Science',
    year: 3,
    section: 'A',
    email: 'bob.sharma@student.edu',
    cgpa: 8.7,
    skills: {
      programming_languages: [
        { name: 'Python', proficiency: 'expert', years_of_experience: 3, projects_count: 9 },
        { name: 'Java', proficiency: 'advanced', years_of_experience: 2, projects_count: 5 },
        { name: 'SQL', proficiency: 'expert', years_of_experience: 3, projects_count: 8 }
      ],
      frameworks: [
        { name: 'Django', proficiency: 'expert', years_of_experience: 2, projects_count: 4 },
        { name: 'Flask', proficiency: 'advanced', years_of_experience: 2, projects_count: 3 },
        { name: 'Spring Boot', proficiency: 'advanced', years_of_experience: 1, projects_count: 2 }
      ],
      databases: [
        { name: 'PostgreSQL' },
        { name: 'MongoDB' },
        { name: 'Redis' }
      ],
      tools: [
        { name: 'Docker' },
        { name: 'Git' },
        { name: 'Postman' },
        { name: 'Linux' },
        { name: 'AWS' }
      ],
      soft_skills: [
        { name: 'Problem Solving' },
        { name: 'Teamwork' },
        { name: 'Critical Thinking' }
      ]
    },
    projects: [
      {
        title: 'REST API for SaaS Platform',
        description: 'Designed and implemented scalable REST API using Django with PostgreSQL.',
        tech_stack: ['Python', 'Django', 'PostgreSQL', 'Docker'],
        complexity_score: 9,
        role: 'Lead Developer'
      },
      {
        title: 'Microservices Migration',
        description: 'Migrated monolithic Flask app to microservices architecture.',
        tech_stack: ['Flask', 'Docker', 'AWS', 'Python'],
        complexity_score: 8,
        role: 'Backend Engineer'
      }
    ],
    experience_summary: {
      total_years: 3,
      primary_domain: 'Backend Engineering',
      strongest_skill: 'Django',
      learning_velocity: 'fast'
    },
    interests: ['Backend Engineering', 'Cloud Architecture', 'DevOps'],
    availability: 'immediately',
    github: 'github.com/bob-sharma',
    linkedin: 'linkedin.com/in/bob-sharma'
  },

  // ============= ML/AI SPECIALISTS =============
  {
    name: 'Priya Patel',
    usn: '1RV22CS003',
    department: 'Computer Science',
    year: 4,
    section: 'B',
    email: 'priya.patel@student.edu',
    cgpa: 9.1,
    skills: {
      programming_languages: [
        { name: 'Python', proficiency: 'expert', years_of_experience: 4, projects_count: 12 },
        { name: 'R', proficiency: 'advanced', years_of_experience: 2, projects_count: 4 },
        { name: 'Java', proficiency: 'intermediate', years_of_experience: 1, projects_count: 2 }
      ],
      frameworks: [
        { name: 'TensorFlow', proficiency: 'expert', years_of_experience: 3, projects_count: 6 },
        { name: 'PyTorch', proficiency: 'advanced', years_of_experience: 2, projects_count: 5 },
        { name: 'Scikit-Learn', proficiency: 'expert', years_of_experience: 3, projects_count: 8 }
      ],
      databases: [
        { name: 'PostgreSQL' },
        { name: 'MongoDB' }
      ],
      tools: [
        { name: 'Jupyter' },
        { name: 'Git' },
        { name: 'AWS' },
        { name: 'Linux' }
      ],
      soft_skills: [
        { name: 'Problem Solving' },
        { name: 'Critical Thinking' },
        { name: 'Communication' }
      ]
    },
    projects: [
      {
        title: 'Computer Vision Pipeline',
        description: 'Developed CNN model for object detection achieving 94% accuracy.',
        tech_stack: ['Python', 'TensorFlow', 'OpenCV'],
        complexity_score: 10,
        role: 'Lead Developer'
      },
      {
        title: 'Recommendation System',
        description: 'Built collaborative filtering system using PyTorch for e-commerce.',
        tech_stack: ['Python', 'PyTorch', 'PostgreSQL'],
        complexity_score: 9,
        role: 'Full Stack Developer'
      }
    ],
    experience_summary: {
      total_years: 4,
      primary_domain: 'Machine Learning',
      strongest_skill: 'TensorFlow',
      learning_velocity: 'fast'
    },
    interests: ['Machine Learning', 'Data Science', 'AI'],
    availability: 'immediately',
    github: 'github.com/priya-patel',
    linkedin: 'linkedin.com/in/priya-patel'
  },

  // ============= DEVOPS/INFRASTRUCTURE SPECIALIST =============
  {
    name: 'Dev Kumar',
    usn: '1RV22CS004',
    department: 'Computer Science',
    year: 3,
    section: 'C',
    email: 'dev.kumar@student.edu',
    cgpa: 8.5,
    skills: {
      programming_languages: [
        { name: 'Python', proficiency: 'advanced', years_of_experience: 2, projects_count: 5 },
        { name: 'Go', proficiency: 'intermediate', years_of_experience: 1, projects_count: 2 },
        { name: 'Bash', proficiency: 'expert', years_of_experience: 3, projects_count: 10 }
      ],
      frameworks: [
        { name: 'Docker', proficiency: 'expert', years_of_experience: 2, projects_count: 6 },
        { name: 'Kubernetes', proficiency: 'advanced', years_of_experience: 2, projects_count: 4 },
        { name: 'Terraform', proficiency: 'advanced', years_of_experience: 1, projects_count: 3 }
      ],
      databases: [
        { name: 'PostgreSQL' },
        { name: 'Redis' }
      ],
      tools: [
        { name: 'AWS' },
        { name: 'GCP' },
        { name: 'Jenkins' },
        { name: 'Git' },
        { name: 'Linux' }
      ],
      soft_skills: [
        { name: 'Problem Solving' },
        { name: 'Teamwork' },
        { name: 'Time Management' }
      ]
    },
    projects: [
      {
        title: 'CI/CD Pipeline Setup',
        description: 'Designed and implemented complete CI/CD pipeline using Jenkins and Kubernetes.',
        tech_stack: ['Docker', 'Kubernetes', 'Jenkins', 'AWS'],
        complexity_score: 9,
        role: 'Lead Developer'
      },
      {
        title: 'Infrastructure as Code',
        description: 'Built entire infrastructure setup using Terraform for multi-region deployment.',
        tech_stack: ['Terraform', 'AWS', 'Python'],
        complexity_score: 8,
        role: 'Full Stack Developer'
      }
    ],
    experience_summary: {
      total_years: 3,
      primary_domain: 'DevOps',
      strongest_skill: 'Kubernetes',
      learning_velocity: 'fast'
    },
    interests: ['DevOps', 'Cloud Architecture', 'Open Source'],
    availability: 'immediately',
    github: 'github.com/dev-kumar',
    linkedin: 'linkedin.com/in/dev-kumar'
  },

  // ============= FULL STACK GENERALIST =============
  {
    name: 'Emma Wilson',
    usn: '1RV22IS001',
    department: 'Information Science',
    year: 3,
    section: 'B',
    email: 'emma.wilson@student.edu',
    cgpa: 8.3,
    skills: {
      programming_languages: [
        { name: 'JavaScript', proficiency: 'advanced', years_of_experience: 2, projects_count: 5 },
        { name: 'Python', proficiency: 'advanced', years_of_experience: 2, projects_count: 4 },
        { name: 'Java', proficiency: 'intermediate', years_of_experience: 1, projects_count: 2 }
      ],
      frameworks: [
        { name: 'React', proficiency: 'advanced', years_of_experience: 2, projects_count: 4 },
        { name: 'Express', proficiency: 'intermediate', years_of_experience: 1, projects_count: 2 },
        { name: 'Django', proficiency: 'intermediate', years_of_experience: 1, projects_count: 2 }
      ],
      databases: [
        { name: 'MongoDB' },
        { name: 'PostgreSQL' },
        { name: 'Firebase' }
      ],
      tools: [
        { name: 'Git' },
        { name: 'Docker' },
        { name: 'AWS' },
        { name: 'Figma' }
      ],
      soft_skills: [
        { name: 'Teamwork' },
        { name: 'Communication' },
        { name: 'Leadership' }
      ]
    },
    projects: [
      {
        title: 'Full Stack Social App',
        description: 'Built complete social networking platform with React frontend and Express backend.',
        tech_stack: ['React', 'Express', 'MongoDB'],
        complexity_score: 7,
        role: 'Full Stack Developer'
      },
      {
        title: 'Admin Dashboard',
        description: 'Created admin dashboard with Python backend and React frontend.',
        tech_stack: ['React', 'Django', 'PostgreSQL'],
        complexity_score: 6,
        role: 'Full Stack Developer'
      }
    ],
    experience_summary: {
      total_years: 2,
      primary_domain: 'Web Development',
      strongest_skill: 'React',
      learning_velocity: 'fast'
    },
    interests: ['Web Development', 'Open Source', 'Cloud Computing'],
    availability: '1-2 weeks',
    github: 'github.com/emma-wilson',
    linkedin: 'linkedin.com/in/emma-wilson'
  },

  // ============= JUNIOR WITH LIMITED SKILLS =============
  {
    name: 'Rahul Singh',
    usn: '1RV23CS001',
    department: 'Computer Science',
    year: 2,
    section: 'D',
    email: 'rahul.singh@student.edu',
    cgpa: 7.2,
    skills: {
      programming_languages: [
        { name: 'Python', proficiency: 'beginner', years_of_experience: 1, projects_count: 2 },
        { name: 'JavaScript', proficiency: 'beginner', years_of_experience: 1, projects_count: 1 }
      ],
      frameworks: [
        { name: 'React', proficiency: 'beginner', years_of_experience: 0, projects_count: 1 }
      ],
      databases: [
        { name: 'SQLite' }
      ],
      tools: [
        { name: 'Git' },
        { name: 'VS Code' }
      ],
      soft_skills: [
        { name: 'Learning' },
        { name: 'Teamwork' }
      ]
    },
    projects: [
      {
        title: 'To-Do App',
        description: 'Simple to-do app built with React for learning purposes.',
        tech_stack: ['React', 'JavaScript'],
        complexity_score: 3,
        role: 'Solo Developer'
      }
    ],
    experience_summary: {
      total_years: 1,
      primary_domain: 'Web Development',
      strongest_skill: 'Python',
      learning_velocity: 'moderate'
    },
    interests: ['Web Development', 'Open Source'],
    availability: '3+ weeks',
    github: 'github.com/rahul-singh',
    linkedin: 'linkedin.com/in/rahul-singh'
  },

  // ============= CYBERSECURITY SPECIALIST =============
  {
    name: 'Zara Ahmed',
    usn: '1RV22CS005',
    department: 'Computer Science',
    year: 4,
    section: 'A',
    email: 'zara.ahmed@student.edu',
    cgpa: 8.8,
    skills: {
      programming_languages: [
        { name: 'Python', proficiency: 'expert', years_of_experience: 3, projects_count: 8 },
        { name: 'C++', proficiency: 'advanced', years_of_experience: 2, projects_count: 4 },
        { name: 'Go', proficiency: 'intermediate', years_of_experience: 1, projects_count: 2 }
      ],
      frameworks: [
        { name: 'Flask', proficiency: 'advanced', years_of_experience: 2, projects_count: 3 }
      ],
      databases: [
        { name: 'PostgreSQL' },
        { name: 'MongoDB' }
      ],
      tools: [
        { name: 'Linux' },
        { name: 'Git' },
        { name: 'Docker' },
        { name: 'AWS' },
        { name: 'Burp Suite' }
      ],
      soft_skills: [
        { name: 'Problem Solving' },
        { name: 'Critical Thinking' },
        { name: 'Communication' }
      ]
    },
    projects: [
      {
        title: 'Vulnerability Scanner Tool',
        description: 'Built automated vulnerability scanning tool for web applications.',
        tech_stack: ['Python', 'Flask', 'PostgreSQL'],
        complexity_score: 8,
        role: 'Lead Developer'
      },
      {
        title: 'Penetration Testing Framework',
        description: 'Developed framework for automated penetration testing.',
        tech_stack: ['Python', 'C++', 'Linux'],
        complexity_score: 9,
        role: 'Full Stack Developer'
      }
    ],
    experience_summary: {
      total_years: 3,
      primary_domain: 'Cybersecurity',
      strongest_skill: 'Python',
      learning_velocity: 'fast'
    },
    interests: ['Cybersecurity', 'Cloud Architecture', 'Open Source'],
    availability: 'immediately',
    github: 'github.com/zara-ahmed',
    linkedin: 'linkedin.com/in/zara-ahmed'
  },

  // ============= MOBILE DEVELOPER =============
  {
    name: 'Jacob Lee',
    usn: '1RV22CS006',
    department: 'Computer Science',
    year: 3,
    section: 'B',
    email: 'jacob.lee@student.edu',
    cgpa: 8.1,
    skills: {
      programming_languages: [
        { name: 'Kotlin', proficiency: 'advanced', years_of_experience: 2, projects_count: 5 },
        { name: 'Swift', proficiency: 'intermediate', years_of_experience: 1, projects_count: 2 },
        { name: 'Dart', proficiency: 'advanced', years_of_experience: 2, projects_count: 4 }
      ],
      frameworks: [
        { name: 'Flutter', proficiency: 'advanced', years_of_experience: 2, projects_count: 4 },
        { name: 'React Native', proficiency: 'intermediate', years_of_experience: 1, projects_count: 2 }
      ],
      databases: [
        { name: 'Firebase' },
        { name: 'SQLite' }
      ],
      tools: [
        { name: 'Git' },
        { name: 'Android Studio' },
        { name: 'Xcode' },
        { name: 'Figma' }
      ],
      soft_skills: [
        { name: 'UI/UX Design' },
        { name: 'Teamwork' },
        { name: 'Creativity' }
      ]
    },
    projects: [
      {
        title: 'E-Commerce Mobile App',
        description: 'Built cross-platform e-commerce app using Flutter with Firebase backend.',
        tech_stack: ['Flutter', 'Firebase', 'Dart'],
        complexity_score: 8,
        role: 'Lead Developer'
      },
      {
        title: 'Fitness Tracking App',
        description: 'Native Android app for fitness tracking with real-time analytics.',
        tech_stack: ['Kotlin', 'Android', 'Firebase'],
        complexity_score: 7,
        role: 'Full Stack Developer'
      }
    ],
    experience_summary: {
      total_years: 2,
      primary_domain: 'Mobile Development',
      strongest_skill: 'Flutter',
      learning_velocity: 'fast'
    },
    interests: ['Mobile Development', 'UI/UX Design', 'Robotics'],
    availability: 'immediately',
    github: 'github.com/jacob-lee',
    linkedin: 'linkedin.com/in/jacob-lee'
  },

  // ============= DATA SCIENCE SPECIALIST =============
  {
    name: 'Nisha Gupta',
    usn: '1RV22IS002',
    department: 'Information Science',
    year: 3,
    section: 'C',
    email: 'nisha.gupta@student.edu',
    cgpa: 8.6,
    skills: {
      programming_languages: [
        { name: 'Python', proficiency: 'expert', years_of_experience: 3, projects_count: 10 },
        { name: 'R', proficiency: 'advanced', years_of_experience: 2, projects_count: 5 },
        { name: 'SQL', proficiency: 'advanced', years_of_experience: 2, projects_count: 7 }
      ],
      frameworks: [
        { name: 'Pandas', proficiency: 'expert', years_of_experience: 3, projects_count: 8 },
        { name: 'Scikit-Learn', proficiency: 'advanced', years_of_experience: 2, projects_count: 5 },
        { name: 'Matplotlib', proficiency: 'advanced', years_of_experience: 2, projects_count: 6 }
      ],
      databases: [
        { name: 'PostgreSQL' },
        { name: 'MongoDB' }
      ],
      tools: [
        { name: 'Jupyter' },
        { name: 'Git' },
        { name: 'AWS' },
        { name: 'Tableau' }
      ],
      soft_skills: [
        { name: 'Critical Thinking' },
        { name: 'Communication' },
        { name: 'Problem Solving' }
      ]
    },
    projects: [
      {
        title: 'Customer Segmentation Analysis',
        description: 'Performed customer segmentation using clustering algorithms on 1M+ records.',
        tech_stack: ['Python', 'Pandas', 'Scikit-Learn', 'PostgreSQL'],
        complexity_score: 8,
        role: 'Lead Developer'
      },
      {
        title: 'Predictive Analytics Pipeline',
        description: 'Built end-to-end data pipeline for sales forecasting.',
        tech_stack: ['Python', 'Pandas', 'PostgreSQL', 'AWS'],
        complexity_score: 7,
        role: 'Full Stack Developer'
      }
    ],
    experience_summary: {
      total_years: 3,
      primary_domain: 'Data Science',
      strongest_skill: 'Python',
      learning_velocity: 'fast'
    },
    interests: ['Data Science', 'Machine Learning', 'AI'],
    availability: '1-2 weeks',
    github: 'github.com/nisha-gupta',
    linkedin: 'linkedin.com/in/nisha-gupta'
  },
  {
  name: 'Ananya Nair',
  usn: '1RV22EE001',
  department: 'Electrical & Electronics Engineering',
  year: 3,
  section: 'A',
  email: 'ananya.nair@student.edu',
  cgpa: 8.8,
  skills: {
    programming_languages: [
      { name: 'C', proficiency: 'expert', years_of_experience: 3, projects_count: 6 },
      { name: 'Python', proficiency: 'advanced', years_of_experience: 2, projects_count: 4 }
    ],
    frameworks: [
      { name: 'Arduino', proficiency: 'expert', years_of_experience: 2, projects_count: 5 },
      { name: 'ESP32', proficiency: 'advanced', years_of_experience: 2, projects_count: 4 }
    ],
    databases: [{ name: 'Firebase' }],
    tools: [{ name: 'Keil' }, { name: 'Proteus' }, { name: 'Git' }, { name: 'MATLAB' }],
    soft_skills: [{ name: 'Leadership' }, { name: 'Problem Solving' }]
  },
  projects: [
    {
      title: 'Smart Home Automation',
      description: 'Built an IoT based smart home automation system.',
      tech_stack: ['ESP32', 'Firebase', 'Python'],
      complexity_score: 8,
      role: 'Lead Developer'
    }
  ],
  experience_summary: {
    total_years: 3,
    primary_domain: 'Embedded Systems',
    strongest_skill: 'Arduino',
    learning_velocity: 'fast'
  },
  interests: ['Embedded Systems', 'IoT', 'Automation'],
  availability: 'immediately',
  github: 'github.com/ananya-nair',
  linkedin: 'linkedin.com/in/ananya-nair'
},
{
  name: 'Karthik Rao',
  usn: '1RV22EE002',
  department: 'Electrical & Electronics Engineering',
  year: 3,
  section: 'B',
  email: 'karthik.rao@student.edu',
  cgpa: 8.6,
  skills: {
    programming_languages: [
      { name: 'Python', proficiency: 'advanced', years_of_experience: 2, projects_count: 5 },
      { name: 'C', proficiency: 'advanced', years_of_experience: 2, projects_count: 4 }
    ],
    frameworks: [
      { name: 'NodeMCU', proficiency: 'expert', years_of_experience: 2, projects_count: 5 },
      { name: 'MQTT', proficiency: 'advanced', years_of_experience: 2, projects_count: 4 }
    ],
    databases: [{ name: 'Firebase' }, { name: 'MongoDB' }],
    tools: [{ name: 'Arduino IDE' }, { name: 'Git' }, { name: 'ThingSpeak' }],
    soft_skills: [{ name: 'Communication' }, { name: 'Teamwork' }]
  },
  projects: [
    {
      title: 'Smart Agriculture System',
      description: 'IoT system for monitoring soil moisture and irrigation.',
      tech_stack: ['ESP8266', 'Firebase', 'Python'],
      complexity_score: 8,
      role: 'Lead Developer'
    }
  ],
  experience_summary: {
    total_years: 2,
    primary_domain: 'Internet of Things',
    strongest_skill: 'ESP8266',
    learning_velocity: 'fast'
  },
  interests: ['IoT', 'Cloud', 'Automation'],
  availability: '1-2 weeks',
  github: 'github.com/karthik-rao',
  linkedin: 'linkedin.com/in/karthik-rao'
},
{
  name: 'Sneha Reddy',
  usn: '1RV22EE003',
  department: 'Electrical & Electronics Engineering',
  year: 4,
  section: 'A',
  email: 'sneha.reddy@student.edu',
  cgpa: 9.0,
  skills: {
    programming_languages: [
      { name: 'MATLAB', proficiency: 'expert', years_of_experience: 3, projects_count: 6 },
      { name: 'Python', proficiency: 'intermediate', years_of_experience: 1, projects_count: 2 }
    ],
    frameworks: [
      { name: 'Simulink', proficiency: 'expert', years_of_experience: 3, projects_count: 5 }
    ],
    databases: [],
    tools: [{ name: 'MATLAB' }, { name: 'PSCAD' }, { name: 'Git' }],
    soft_skills: [{ name: 'Critical Thinking' }, { name: 'Leadership' }]
  },
  projects: [
    {
      title: 'Smart Grid Load Analysis',
      description: 'Simulation of power distribution and smart grid optimization.',
      tech_stack: ['MATLAB', 'Simulink'],
      complexity_score: 9,
      role: 'Lead Engineer'
    }
  ],
  experience_summary: {
    total_years: 3,
    primary_domain: 'Power Systems',
    strongest_skill: 'MATLAB',
    learning_velocity: 'fast'
  },
  interests: ['Renewable Energy', 'Smart Grid'],
  availability: 'immediately',
  github: 'github.com/sneha-reddy',
  linkedin: 'linkedin.com/in/sneha-reddy'
},
{
  name: 'Aditya Prakash',
  usn: '1RV22EE004',
  department: 'Electrical & Electronics Engineering',
  year: 3,
  section: 'A',
  email: 'aditya.prakash@student.edu',
  cgpa: 8.4,
  skills: {
    programming_languages: [
      { name: 'C', proficiency: 'advanced', years_of_experience: 2, projects_count: 4 }
    ],
    frameworks: [
      { name: 'KiCad', proficiency: 'expert', years_of_experience: 2, projects_count: 5 }
    ],
    databases: [],
    tools: [{ name: 'KiCad' }, { name: 'Proteus' }, { name: 'Git' }],
    soft_skills: [{ name: 'Creativity' }, { name: 'Problem Solving' }]
  },
  projects: [
    {
      title: 'Custom IoT PCB',
      description: 'Designed a compact PCB for IoT environmental monitoring.',
      tech_stack: ['KiCad', 'ESP32'],
      complexity_score: 8,
      role: 'PCB Designer'
    }
  ],
  experience_summary: {
    total_years: 2,
    primary_domain: 'PCB Design',
    strongest_skill: 'KiCad',
    learning_velocity: 'moderate'
  },
  interests: ['PCB Design', 'Embedded Hardware'],
  availability: 'immediately',
  github: 'github.com/aditya-prakash',
  linkedin: 'linkedin.com/in/aditya-prakash'
},
{
  name: 'Meera Iyer',
  usn: '1RV22EE005',
  department: 'Electrical & Electronics Engineering',
  year: 4,
  section: 'B',
  email: 'meera.iyer@student.edu',
  cgpa: 8.9,
  skills: {
    programming_languages: [
      { name: 'MATLAB', proficiency: 'expert', years_of_experience: 3, projects_count: 5 },
      { name: 'Python', proficiency: 'advanced', years_of_experience: 2, projects_count: 3 }
    ],
    frameworks: [
      { name: 'Simulink', proficiency: 'expert', years_of_experience: 3, projects_count: 5 }
    ],
    databases: [],
    tools: [{ name: 'MATLAB' }, { name: 'LabVIEW' }, { name: 'Git' }],
    soft_skills: [{ name: 'Teamwork' }, { name: 'Leadership' }]
  },
  projects: [
    {
      title: 'PID Based Motor Controller',
      description: 'Designed and simulated an industrial motor control system.',
      tech_stack: ['MATLAB', 'Simulink'],
      complexity_score: 8,
      role: 'Control Engineer'
    }
  ],
  experience_summary: {
    total_years: 3,
    primary_domain: 'Control Systems',
    strongest_skill: 'Simulink',
    learning_velocity: 'fast'
  },
  interests: ['Automation', 'Industrial Control'],
  availability: '1-2 weeks',
  github: 'github.com/meera-iyer',
  linkedin: 'linkedin.com/in/meera-iyer'
},
{
  name: 'Rahul Kulkarni',
  usn: '1RV22EE006',
  department: 'Electrical & Electronics Engineering',
  year: 4,
  section: 'A',
  email: 'rahul.kulkarni@student.edu',
  cgpa: 9.1,
  skills: {
    programming_languages: [
      { name: 'Verilog', proficiency: 'expert', years_of_experience: 3, projects_count: 5 },
      { name: 'C', proficiency: 'advanced', years_of_experience: 2, projects_count: 3 }
    ],
    frameworks: [
      { name: 'ModelSim', proficiency: 'expert', years_of_experience: 2, projects_count: 4 }
    ],
    databases: [],
    tools: [{ name: 'Cadence' }, { name: 'Xilinx Vivado' }, { name: 'Git' }],
    soft_skills: [{ name: 'Analytical Thinking' }, { name: 'Problem Solving' }]
  },
  projects: [
    {
      title: '32-bit RISC Processor',
      description: 'Designed and simulated a 32-bit processor using Verilog.',
      tech_stack: ['Verilog', 'ModelSim'],
      complexity_score: 9,
      role: 'Lead Designer'
    }
  ],
  experience_summary: {
    total_years: 3,
    primary_domain: 'VLSI Design',
    strongest_skill: 'Verilog',
    learning_velocity: 'fast'
  },
  interests: ['Semiconductor Design', 'Digital Systems'],
  availability: 'immediately',
  github: 'github.com/rahul-kulkarni',
  linkedin: 'linkedin.com/in/rahul-kulkarni'
},
{
  name: 'Pooja Sharma',
  usn: '1RV22EE007',
  department: 'Electrical & Electronics Engineering',
  year: 3,
  section: 'B',
  email: 'pooja.sharma@student.edu',
  cgpa: 8.7,
  skills: {
    programming_languages: [
      { name: 'Python', proficiency: 'advanced', years_of_experience: 2, projects_count: 3 },
      { name: 'C', proficiency: 'advanced', years_of_experience: 2, projects_count: 3 }
    ],
    frameworks: [
      { name: 'PLC Programming', proficiency: 'expert', years_of_experience: 2, projects_count: 4 }
    ],
    databases: [],
    tools: [{ name: 'Siemens TIA Portal' }, { name: 'LabVIEW' }, { name: 'Git' }],
    soft_skills: [{ name: 'Leadership' }, { name: 'Communication' }]
  },
  projects: [
    {
      title: 'Automated Conveyor System',
      description: 'Developed a PLC-controlled conveyor automation system.',
      tech_stack: ['PLC', 'TIA Portal', 'Python'],
      complexity_score: 8,
      role: 'Automation Engineer'
    }
  ],
  experience_summary: {
    total_years: 2,
    primary_domain: 'Industrial Automation',
    strongest_skill: 'PLC Programming',
    learning_velocity: 'fast'
  },
  interests: ['Automation', 'Industry 4.0', 'Robotics'],
  availability: 'immediately',
  github: 'github.com/pooja-sharma',
  linkedin: 'linkedin.com/in/pooja-sharma'
},
// ======================= MECHANICAL STUDENTS =======================

{
  name: 'Vikram Gowda',
  usn: '1RV22ME001',
  department: 'Mechanical Engineering',
  year: 4,
  section: 'A',
  email: 'vikram.gowda@student.edu',
  cgpa: 8.9,
  skills: {
    programming_languages: [
      { name: 'Python', proficiency: 'advanced', years_of_experience: 2, projects_count: 4 },
      { name: 'C++', proficiency: 'intermediate', years_of_experience: 1, projects_count: 2 }
    ],
    frameworks: [
      { name: 'ROS', proficiency: 'expert', years_of_experience: 2, projects_count: 5 },
      { name: 'OpenCV', proficiency: 'advanced', years_of_experience: 2, projects_count: 3 }
    ],
    databases: [{ name: 'SQLite' }],
    tools: [
      { name: 'SolidWorks' },
      { name: 'Gazebo' },
      { name: 'Git' },
      { name: 'MATLAB' }
    ],
    soft_skills: [
      { name: 'Leadership' },
      { name: 'Problem Solving' }
    ]
  },
  projects: [
    {
      title: 'Autonomous Warehouse Robot',
      description: 'Designed and programmed an autonomous warehouse robot using ROS.',
      tech_stack: ['ROS', 'Python', 'OpenCV', 'SolidWorks'],
      complexity_score: 9,
      role: 'Lead Developer'
    }
  ],
  experience_summary: {
    total_years: 2,
    primary_domain: 'Robotics',
    strongest_skill: 'ROS',
    learning_velocity: 'fast'
  },
  interests: ['Robotics', 'Automation', 'Computer Vision'],
  availability: 'immediately',
  github: 'github.com/vikram-gowda',
  linkedin: 'linkedin.com/in/vikram-gowda'
},

{
  name: 'Rohit Verma',
  usn: '1RV22ME002',
  department: 'Mechanical Engineering',
  year: 3,
  section: 'A',
  email: 'rohit.verma@student.edu',
  cgpa: 8.6,
  skills: {
    programming_languages: [
      { name: 'Python', proficiency: 'intermediate', years_of_experience: 1, projects_count: 2 }
    ],
    frameworks: [],
    databases: [],
    tools: [
      { name: 'SolidWorks' },
      { name: 'AutoCAD' },
      { name: 'ANSYS' },
      { name: 'Fusion 360' },
      { name: 'Git' }
    ],
    soft_skills: [
      { name: 'Creativity' },
      { name: 'Teamwork' }
    ]
  },
  projects: [
    {
      title: 'Electric Go-Kart Chassis Design',
      description: 'Designed and analyzed a lightweight chassis using SolidWorks and ANSYS.',
      tech_stack: ['SolidWorks', 'ANSYS'],
      complexity_score: 8,
      role: 'CAD Designer'
    }
  ],
  experience_summary: {
    total_years: 2,
    primary_domain: 'CAD Design',
    strongest_skill: 'SolidWorks',
    learning_velocity: 'fast'
  },
  interests: ['CAD Design', 'Product Design', 'Simulation'],
  availability: '1-2 weeks',
  github: 'github.com/rohit-verma',
  linkedin: 'linkedin.com/in/rohit-verma'
},

{
  name: 'Akash Patil',
  usn: '1RV22ME003',
  department: 'Mechanical Engineering',
  year: 4,
  section: 'A',
  email: 'akash.patil@student.edu',
  cgpa: 8.5,
  skills: {
    programming_languages: [
      { name: 'Python', proficiency: 'intermediate', years_of_experience: 1, projects_count: 2 }
    ],
    frameworks: [],
    databases: [],
    tools: [
      { name: 'SolidWorks' },
      { name: 'MATLAB' },
      { name: 'Minitab' },
      { name: 'Git' }
    ],
    soft_skills: [
      { name: 'Leadership' },
      { name: 'Problem Solving' }
    ]
  },
  projects: [
    {
      title: 'Lean Manufacturing Optimization',
      description: 'Optimized manufacturing workflow using lean manufacturing techniques.',
      tech_stack: ['Minitab', 'MATLAB'],
      complexity_score: 7,
      role: 'Manufacturing Engineer'
    }
  ],
  experience_summary: {
    total_years: 2,
    primary_domain: 'Manufacturing',
    strongest_skill: 'Lean Manufacturing',
    learning_velocity: 'fast'
  },
  interests: ['Industry 4.0', 'Manufacturing', 'Automation'],
  availability: 'immediately',
  github: 'github.com/akash-patil',
  linkedin: 'linkedin.com/in/akash-patil'
},

{
  name: 'Nikhil Shetty',
  usn: '1RV22ME004',
  department: 'Mechanical Engineering',
  year: 3,
  section: 'A',
  email: 'nikhil.shetty@student.edu',
  cgpa: 8.7,
  skills: {
    programming_languages: [
      { name: 'MATLAB', proficiency: 'advanced', years_of_experience: 2, projects_count: 3 },
      { name: 'Python', proficiency: 'intermediate', years_of_experience: 1, projects_count: 2 }
    ],
    frameworks: [],
    databases: [],
    tools: [
      { name: 'SolidWorks' },
      { name: 'ANSYS' },
      { name: 'MATLAB' },
      { name: 'Git' }
    ],
    soft_skills: [
      { name: 'Critical Thinking' },
      { name: 'Communication' }
    ]
  },
  projects: [
    {
      title: 'Electric Vehicle Powertrain Design',
      description: 'Designed and simulated an efficient electric vehicle powertrain.',
      tech_stack: ['MATLAB', 'ANSYS', 'SolidWorks'],
      complexity_score: 8,
      role: 'Automotive Engineer'
    }
  ],
  experience_summary: {
    total_years: 2,
    primary_domain: 'Automotive Engineering',
    strongest_skill: 'Vehicle Design',
    learning_velocity: 'fast'
  },
  interests: ['Electric Vehicles', 'Automotive Design', 'Simulation'],
  availability: '1-2 weeks',
  github: 'github.com/nikhil-shetty',
  linkedin: 'linkedin.com/in/nikhil-shetty'
},

{
  name: 'Aishwarya Rao',
  usn: '1RV22ME005',
  department: 'Mechanical Engineering',
  year: 4,
  section: 'A',
  email: 'aishwarya.rao@student.edu',
  cgpa: 9.1,
  skills: {
    programming_languages: [
      { name: 'MATLAB', proficiency: 'expert', years_of_experience: 3, projects_count: 5 },
      { name: 'Python', proficiency: 'advanced', years_of_experience: 2, projects_count: 3 }
    ],
    frameworks: [],
    databases: [],
    tools: [
      { name: 'ANSYS Fluent' },
      { name: 'MATLAB' },
      { name: 'SolidWorks' },
      { name: 'Git' }
    ],
    soft_skills: [
      { name: 'Analytical Thinking' },
      { name: 'Leadership' }
    ]
  },
  projects: [
    {
      title: 'Heat Exchanger Performance Analysis',
      description: 'Performed CFD analysis and thermal optimization of industrial heat exchangers.',
      tech_stack: ['ANSYS Fluent', 'MATLAB', 'SolidWorks'],
      complexity_score: 9,
      role: 'Thermal Engineer'
    }
  ],
  experience_summary: {
    total_years: 3,
    primary_domain: 'Thermal Engineering',
    strongest_skill: 'ANSYS Fluent',
    learning_velocity: 'fast'
  },
  interests: ['Thermal Systems', 'CFD', 'Energy Engineering'],
  availability: 'immediately',
  github: 'github.com/aishwarya-rao',
  linkedin: 'linkedin.com/in/aishwarya-rao'
}
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    console.log('Clearing old data to ensure clean seed...');
    await User.deleteMany();
    await StudentProfile.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create Admin
    console.log('Creating Admin...');
    const admin = new User({
      name: 'System Admin',
      email: 'admin@collabix.com',
      password: hashedPassword,
      role: 'admin',
      profileCompleted: true
    });
    await admin.save();

    // Create Teachers
    console.log('Creating Teachers...');
    const teachersData = [
      { name: 'Professor Smith', email: 'smith@college.edu', role: 'teacher', profileCompleted: true, password: hashedPassword },
      { name: 'Professor Jones', email: 'jones@college.edu', role: 'teacher', profileCompleted: true, password: hashedPassword }
    ];
    await User.insertMany(teachersData);

    // Create Students with curated profiles
    console.log('Generating Students with curated profiles...');
    const studentUsers = [];
    const studentProfilesData = [];

    for (const student of TEST_STUDENTS) {
      const userObj = new User({
        _id: new mongoose.Types.ObjectId(),
        name: student.name,
        email: student.email,
        password: hashedPassword,
        role: 'student',
        profileCompleted: true
      });
      studentUsers.push(userObj);

      const profileObj = {
        user: userObj._id,
        usn: student.usn,
        department: student.department,
        year: student.year,
        section: student.section,
        cgpa: student.cgpa,
        skills: student.skills,
        projects: student.projects,
        experience_summary: student.experience_summary,
        interests: student.interests,
        availability: student.availability,
        github: student.github,
        linkedin: student.linkedin,
        skillEmbedding: []
      };
      studentProfilesData.push(profileObj);
    }

    console.log(`Saving ${studentUsers.length} student accounts...`);
    await User.insertMany(studentUsers);

    // Generate embeddings for the profiles
    let embeddings = [];
    try {
      console.log('Generating skill embeddings for students via AI Service...');
      
      function buildEmbeddingText(student) {
        const languages = student.skills.programming_languages
          .map(skill => `${skill.name} (${skill.proficiency}, ${skill.years_of_experience} years, ${skill.projects_count} projects)`)
          .join(", ");

        const frameworks = student.skills.frameworks
          .map(skill => `${skill.name} (${skill.proficiency}, ${skill.years_of_experience} years)`)
          .join(", ");

        const databases = student.skills.databases
          .map(db => db.name)
          .join(", ");

        const tools = student.skills.tools
          .map(tool => tool.name)
          .join(", ");

        const projects = student.projects
          .map(project => `Project: ${project.title}\nDescription: ${project.description}\nRole: ${project.role}\nComplexity: ${project.complexity_score}/10\nTechnologies: ${project.tech_stack.join(", ")}`)
          .join("\n");

        return `
Candidate Profile

Primary Domain:
${student.experience_summary.primary_domain}

Strongest Skill:
${student.experience_summary.strongest_skill}

Years of Experience:
${student.experience_summary.total_years}

Programming Languages:
${languages}

Frameworks:
${frameworks}

Databases:
${databases}

Tools:
${tools}

Projects:
${projects}

Technical Interests:
${student.interests.join(", ")}

Technical Summary:
Experienced ${student.experience_summary.primary_domain} student with ${student.experience_summary.total_years} years of experience.
Strongest expertise in ${student.experience_summary.strongest_skill}.
Worked extensively with ${languages}.
Built projects involving ${student.projects.flatMap(p => p.tech_stack).filter((v, i, a) => a.indexOf(v) === i).join(", ")}.
`;
      }

      const textsToEmbed = studentProfilesData.map(p => buildEmbeddingText(p));
      
      const embedResponse = await axios.post(`${AI_SERVICE_URL}/embed`, {
        texts: textsToEmbed
      });
      embeddings = embedResponse.data.embeddings;
      console.log(`Successfully generated ${embeddings.length} skill embeddings.`);
    } catch (embedErr) {
      console.warn('⚠️ Warning: Failed to generate skill embeddings via AI Service:', embedErr.message);
      console.warn('Skill profiles will be saved with empty embeddings.');
    }

    // Assign embeddings to profiles
    for (let i = 0; i < studentProfilesData.length; i++) {
      studentProfilesData[i].skillEmbedding = embeddings[i] || [];
    }

    console.log(`Saving ${studentProfilesData.length} student profiles...`);
    await StudentProfile.insertMany(studentProfilesData);

    console.log('✅ Database successfully initialized with test data!');
    console.log('--------------------------------------------------');
    console.log('Test Accounts (Password: "password123"):');
    console.log('Admin:     admin@collabix.com');
    console.log('Teachers:  smith@college.edu, jones@college.edu');
    console.log('--------------------------------------------------');
    console.log('Test Students (for LLM Matching):');
    TEST_STUDENTS.forEach(student => {
      console.log(`${student.name.padEnd(20)} | ${student.email} | ${student.experience_summary.primary_domain}`);
    });
    console.log('--------------------------------------------------');

    // Extract name, department, year, and section of each student
    console.log('Student Details (Name | Department | Year | Section):');
    console.log('--------------------------------------------------');
    const studentInfo = TEST_STUDENTS.map(student => ({
      name: student.name,
      department: student.department,
      year: student.year,
      section: student.section
    }));
    studentInfo.forEach(info => {
      console.log(
        `${info.name.padEnd(20)} | ${info.department.padEnd(40)} | Year ${info.year} | Section ${info.section}`
      );
    });
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
};

seedDatabase();