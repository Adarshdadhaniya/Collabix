require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collabix';

const COLLEGE_STRUCTURE = {
  "Computer Science": {
    1: ["A", "B", "C", "D"],
    2: ["A", "B", "C", "D"],
    3: ["A", "B", "C", "D"],
    4: ["A", "B", "C", "D"]
  },
  "Information Science": {
    1: ["A", "B", "C"],
    2: ["A", "B", "C"],
    3: ["A", "B", "C"],
    4: ["A", "B", "C"]
  },
  "Electronics": {
    1: ["A", "B"],
    2: ["A", "B"],
    3: ["A", "B"],
    4: ["A", "B"]
  },
  "Mechanical": {
    1: ["A"],
    2: ["A"],
    3: ["A"],
    4: ["A"]
  }
};

const getInitials = (dept) => {
  return dept.split(' ').map(w => w[0]).join('').toUpperCase();
};

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

    // 1. Create Admin
    console.log('Creating Admin...');
    const admin = new User({
      name: 'System Admin',
      email: 'admin@collabix.com',
      password: hashedPassword,
      role: 'admin',
      profileCompleted: true
    });
    await admin.save();

    // 2. Create Teachers
    console.log('Creating Teachers...');
    const teachersData = [
      { name: 'Professor Smith', email: 'smith@college.edu', role: 'teacher', profileCompleted: true, password: hashedPassword },
      { name: 'Professor Jones', email: 'jones@college.edu', role: 'teacher', profileCompleted: true, password: hashedPassword }
    ];
    await User.insertMany(teachersData);

    // 3. Create Students based on structure
    console.log('Generating Students...');
    const studentUsers = [];
    const studentProfilesData = [];
    let studentCounter = 1;

    for (const [dept, years] of Object.entries(COLLEGE_STRUCTURE)) {
      const deptInitials = getInitials(dept);
      
      for (const [yearStr, sections] of Object.entries(years)) {
        const year = Number(yearStr);
        
        for (const section of sections) {
          
          // Generate 5 students per section
          for (let i = 1; i <= 5; i++) {
            const studentId = String(studentCounter).padStart(3, '0');
            const username = `${deptInitials}_Yr${year}_Sec${section}_St${i}`;
            const email = `${username.toLowerCase()}@student.edu`;
            const name = `Student ${username}`;
            const usn = `1RV${24 - year}${deptInitials}${studentId}`;

            // We generate the user object
            const userObj = new User({
              _id: new mongoose.Types.ObjectId(),
              name: name,
              email: email,
              password: hashedPassword,
              role: 'student',
              profileCompleted: true
            });
            studentUsers.push(userObj);

            // We generate the profile object
            const profileObj = {
              user: userObj._id,
              usn: usn,
              department: dept,
              year: year,
              section: section,
              cgpa: Number((Math.random() * (10 - 6) + 6).toFixed(2)), // Random CGPA between 6 and 10
              skills: ['React', 'JavaScript', 'Python'].sort(() => 0.5 - Math.random()).slice(0, 2), // random skills
              github: `github.com/${username.toLowerCase()}`,
              linkedin: `linkedin.com/in/${username.toLowerCase()}`
            };
            studentProfilesData.push(profileObj);
            
            studentCounter++;
          }
        }
      }
    }

    console.log(`Saving ${studentUsers.length} student accounts...`);
    // Insert in batches if necessary, but 200 is fine for a single insertMany
    await User.insertMany(studentUsers);
    
    console.log(`Saving ${studentProfilesData.length} student profiles...`);
    await StudentProfile.insertMany(studentProfilesData);

    console.log('✅ Database successfully initialized!');
    console.log('--------------------------------------------------');
    console.log('Test Accounts (Password for all is "password123"):');
    console.log('Admin:     admin@collabix.com');
    console.log('Teachers:  smith@college.edu, jones@college.edu');
    console.log(`Students:  Generated ${studentUsers.length} total students.`);
    console.log('Example:   cs_yr1_seca_st1@student.edu');
    console.log('Example:   is_yr3_secb_st5@student.edu');
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
};

seedDatabase();
