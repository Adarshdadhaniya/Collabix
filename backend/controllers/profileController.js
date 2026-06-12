const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// AI Service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// @desc    Upload resume and autofill profile
// @route   POST /api/profile/upload-resume
// @access  Private
exports.uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Prepare file for FastAPI
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));

        // Call AI Service to parse resume
        const response = await axios.post(`${AI_SERVICE_URL}/parse-resume`, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        const parsedData = response.data; // This is the structured JSON from Ollama

        // Delete the temporary file if we don't want to store it permanently yet
        // fs.unlinkSync(req.file.path);

        res.json({
            message: 'Resume parsed successfully',
            data: parsedData,
            resumeUrl: req.file.path // Path where multer saved it locally
        });

    } catch (err) {
        console.error(err.message);
        if (req.file) fs.unlinkSync(req.file.path); // cleanup on error
        res.status(500).json({ message: 'Error parsing resume', error: err.response?.data || err.message });
    }
};

// @desc    Create or update student profile
// @route   POST /api/profile
// @access  Private
exports.upsertProfile = async (req, res) => {
    console.log("-----------------------------------------");
    console.log("[POST /api/profile] upsertProfile called");
    console.log("[POST /api/profile] req.user.id:", req.user.id);
    console.log("[POST /api/profile] req.body:", req.body);
    
    try {
        const { usn, department, year, section, cgpa, skills, interests, github, linkedin, resumeUrl } = req.body;

        // Ensure skills is an array
        let parsedSkills = skills;
        if (typeof skills === 'string') {
            console.log("[POST /api/profile] 'skills' arrived as a string. Splitting into array...");
            parsedSkills = skills.split(',').map(s => s.trim()).filter(s => s);
        }
        console.log("[POST /api/profile] parsedSkills array:", parsedSkills);

        const profileFields = {
            user: req.user.id,
            usn, department, year, section, cgpa, skills: parsedSkills, interests, github, linkedin, resumeUrl
        };

        // Generate embeddings for skills
        if (parsedSkills && parsedSkills.length > 0) {
            console.log("[POST /api/profile] Generating embeddings for skills...");
            try {
                const skillsText = parsedSkills.join(' ');
                console.log(`[POST /api/profile] Calling AI_SERVICE_URL (${AI_SERVICE_URL}/embed) with text: "${skillsText}"`);
                
                const embedResponse = await axios.post(`${AI_SERVICE_URL}/embed`, {
                    texts: [skillsText]
                });
                
                console.log("[POST /api/profile] AI Service /embed success! Received embeddings of length:", embedResponse.data.embeddings[0].length);
                profileFields.skillEmbedding = embedResponse.data.embeddings[0];
            } catch (embedErr) {
                console.error("!!! [POST /api/profile] Failed to generate embeddings:", embedErr.message);
                if (embedErr.response) {
                    console.error("!!! [POST /api/profile] AI Service responded with data:", embedErr.response.data);
                }
                // We'll throw so the frontend actually knows it failed
                return res.status(500).json({ message: "Failed to generate embeddings: " + embedErr.message });
            }
        } else {
             console.log("[POST /api/profile] No skills provided, skipping embeddings generation.");
        }

        let profile = await StudentProfile.findOne({ user: req.user.id });

        if (profile) {
            console.log("[POST /api/profile] Existing profile found. Updating...");
            // Update
            profile = await StudentProfile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true }
            );
        } else {
            console.log("[POST /api/profile] No existing profile. Creating new...");
            // Create
            profile = new StudentProfile(profileFields);
            await profile.save();
            
            // Update user profileCompleted flag
            await User.findByIdAndUpdate(req.user.id, { profileCompleted: true });
        }

        console.log("[POST /api/profile] Profile saved successfully.");
        res.json(profile);

    } catch (err) {
        console.error("!!! [POST /api/profile] Server error:", err.message);
        console.error(err.stack);
        res.status(500).send('Server error');
    }
};

// @desc    Get current student's profile
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.user.id });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.json(profile);
    } catch (err) {
        console.error("Get profile error:", err.message);
        res.status(500).send('Server Error');
    }
};

// Helper function for cosine similarity
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// @desc    Search teammates (Hybrid Search)
// @route   GET /api/profile/search
// @access  Private
exports.searchTeammates = async (req, res) => {
    try {
        const { query, department, year, minCgpa, projectId } = req.query;

        // 1. Hard Filtering
        let filter = {};
        
        if (projectId) {
            const ProjectNotice = require('../models/ProjectNotice');
            const Group = require('../models/Group');
            const notice = await ProjectNotice.findById(projectId);
            
            if (notice) {
                // Filter by project triplets
                filter.$or = notice.eligibilityRules.map(rule => ({
                    department: rule.department,
                    year: rule.year,
                    section: rule.section
                }));

                // Exclude students already in a group for this project
                const groups = await Group.find({ projectNotice: projectId });
                const assignedIds = [];
                groups.forEach(g => {
                    if (g.members) {
                        g.members.forEach(m => {
                            if (m.student) {
                                assignedIds.push(m.student.toString());
                            }
                        });
                    }
                });

                // Exclude predefined leaders who shouldn't be invited as teammates
                if (notice.assignedLeaders && notice.assignedLeaders.length > 0) {
                    notice.assignedLeaders.forEach(id => {
                        assignedIds.push(id.toString());
                    });
                }

                filter.user = { $nin: assignedIds };
            }
        }

        if (department && department !== 'All Departments') filter.department = department;
        if (year && year !== 'All Years') filter.year = parseInt(year.replace('rd Year', '').replace('th Year', '').replace('st Year', '').replace('nd Year', ''));
        if (minCgpa && minCgpa !== 'Min CGPA: Any') filter.cgpa = { $gte: parseFloat(minCgpa.replace('Min CGPA: ', '')) };

        let profiles = await StudentProfile.find(filter).populate('user', 'name email');

        if (!query || query.trim() === '') {
            // No semantic search needed, just return filtered results
            return res.json(profiles.map(p => ({
                id: p.user._id,
                name: p.user.name,
                department: p.department,
                year: p.year,
                cgpa: p.cgpa,
                skills: p.skills,
                matchScore: null
            })));
        }

        // 2. Semantic Search
        // Get embedding for the search query
        const embedResponse = await axios.post(`${AI_SERVICE_URL}/embed`, {
            texts: [query]
        });
        const queryVector = embedResponse.data.embeddings[0];

        // Calculate similarity for each profile
        let scoredProfiles = profiles.map(p => {
            let score = 0;
            if (p.skillEmbedding && p.skillEmbedding.length > 0) {
                score = cosineSimilarity(queryVector, p.skillEmbedding);
            }
            return {
                id: p.user._id,
                name: p.user.name,
                department: p.department,
                year: p.year,
                cgpa: p.cgpa,
                skills: p.skills,
                matchScore: Math.round(score * 100) // Convert to percentage
            };
        });

        // Sort by highest match score
        scoredProfiles.sort((a, b) => b.matchScore - a.matchScore);

        // Filter out very low matches (optional threshold, e.g., > 10%)
        scoredProfiles = scoredProfiles.filter(p => p.matchScore > 10);

        res.json(scoredProfiles);

    } catch (err) {
        console.error("Search error:", err.message);
        res.status(500).send('Server Error during search');
    }
};
