const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { User } = require('../models');

const router = express.Router();

// Configure multer for avatar upload
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
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB for avatar
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép file ảnh (JPEG, JPG, PNG, GIF)'));
    }
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-otpCode -otpExpires');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { fullName, age } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại'
      });
    }

    if (fullName) user.fullName = fullName;
    if (age) user.age = age;

    await user.save();

    res.json({
      message: 'Cập nhật thông tin thành công',
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        fullName: user.fullName,
        age: user.age,
        avatar: user.avatar,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Upload avatar
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Không có file ảnh nào được tải lên'
      });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại'
      });
    }

    // Delete old avatar if exists
    if (user.avatar) {
      const oldAvatarPath = path.join(process.env.UPLOAD_PATH || './uploads', path.basename(user.avatar));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Update user avatar
    user.avatar = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({
      message: 'Cập nhật ảnh đại diện thành công',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { q, query } = req.query;
    const searchTerm = q || query;
    const userId = req.user._id;

    console.log('Search query:', searchTerm, 'User ID:', userId);

    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự'
      });
    }

    const users = await User.find({
      _id: { $ne: userId },
      isVerified: true,
      $or: [
        { fullName: { $regex: searchTerm, $options: 'i' } },
        { phoneNumber: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .select('_id fullName phoneNumber avatar')
    .limit(20);

    console.log('Found users:', users.length);
    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Get user by phone number
router.get('/phone/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const userId = req.user._id;

    const user = await User.findOne({
      phoneNumber,
      _id: { $ne: userId },
      isVerified: true
    }).select('fullName phoneNumber avatar');

    if (!user) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại'
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user by phone error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Send verification OTP for account verification
router.post('/send-verification-otp', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with OTP
    user.otpCode = otpCode;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    const { sendOTPEmail } = require('./auth');
    await sendOTPEmail(user.email, otpCode);

    res.json({ 
      message: 'Mã OTP đã được gửi đến email của bạn',
      email: user.email 
    });
  } catch (error) {
    console.error('Send verification OTP error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Verify account with OTP
router.post('/verify-account', async (req, res) => {
  try {
    const { otpCode } = req.body;
    const userId = req.user.id;

    if (!otpCode) {
      return res.status(400).json({ message: 'Vui lòng nhập mã OTP' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Check if OTP is valid
    if (!user.otpCode || user.otpCode !== otpCode) {
      return res.status(400).json({ message: 'Mã OTP không đúng' });
    }

    // Check if OTP is expired
    if (user.otpExpires && new Date() > user.otpExpires) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn' });
    }

    // Verify account
    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ 
      message: 'Tài khoản đã được xác thực thành công',
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        fullName: user.fullName,
        age: user.age,
        avatar: user.avatar,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Verify account error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
