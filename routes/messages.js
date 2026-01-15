const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { Message, Conversation, Group } = require('../models');
const { uploadToB2, deleteFromB2 } = require('../config/b2');

const router = express.Router();

// Configure multer for file uploads (memory storage for B2)
const storage = multer.memoryStorage(); // Store in memory instead of disk

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

    console.log('Get messages request:', {
      conversationId,
      userId,
      page,
      limit
    });

    // Check if user is participant of conversation or group
    let conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });

    console.log('Conversation found:', conversation ? 'Yes' : 'No');

    // If not found in conversations, check if it's a group
    if (!conversation) {
      const group = await Group.findOne({
        _id: conversationId,
        'members.user': new mongoose.Types.ObjectId(userId),
        isActive: true
      });

      console.log('Group found:', group ? 'Yes' : 'No');
      console.log('Group details:', group ? {
        id: group._id,
        name: group.name,
        members: group.members.length,
        isActive: group.isActive
      } : 'None');

      if (!group) {
        // Additional debugging - check if conversation/group exists at all
        const anyConversation = await Conversation.findById(conversationId);
        const anyGroup = await Group.findById(conversationId);

        console.log('Any conversation exists:', anyConversation ? 'Yes' : 'No');
        console.log('Any group exists:', anyGroup ? 'Yes' : 'No');

        if (anyConversation) {
          console.log('Conversation exists but user not participant:', {
            participants: anyConversation.participants,
            isActive: anyConversation.isActive
          });
        }

        if (anyGroup) {
          console.log('Group exists but user not member:', {
            members: anyGroup.members.map(m => m.user),
            isActive: anyGroup.isActive
          });
        }

        return res.status(404).json({
          message: 'Cuộc trò chuyện không tồn tại hoặc bạn không có quyền truy cập'
        });
      }
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
    const { content, replyTo, isEncrypted, encryptionData } = req.body;
    const userId = req.user._id;

    console.log('Send text message request:', {
      conversationId,
      userId,
      content: content ? content.substring(0, 50) + '...' : 'Empty',
      replyTo,
      isEncrypted: !!isEncrypted
    });

    // Check if user is participant of conversation or group
    let conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });

    console.log('Conversation found for POST:', conversation ? 'Yes' : 'No');

    // If not found in conversations, check if it's a group
    if (!conversation) {
      const group = await Group.findOne({
        _id: conversationId,
        'members.user': new mongoose.Types.ObjectId(userId),
        isActive: true
      });

      console.log('Group found for POST:', group ? 'Yes' : 'No');
      console.log('Group details for POST:', group ? {
        id: group._id,
        name: group.name,
        members: group.members.length,
        isActive: group.isActive
      } : 'None');

      if (!group) {
        // Additional debugging - check if conversation/group exists at all
        const anyConversation = await Conversation.findById(conversationId);
        const anyGroup = await Group.findById(conversationId);

        console.log('Any conversation exists for POST:', anyConversation ? 'Yes' : 'No');
        console.log('Any group exists for POST:', anyGroup ? 'Yes' : 'No');

        if (anyConversation) {
          console.log('Conversation exists but user not participant for POST:', {
            participants: anyConversation.participants,
            isActive: anyConversation.isActive
          });
        }

        if (anyGroup) {
          console.log('Group exists but user not member for POST:', {
            members: anyGroup.members.map(m => m.user),
            isActive: anyGroup.isActive
          });
        }

        return res.status(404).json({
          message: 'Cuộc trò chuyện không tồn tại hoặc bạn không có quyền truy cập'
        });
      }
    }

    const message = new Message({
      conversationId,
      senderId: userId,
      content,
      messageType: 'text',
      replyTo: replyTo || null,
      isEncrypted: isEncrypted || false,
      encryptionData: encryptionData || null
    });

    await message.save();
    await message.populate('senderId', 'fullName avatar');
    await message.populate('replyTo');

    // Update conversation last message (only for private conversations)
    if (conversation) {
      conversation.lastMessage = message._id;
      conversation.lastMessageAt = new Date();
      await conversation.save();
    } else {
      // Update group last message
      const group = await Group.findById(conversationId);
      if (group) {
        group.lastMessage = message._id;
        group.lastMessageAt = new Date();
        await group.save();
      }
    }

    // Emit to Socket.io for real-time delivery
    const { io } = require('../server');
    if (io) {
      io.to(`conversation-${conversationId}`).emit('new-message', message);
    }

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
    console.log('File upload request:', {
      conversationId: req.params.conversationId,
      files: req.files ? req.files.length : 0,
      body: req.body
    });

    const { conversationId } = req.params;
    const { content = '', replyTo } = req.body;
    const userId = req.user._id;

    // Check if user is participant of conversation or group
    let conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });

    // If not found in conversations, check if it's a group
    if (!conversation) {
      const group = await Group.findOne({
        _id: conversationId,
        'members.user': new mongoose.Types.ObjectId(userId),
        isActive: true
      });

      if (!group) {
        return res.status(404).json({
          message: 'Cuộc trò chuyện không tồn tại'
        });
      }
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: 'Không có file nào được tải lên'
      });
    }

    // Upload files to B2 and process attachments
    const attachments = [];
    for (const file of req.files) {
      try {
        // Upload to B2
        const fileUrl = await uploadToB2(
          file.buffer,
          file.originalname,
          file.mimetype,
          'messages'
        );

        attachments.push({
          fileName: file.originalname,
          fileUrl: fileUrl, // B2 public URL
          fileSize: file.size,
          mimeType: file.mimetype
        });

        console.log('File uploaded to B2:', fileUrl);
      } catch (uploadError) {
        console.error('Failed to upload file to B2:', uploadError);
        return res.status(500).json({
          message: 'Không thể tải file lên',
          error: uploadError.message
        });
      }
    }

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
      content: content || `Đã gửi ${req.files.length} file(s)`, // Default content for file messages
      messageType,
      attachments,
      replyTo: replyTo || null
    });

    await message.save();
    await message.populate('senderId', 'fullName avatar');
    await message.populate('replyTo');

    // Update conversation last message (only for private conversations)
    if (conversation) {
      conversation.lastMessage = message._id;
      conversation.lastMessageAt = new Date();
      await conversation.save();
    } else {
      // Update group last message
      const group = await Group.findById(conversationId);
      if (group) {
        group.lastMessage = message._id;
        group.lastMessageAt = new Date();
        await group.save();
      }
    }

    // Emit to Socket.io for real-time delivery
    const { io } = require('../server');
    if (io) {
      io.to(`conversation-${conversationId}`).emit('new-message', message);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Send file message error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      message: 'Lỗi server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('Multer error:', error);
    return res.status(400).json({
      message: 'Lỗi upload file',
      error: error.message
    });
  }
  next(error);
});

// Clean up old files (B2 version - for migrating from local to B2)
router.get('/cleanup', async (req, res) => {
  try {
    // This endpoint is now primarily for reference
    // B2 files don't need cleanup like local files
    // Files are stored permanently on B2

    const messages = await Message.find({
      attachments: { $exists: true, $ne: [] },
      isDeleted: false
    });

    const stats = {
      totalMessages: messages.length,
      totalAttachments: 0,
      b2Files: 0,
      localFiles: 0
    };

    for (const message of messages) {
      if (message.attachments && message.attachments.length > 0) {
        stats.totalAttachments += message.attachments.length;

        for (const attachment of message.attachments) {
          if (attachment.fileUrl.startsWith('http')) {
            stats.b2Files++;
          } else {
            stats.localFiles++;
          }
        }
      }
    }

    res.json({
      status: 'OK',
      message: 'File statistics',
      stats,
      note: 'B2 files are stored permanently and do not need cleanup'
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      message: 'Cleanup failed',
      error: error.message
    });
  }
});

// Delete message (only sender can delete their own message)
router.delete('/:messageId', async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        message: 'Tin nhắn không tồn tại'
      });
    }

    // Check if user is the sender of the message
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'Bạn chỉ có thể xóa tin nhắn của chính mình'
      });
    }

    // Delete attachments from B2 before soft-deleting message
    if (message.attachments && message.attachments.length > 0) {
      for (const attachment of message.attachments) {
        try {
          await deleteFromB2(attachment.fileUrl);
          console.log('Deleted file from B2:', attachment.fileUrl);
        } catch (error) {
          console.error('Failed to delete file from B2:', error);
          // Continue anyway - better to delete message reference than fail
        }
      }
    }

    // Soft delete - mark as deleted instead of actually deleting
    message.isDeleted = true;
    message.content = 'Tin nhắn đã bị xóa';
    message.attachments = []; // Clear attachments when deleted

    await message.save();

    // Emit socket event to notify all users in the conversation
    const io = require('../server').io;
    if (io) {
      io.to(`conversation-${message.conversationId}`).emit('message-deleted', {
        messageId: message._id,
        conversationId: message.conversationId
      });
    }

    res.json({
      message: 'Tin nhắn đã được xóa thành công',
      deletedMessage: message
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Search messages across all user's conversations
router.get('/search/all', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const userId = req.user._id;

    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    console.log('Message search request:', { query: q, userId, limit });

    // Get all conversations user is part of
    const userConversations = await Conversation.find({
      participants: userId,
      isActive: true
    }).select('_id');

    // Get all groups user is member of
    const userGroups = await Group.find({
      'members.user': new mongoose.Types.ObjectId(userId),
      isActive: true
    }).select('_id');

    const conversationIds = [
      ...userConversations.map(c => c._id),
      ...userGroups.map(g => g._id)
    ];

    if (conversationIds.length === 0) {
      return res.json([]);
    }

    // Search messages (only non-encrypted messages can be searched)
    const messages = await Message.find({
      conversationId: { $in: conversationIds },
      content: { $regex: q.trim(), $options: 'i' },
      isDeleted: false,
      isEncrypted: { $ne: true } // Only search non-encrypted messages
    })
      .populate('senderId', 'fullName avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Fetch conversation/group info for each message
    const messagesWithConversationInfo = await Promise.all(
      messages.map(async (msg) => {
        const msgObj = msg.toObject();
        const convId = msg.conversationId;

        // Try to find as a Group first
        const group = await Group.findById(convId)
          .select('name avatar')
          .populate('members.user', 'fullName avatar');

        if (group) {
          msgObj.conversationInfo = {
            _id: group._id.toString(),
            type: 'group',
            name: group.name,
            avatar: group.avatar,
            participants: group.members.map(m => ({
              _id: m.user?._id?.toString(),
              fullName: m.user?.fullName,
              avatar: m.user?.avatar
            }))
          };
        } else {
          // Try as a Conversation
          const conversation = await Conversation.findById(convId)
            .select('type name avatar')
            .populate('participants', 'fullName avatar phoneNumber');

          if (conversation) {
            msgObj.conversationInfo = {
              _id: conversation._id.toString(),
              type: conversation.type || 'private',
              name: conversation.name,
              avatar: conversation.avatar,
              participants: conversation.participants?.map(p => ({
                _id: p._id?.toString(),
                fullName: p.fullName,
                avatar: p.avatar
              })) || []
            };
          }
        }

        // Ensure conversationId is a string for frontend matching
        msgObj.conversationId = convId.toString();

        return msgObj;
      })
    );

    console.log('Message search found:', messagesWithConversationInfo.length, 'messages');
    res.json(messagesWithConversationInfo);
  } catch (error) {
    console.error('Message search error:', error);
    res.status(500).json({
      message: 'Lỗi tìm kiếm tin nhắn'
    });
  }
});

module.exports = router;
