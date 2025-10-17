const express = require('express');
const { Group, User } = require('../models');

const router = express.Router();

// Get all groups for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('Getting groups for user:', userId);

    const groups = await Group.find({
      'members.user': userId,
      isActive: true
    })
    .populate('members.user', 'fullName avatar phoneNumber')
    .populate('createdBy', 'fullName avatar phoneNumber')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 });

    // Transform groups to include full member information
    const transformedGroups = groups.map(group => {
      const groupObj = group.toObject();
      groupObj.members = groupObj.members.map(member => ({
        ...member,
        fullName: member.user?.fullName || 'Unknown',
        phoneNumber: member.user?.phoneNumber || '',
        avatar: member.user?.avatar || null,
        _id: member.user?._id || member.user
      }));
      return groupObj;
    });

    console.log('Found groups:', transformedGroups.length);
    res.json(transformedGroups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Create new group
router.post('/', async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    const userId = req.user._id;

    if (!name || !memberIds || memberIds.length === 0) {
      return res.status(400).json({
        message: 'Tên nhóm và danh sách thành viên là bắt buộc'
      });
    }

    if (memberIds.length > 99) {
      return res.status(400).json({
        message: 'Nhóm không được quá 100 thành viên'
      });
    }

    // Add creator to members
    const allMembers = [userId, ...memberIds];
    const uniqueMembers = [...new Set(allMembers.map(id => id.toString()))];

    // Check if all members exist
    const members = await User.find({
      _id: { $in: uniqueMembers }
    });

    if (members.length !== uniqueMembers.length) {
      return res.status(400).json({
        message: 'Một số người dùng không tồn tại'
      });
    }

    // Create group
    const group = new Group({
      name,
      description: description || '',
      createdBy: userId,
      admins: [userId],
      members: uniqueMembers.map(memberId => ({
        user: memberId,
        role: memberId === userId.toString() ? 'admin' : 'member'
      }))
    });

    await group.save();
    await group.populate('members.user', 'fullName avatar phoneNumber');
    await group.populate('createdBy', 'fullName avatar phoneNumber');

    res.status(201).json(group);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Get group by ID
router.get('/:id', async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;

    const group = await Group.findOne({
      _id: groupId,
      'members.user': userId,
      isActive: true
    })
    .populate('members.user', 'fullName avatar phoneNumber')
    .populate('createdBy', 'fullName avatar phoneNumber');

    if (!group) {
      return res.status(404).json({
        message: 'Nhóm không tồn tại'
      });
    }

    // Transform group to include full member information
    const groupObj = group.toObject();
    groupObj.members = groupObj.members.map(member => ({
      ...member,
      fullName: member.user?.fullName || 'Unknown',
      phoneNumber: member.user?.phoneNumber || '',
      avatar: member.user?.avatar || null,
      _id: member.user?._id || member.user
    }));

    res.json(groupObj);
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Update group
router.put('/:id', async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;
    const { name, description } = req.body;

    const group = await Group.findOne({
      _id: groupId,
      createdBy: userId,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        message: 'Nhóm không tồn tại hoặc bạn không có quyền chỉnh sửa'
      });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;

    await group.save();
    await group.populate('members.user', 'fullName avatar phoneNumber');
    await group.populate('createdBy', 'fullName avatar phoneNumber');

    // Transform group to include full member information
    const groupObj = group.toObject();
    groupObj.members = groupObj.members.map(member => ({
      ...member,
      fullName: member.user?.fullName || 'Unknown',
      phoneNumber: member.user?.phoneNumber || '',
      avatar: member.user?.avatar || null,
      _id: member.user?._id || member.user
    }));

    res.json(groupObj);
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
    const groupId = req.params.id;
    const userId = req.user._id;
    const { memberId } = req.body;

    const group = await Group.findOne({
      _id: groupId,
      createdBy: userId,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        message: 'Nhóm không tồn tại hoặc bạn không có quyền thêm thành viên'
      });
    }

    // Check if user exists
    const newMember = await User.findById(memberId);
    if (!newMember) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại'
      });
    }

    // Check if user is already in group
    if (group.isMember(memberId)) {
      return res.status(400).json({
        message: 'Người dùng đã có trong nhóm'
      });
    }

    // Check group size limit
    if (group.members.length >= group.settings.maxMembers) {
      return res.status(400).json({
        message: `Nhóm đã đạt giới hạn ${group.settings.maxMembers} thành viên`
      });
    }

    group.addMember(memberId);
    await group.save();
    await group.populate('members.user', 'fullName avatar phoneNumber');
    await group.populate('createdBy', 'fullName avatar phoneNumber');

    // Transform group to include full member information
    const groupObj = group.toObject();
    groupObj.members = groupObj.members.map(member => ({
      ...member,
      fullName: member.user?.fullName || 'Unknown',
      phoneNumber: member.user?.phoneNumber || '',
      avatar: member.user?.avatar || null,
      _id: member.user?._id || member.user
    }));

    res.json(groupObj);
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
    const groupId = req.params.id;
    const memberId = req.params.memberId;
    const userId = req.user._id;

    const group = await Group.findOne({
      _id: groupId,
      createdBy: userId,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        message: 'Nhóm không tồn tại hoặc bạn không có quyền xóa thành viên'
      });
    }

    // Cannot remove group creator
    if (group.createdBy.toString() === memberId) {
      return res.status(400).json({
        message: 'Không thể xóa người tạo nhóm'
      });
    }

    group.removeMember(memberId);
    await group.save();
    await group.populate('members.user', 'fullName avatar phoneNumber');
    await group.populate('createdBy', 'fullName avatar phoneNumber');

    // Transform group to include full member information
    const groupObj = group.toObject();
    groupObj.members = groupObj.members.map(member => ({
      ...member,
      fullName: member.user?.fullName || 'Unknown',
      phoneNumber: member.user?.phoneNumber || '',
      avatar: member.user?.avatar || null,
      _id: member.user?._id || member.user
    }));

    res.json(groupObj);
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Leave group
router.post('/:id/leave', async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;

    const group = await Group.findOne({
      _id: groupId,
      'members.user': userId,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        message: 'Bạn không có trong nhóm này'
      });
    }

    // Cannot leave if you're the creator
    if (group.createdBy.toString() === userId) {
      return res.status(400).json({
        message: 'Người tạo nhóm không thể rời khỏi nhóm'
      });
    }

    group.removeMember(userId);
    await group.save();

    res.json({
      message: 'Đã rời khỏi nhóm'
    });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

module.exports = router;
