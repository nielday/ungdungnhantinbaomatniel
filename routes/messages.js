const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Message, Conversation } = require('../models');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp3|wav|mp4|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Loại file không được hỗ trợ'));
    }
  }
});

// Get messages for a conversation
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    // Check if user is participant of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Cuộc trò chuyện không tồn tại'
      });
    }

    const messages = await Message.find({
      conversationId,
      isDeleted: false
    })
    .populate('senderId', 'fullName avatar')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Send text message
router.post('/:conversationId/text', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, replyTo } = req.body;
    const userId = req.user._id;

    // Check if user is participant of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Cuộc trò chuyện không tồn tại'
      });
    }

    const message = new Message({
      conversationId,
      senderId: userId,
      content,
      messageType: 'text',
      replyTo: replyTo || null
    });

    await message.save();
    await message.populate('senderId', 'fullName avatar');
    await message.populate('replyTo');

    // Update conversation last message
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.status(201).json(message);
  } catch (error) {
    console.error('Send text message error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Send file message
router.post('/:conversationId/file', upload.array('files', 5), async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content = '', replyTo } = req.body;
    const userId = req.user._id;

    // Check if user is participant of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Cuộc trò chuyện không tồn tại'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: 'Không có file nào được tải lên'
      });
    }

    // Process attachments
    const attachments = req.files.map(file => ({
      fileName: file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      fileSize: file.size,
      mimeType: file.mimetype
    }));

    // Determine message type based on file type
    const firstFile = req.files[0];
    let messageType = 'file';
    if (firstFile.mimetype.startsWith('image/')) {
      messageType = 'image';
    } else if (firstFile.mimetype.startsWith('audio/')) {
      messageType = 'audio';
    }

    const message = new Message({
      conversationId,
      senderId: userId,
      content,
      messageType,
      attachments,
      replyTo: replyTo || null
    });

    await message.save();
    await message.populate('senderId', 'fullName avatar');
    await message.populate('replyTo');

    // Update conversation last message
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.status(201).json(message);
  } catch (error) {
    console.error('Send file message error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

module.exports = router;
