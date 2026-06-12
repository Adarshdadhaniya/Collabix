require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const passport = require('passport');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport middleware
app.use(passport.initialize());
require('./config/passport')(passport);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/project-notices', require('./routes/projectNotice'));
app.use('/api/groups', require('./routes/group'));
app.use('/api/chat', require('./routes/chat'));
app.get('/api/health', (req, res) => res.send('API is running...'));

const http = require('http');
const socketIo = require('socket.io');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Setup Socket.IO
const io = socketIo(server, {
    cors: {
        origin: "*", // Adjust this to your frontend URL in production
        methods: ["GET", "POST"]
    }
});

// Import socket handlers
require('./sockets/chat')(io);

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
