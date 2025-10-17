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
    .populate('createdBy', 'fullName')
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
      type: 'private',
      participants: { $all: [userId, participantId] },
      isActive: true
    });

    if (existingConversation) {
      return res.json(existingConversation);
    }

    // Create new conversation
    const conversation = new Conversation({
      type: 'private',
      participants: [userId, participantId],
      createdBy: userId
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
    .populate('participants', 'fullName avatar phoneNumber')
    .populate('createdBy', 'fullName');

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

// Update group conversation
router.put('/:id', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;
    const { groupName, groupDescription } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: 'group',
      createdBy: userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Nhóm không tồn tại hoặc bạn không có quyền chỉnh sửa'
      });
    }

    if (groupName) conversation.groupName = groupName;
    if (groupDescription !== undefined) conversation.groupDescription = groupDescription;

    await conversation.save();
    await conversation.populate('participants', 'fullName avatar phoneNumber');
    await conversation.populate('createdBy', 'fullName');

    res.json(conversation);
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Add member to group
router.post('/:id/members', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;
    const { userId: newMemberId } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: 'group',
      createdBy: userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Nhóm không tồn tại hoặc bạn không có quyền thêm thành viên'
      });
    }

    // Check if user exists
    const newMember = await User.findById(newMemberId);
    if (!newMember) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại'
      });
    }

    // Check if user is already in group
    if (conversation.participants.includes(newMemberId)) {
      return res.status(400).json({
        message: 'Người dùng đã có trong nhóm'
      });
    }

    // Check group size limit
    if (conversation.participants.length >= 100) {
      return res.status(400).json({
        message: 'Nhóm đã đạt giới hạn 100 thành viên'
      });
    }

    conversation.participants.push(newMemberId);
    await conversation.save();
    await conversation.populate('participants', 'fullName avatar phoneNumber');
    await conversation.populate('createdBy', 'fullName');

    res.json(conversation);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Remove member from group
router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const memberId = req.params.memberId;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: 'group',
      createdBy: userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Nhóm không tồn tại hoặc bạn không có quyền xóa thành viên'
      });
    }

    // Cannot remove group creator
    if (conversation.createdBy.toString() === memberId) {
      return res.status(400).json({
        message: 'Không thể xóa người tạo nhóm'
      });
    }

    conversation.participants = conversation.participants.filter(
      p => p.toString() !== memberId
    );
    await conversation.save();
    await conversation.populate('participants', 'fullName avatar phoneNumber');
    await conversation.populate('createdBy', 'fullName');

    res.json(conversation);
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

module.exports = router;
