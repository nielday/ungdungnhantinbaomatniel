const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./models');
const authRoutes = require('./routes/auth');
const conversationRoutes = require('./routes/conversations');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://ung-dung-nhan-tin-niel.vercel.app",
      "https://ung-dung-nhan-tin-niel-qtd1fbt58-phongs-projects-24ded8ab.vercel.app",
      "https://ung-dung-nhan-tin-niel-5pqtt8twt-phongs-projects-24ded8ab.vercel.app"
    ],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Debug route to check environment
app.get('/api/debug', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Debug info',
    jwtSecret: process.env.JWT_SECRET ? 'Present' : 'Missing',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Test route without authentication
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Test route works',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/conversations', authenticateToken, conversationRoutes);
app.use('/api/messages', authenticateToken, messageRoutes);

// Socket.io connection handling
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    console.log('Socket auth - Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.log('Socket auth - No token provided');
      return next(new Error('Authentication error'));
    }

    // Verify JWT token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Socket auth - Decoded token:', decoded);
    
    // Get user from database
    const { User } = require('./models');
    const user = await User.findById(decoded.userId).select('-otpCode -otpExpires');
    
    if (!user) {
      console.log('Socket auth - User not found');
      return next(new Error('User not found'));
    }

    if (!user.isVerified) {
      console.log('Socket auth - User not verified');
      return next(new Error('User not verified'));
    }

    console.log('Socket auth - Authentication successful');
    socket.userId = user._id;
    next();
  } catch (error) {
    console.log('Socket auth - Token verification failed:', error.message);
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('join-conversation', (conversationId) => {
    socket.join(`conversation-${conversationId}`);
    console.log(`User joined conversation ${conversationId}`);
  });

  socket.on('leave-conversation', (conversationId) => {
    socket.leave(`conversation-${conversationId}`);
    console.log(`User left conversation ${conversationId}`);
  });

  socket.on('send-message', (data) => {
    socket.to(`conversation-${data.conversationId}`).emit('new-message', data.message);
  });

  socket.on('typing', (data) => {
    socket.to(`conversation-${data.conversationId}`).emit('user-typing', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Connect to database
connectDB();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}/api`);
  console.log(`🔗 MongoDB: Connected successfully`);
});

module.exports = { app, io };
