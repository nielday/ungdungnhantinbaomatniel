const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { Message, Conversation, Group } = require('../models');
const { uploadToB2, deleteFromB2 } = require('../config/b2');

const router = express.Router();

// Helper: Multer mặc định dùng Latin-1 cho tên file (theo chuẩn multipart).
// Tên file tiếng Việt (UTF-8) bị decode sai thành ký tự rác.
// Hàm này chuyển ngược Latin-1 -> UTF-8 để khôi phục tên file gốc.
const fixUtf8Filename = (name) => {
  try {
    return Buffer.from(name, 'latin1').toString('utf8');
  } catch {
    return name;
  }
};

// Configure multer for file uploads (memory storage for B2)
const storage = multer.memoryStorage(); // Store in memory instead of disk

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow encrypted E2EE files (application/octet-stream with encrypted_ prefix)
    if (file.mimetype === 'application/octet-stream' && file.originalname.startsWith('encrypted_')) {
      return cb(null, true);
    }

    const allowedTypes = /jpeg|jpg|png|gif|mp3|wav|ogg|webm|mp4|m4a|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype || extname) {
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

    // Implement Local Soft Delete - filter out messages before deletedAt
    let messageQuery = {
      conversationId,
      isDeleted: false
    };

    if (conversation && conversation.deletedBy) {
      const userDeleteRecord = conversation.deletedBy.find(
        record => record.user && record.user.toString() === userId.toString()
      );
      if (userDeleteRecord && userDeleteRecord.deletedAt) {
        messageQuery.createdAt = { $gt: userDeleteRecord.deletedAt };
      }
    }

    let messages = await Message.find(messageQuery)
      .populate('senderId', 'fullName avatar')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Re-verify sorting and decryption mapping
    messages = messages.reverse().map(msg => {
      if (msg.isServerEncrypted && msg.content) {
        try {
          const serverKey = process.env.SERVER_ENCRYPTION_KEY || 'NielAppSecretKey_2024_Fallback_0';
          const keyHash = crypto.createHash('sha256').update(serverKey).digest();

          const textParts = msg.content.split(':');
          if (textParts.length === 2) {
            const iv = Buffer.from(textParts[0], 'hex');
            const encryptedText = Buffer.from(textParts[1], 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', keyHash, iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            msg.content = decrypted.toString();
            // Trả về Frontend dưới tư cách là tin nhắn không mã hóa bình thường
            msg.isServerEncrypted = false;
            msg.isEncrypted = false;
          }
        } catch (err) {
          console.error('Lỗi giải mã Nội bộ Server tại MsgID:', msg._id, err);
          msg.content = '[Nội dung bị lỗi hệ thống mã hóa Server]';
        }
      }
      return msg;
    });

    res.json(messages);
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

    // Server-side Encryption logic for non-E2EE messages
    let finalContent = content;
    let isServerEncrypted = false;

    if (!isEncrypted && finalContent) {
      try {
        // Sử dụng Server Key nội bộ. Nếu không có cài đặt, dùng một chuỗi fallback an toàn
        const serverKey = process.env.SERVER_ENCRYPTION_KEY || 'NielAppSecretKey_2024_Fallback_0';

        // Đảm bảo Key đúng chuẩn AES-256 (32 bytes)
        const keyHash = crypto.createHash('sha256').update(serverKey).digest();
        const iv = crypto.randomBytes(16); // 16 bytes IV

        const cipher = crypto.createCipheriv('aes-256-cbc', keyHash, iv);
        let encrypted = cipher.update(finalContent, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Lưu trữ với định dạng ghép IV + Nội_Dung_Mã_Hóa
        finalContent = iv.toString('hex') + ':' + encrypted;
        isServerEncrypted = true;
      } catch (err) {
        console.error('Lỗi mã hóa tin nhắn tại Server:', err);
        // Nếu mã hoá server lỗi, fallback không mã hoá để đảm bảo ứng dụng vẫn chạy
      }
    }

    const message = new Message({
      conversationId,
      senderId: userId,
      content: finalContent,
      messageType: 'text',
      replyTo: replyTo || null,
      isEncrypted: isEncrypted || false,
      isServerEncrypted: isServerEncrypted,
      encryptionData: encryptionData || null
    });

    await message.save();
    await message.populate('senderId', 'fullName avatar');
    await message.populate('replyTo');

    // Update conversation last message (only for private conversations)
    if (conversation) {
      conversation.lastMessage = message._id;
      conversation.lastMessageAt = new Date();
      // Phục sinh hội thoại: Xóa status Ẩn/Lưu trữ nếu có tin nhắn mới
      conversation.deletedBy = [];
      conversation.archivedBy = [];
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
    const messageResponse = message.toObject();

    // Khôi phục nội dung Text sạch cho Frontend dùng ngay (không cần reload F5 mới dịch được)
    if (isServerEncrypted) {
      messageResponse.content = content;
      messageResponse.isServerEncrypted = false;
    }

    if (io) {
      io.to(`conversation-${conversationId}`).emit('new-message', messageResponse);
    }

    res.status(201).json(messageResponse);
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
    const { content = '', replyTo, isEncrypted, encryptionData } = req.body;
    const userId = req.user._id;

    let parsedEncryptionData = null;
    if (isEncrypted === 'true' && encryptionData) {
      try {
        parsedEncryptionData = JSON.parse(encryptionData);
      } catch (e) {
        console.error("Invalid encryption data JSON", e);
      }
    }

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
        const safeFileName = fixUtf8Filename(file.originalname);

        // Upload to B2
        const fileUrl = await uploadToB2(
          file.buffer,
          safeFileName,
          file.mimetype,
          'messages'
        );

        attachments.push({
          fileName: safeFileName,
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

    // Nếu có mã hóa thì dùng originalType bù vào thay cho mime (vì payload là octet-stream), nếu ko có thì dùng firstFile.mimetype
    let mimeToCheck = firstFile.mimetype;
    if (parsedEncryptionData && parsedEncryptionData.originalType) {
      mimeToCheck = parsedEncryptionData.originalType;
    }

    if (mimeToCheck.startsWith('image/')) {
      messageType = 'image';
    } else if (mimeToCheck.startsWith('audio/')) {
      messageType = 'audio';
    }

    const message = new Message({
      conversationId,
      senderId: userId,
      content: content || `Đã gửi ${req.files.length} file(s)`, // Default content for file messages
      messageType,
      attachments,
      replyTo: replyTo || null,
      isEncrypted: isEncrypted === 'true',
      encryptionData: parsedEncryptionData
    });

    await message.save();
    await message.populate('senderId', 'fullName avatar');
    await message.populate('replyTo');

    // Update conversation last message (only for private conversations)
    if (conversation) {
      conversation.lastMessage = message._id;
      conversation.lastMessageAt = new Date();
      // Phục sinh hội thoại: Xóa status Ẩn/Lưu trữ nếu có tin nhắn File mới
      conversation.deletedBy = [];
      conversation.archivedBy = [];
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

    // Search messages using aggregation to filter by populated sender fullName
    const limitNum = parseInt(limit);
    const messagesAgg = await Message.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
          isDeleted: false,
          isEncrypted: { $ne: true }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'senderId',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $unwind: '$sender'
      },
      {
        $match: {
          $or: [
            { content: { $regex: q.trim(), $options: 'i' } },
            { 'sender.fullName': { $regex: q.trim(), $options: 'i' } }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: limitNum }
    ]);

    // Restore mongoose document format for the rest of the flow
    const messages = messagesAgg.map(m => {
      const doc = new Message(m);
      doc.senderId = m.sender;
      return doc;
    });

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
