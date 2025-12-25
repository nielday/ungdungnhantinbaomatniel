const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./models');
const { router: authRoutes } = require('./routes/auth');
const conversationRoutes = require('./routes/conversations');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const groupRoutes = require('./routes/groups');
const { authenticateToken } = require('./middleware/auth');
const fileRoutes = require('./routes/files');

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    // Set proper headers for file serving
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

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

// Test route with authentication
app.get('/api/test-auth', authenticateToken, (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Authenticated route works',
    userId: req.user._id,
    timestamp: new Date().toISOString()
  });
});

// Debug uploads directory
app.get('/api/uploads-debug', (req, res) => {
  const fs = require('fs');
  const uploadsPath = path.join(__dirname, 'uploads');
  
  try {
    const files = fs.readdirSync(uploadsPath);
    res.json({
      status: 'OK',
      uploadsPath,
      files,
      exists: fs.existsSync(uploadsPath),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      status: 'ERROR',
      error: error.message,
      uploadsPath,
      exists: fs.existsSync(uploadsPath),
      timestamp: new Date().toISOString()
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/conversations', authenticateToken, conversationRoutes);
app.use('/api/messages', authenticateToken, messageRoutes);
app.use('/api/groups', authenticateToken, groupRoutes);
app.use('/api/files', fileRoutes); // File proxy for private B2 bucket
app.use('/api/admin', adminRoutes);

// Cleanup route (no auth required)
app.get('/api/cleanup', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const uploadsPath = process.env.UPLOAD_PATH || path.join(__dirname, 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
    
    // Get all files in uploads directory
    const existingFiles = fs.readdirSync(uploadsPath).filter(file => file !== '.gitkeep');
    console.log('Existing files:', existingFiles);
    
    // Find messages with attachments
    const { Message } = require('./models');
    const messages = await Message.find({ 
      attachments: { $exists: true, $ne: [] },
      isDeleted: false 
    });
    
    let cleanedCount = 0;
    const filesToClean = [];
    
    for (const message of messages) {
      if (message.attachments && message.attachments.length > 0) {
        const validAttachments = [];
        
        for (const attachment of message.attachments) {
          const fileName = attachment.fileUrl.split('/').pop();
          if (existingFiles.includes(fileName)) {
            validAttachments.push(attachment);
          } else {
            console.log('File not found, removing:', fileName);
            filesToClean.push(fileName);
          }
        }
        
        if (validAttachments.length !== message.attachments.length) {
          message.attachments = validAttachments;
          await message.save();
          cleanedCount++;
        }
      }
    }
    
    res.json({
      status: 'OK',
      message: `Cleaned up ${cleanedCount} messages`,
      filesToClean,
      existingFiles,
      cleanedCount
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      message: 'Cleanup failed',
      error: error.message
    });
  }
});

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

  // Group management events
  socket.on('group-member-added', (data) => {
    socket.to(`conversation-${data.conversationId}`).emit('member-added', data);
  });

  socket.on('group-member-removed', (data) => {
    socket.to(`conversation-${data.conversationId}`).emit('member-removed', data);
  });

  socket.on('group-updated', (data) => {
    socket.to(`conversation-${data.conversationId}`).emit('group-info-updated', data);
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
