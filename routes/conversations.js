const express = require('express');
const { Conversation, User } = require('../models');

const router = express.Router();

// Get all conversations for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
      isActive: true,
      'deletedBy.user': { $ne: userId } // Bỏ qua hội thoại đã xóa cục bộ
    })
      .populate('participants', 'fullName avatar phoneNumber')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    // Filter out archived conversations if needed (Optional: can send flag)
    const activeConversations = conversations.map(conv => {
      const convObj = conv.toObject();
      convObj.isArchived = convObj.archivedBy && convObj.archivedBy.some(id => id.toString() === userId.toString());
      return convObj;
    });

    res.json(activeConversations);
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

// ============================================
// CONVERSATION MANAGEMENT (SWIPE ACTIONS)
// ============================================

// Soft delete conversation (Local delete for user)
router.put('/:id/delete', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Cuộc trò chuyện không tồn tại' });
    }

    // Check if user already deleted
    const alreadyDeleted = conversation.deletedBy && conversation.deletedBy.some(
      item => item.user.toString() === userId.toString()
    );

    if (!alreadyDeleted) {
      if (!conversation.deletedBy) conversation.deletedBy = [];
      conversation.deletedBy.push({ user: userId, deletedAt: new Date() });
      await conversation.save();
    }

    res.json({ message: 'Đã xóa cuộc trò chuyện', success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Archive conversation
router.put('/:id/archive', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Cuộc trò chuyện không tồn tại' });
    }

    const { action } = req.body; // 'archive' or 'unarchive'

    if (!conversation.archivedBy) conversation.archivedBy = [];

    const index = conversation.archivedBy.findIndex(id => id.toString() === userId.toString());

    if (action === 'archive' && index === -1) {
      conversation.archivedBy.push(userId);
    } else if (action === 'unarchive' && index !== -1) {
      conversation.archivedBy.splice(index, 1);
    } // else toggle if no action specified
    else if (!action) {
      if (index === -1) conversation.archivedBy.push(userId);
      else conversation.archivedBy.splice(index, 1);
    }

    await conversation.save();

    res.json({
      message: 'Đã cập nhật trạng thái lưu trữ',
      isArchived: conversation.archivedBy.some(id => id.toString() === userId.toString())
    });
  } catch (error) {
    console.error('Archive conversation error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

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
