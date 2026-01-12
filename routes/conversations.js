const express = require('express');
const { Conversation, User } = require('../models');

const router = express.Router();

// Get all conversations for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('Getting conversations for user:', userId);

    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
      .populate('participants', 'fullName avatar phoneNumber')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    console.log('Found conversations:', conversations.length);
    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Create private conversation
router.post('/private', async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user._id;

    if (participantId === userId.toString()) {
      return res.status(400).json({
        message: 'Không thể tạo cuộc trò chuyện với chính mình'
      });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại'
      });
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: { $all: [userId, participantId] },
      isActive: true
    });

    if (existingConversation) {
      return res.json(existingConversation);
    }

    // Create new conversation
    const conversation = new Conversation({
      participants: [userId, participantId]
    });

    await conversation.save();
    await conversation.populate('participants', 'fullName avatar phoneNumber');

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Create private conversation error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Group conversations are now handled by /api/groups
// This endpoint is deprecated - use /api/groups instead

// Get conversation by ID
router.get('/:id', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    })
      .populate('participants', 'fullName avatar phoneNumber');

    if (!conversation) {
      return res.status(404).json({
        message: 'Cuộc trò chuyện không tồn tại'
      });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Group management routes have been moved to /api/groups
// Use /api/groups for all group-related operations

// ============================================
// E2EE ENCRYPTION MODE
// ============================================

// Toggle encryption mode for a conversation
router.put('/:id/encryption-mode', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;
    const { encryptionMode } = req.body;

    if (!['none', 'e2ee'].includes(encryptionMode)) {
      return res.status(400).json({
        message: 'Chế độ mã hóa không hợp lệ. Sử dụng "none" hoặc "e2ee"'
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Cuộc trò chuyện không tồn tại' });
    }

    conversation.encryptionMode = encryptionMode;
    await conversation.save();

    res.json({
      message: encryptionMode === 'e2ee'
        ? 'Đã bật mã hóa đầu cuối'
        : 'Đã tắt mã hóa đầu cuối',
      encryptionMode: conversation.encryptionMode
    });
  } catch (error) {
    console.error('Toggle encryption mode error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Get conversation encryption status
router.get('/:id/encryption-status', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    }).populate('participants', 'publicKey keyCreatedAt');

    if (!conversation) {
      return res.status(404).json({ message: 'Cuộc trò chuyện không tồn tại' });
    }

    // Check if all participants have encryption keys
    const allHaveKeys = conversation.participants.every(p => p.publicKey);

    res.json({
      encryptionMode: conversation.encryptionMode || 'none',
      canEnableE2EE: allHaveKeys,
      participants: conversation.participants.map(p => ({
        _id: p._id,
        hasPublicKey: !!p.publicKey,
        keyCreatedAt: p.keyCreatedAt
      }))
    });
  } catch (error) {
    console.error('Get encryption status error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
