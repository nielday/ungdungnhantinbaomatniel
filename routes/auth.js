const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');
const { User } = require('../models');

const router = express.Router();

// Email configuration for Resend
console.log('Resend config debug:', {
  apiKey: process.env.RESEND_API_KEY ? 'Present' : 'Missing',
  fromEmail: process.env.RESEND_FROM_EMAIL || 'Missing'
});

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email using Resend
const sendOTPEmail = async (email, otp) => {
  try {
    console.log('Attempting to send email to:', email);
    console.log('OTP code:', otp);
    
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Mã OTP xác thực tài khoản',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Xác thực tài khoản</h2>
          <p>Mã OTP của bạn là:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #007bff; letter-spacing: 5px;">
            ${otp}
          </div>
          <p>Mã này có hiệu lực trong 5 phút.</p>
          <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
        </div>
      `
    });
    
    if (error) {
      console.error('Resend error:', error);
      return false;
    }
    
    console.log('Email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Register user
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, email, fullName, age } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ phoneNumber }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Số điện thoại hoặc email đã được sử dụng'
      });
    }

    // Create new user with OTP verification
    const user = new User({
      phoneNumber,
      email,
      fullName,
      age,
      isVerified: false  // Require OTP verification
    });

    await user.save();

    // Generate OTP
    const otpCode = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.otpCode = otpCode;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(user.email, otpCode);
    if (!emailSent) {
      return res.status(500).json({
        message: 'Không thể gửi email OTP'
      });
    }

    res.status(201).json({
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP.',
      userId: user._id,
      email: user.email
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otpCode } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: 'Tài khoản đã được xác thực'
      });
    }

    if (!user.otpCode || !user.otpExpires) {
      return res.status(400).json({
        message: 'Mã OTP không hợp lệ'
      });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({
        message: 'Mã OTP đã hết hạn'
      });
    }

    if (user.otpCode !== otpCode) {
      return res.status(400).json({
        message: 'Mã OTP không đúng'
      });
    }

    // Verify user
    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Xác thực thành công',
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        fullName: user.fullName,
        age: user.age,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: 'Tài khoản đã được xác thực'
      });
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    user.otpCode = otpCode;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(user.email, otpCode);
    if (!emailSent) {
      return res.status(500).json({
        message: 'Không thể gửi email OTP'
      });
    }

    res.json({
      message: 'Đã gửi lại mã OTP'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({
        message: 'Số điện thoại không tồn tại'
      });
    }

    // Generate OTP for login
    const otpCode = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.otpCode = otpCode;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(user.email, otpCode);
    if (!emailSent) {
      return res.status(500).json({
        message: 'Không thể gửi email OTP'
      });
    }

    res.json({
      message: 'Vui lòng kiểm tra email để lấy mã OTP.',
      userId: user._id,
      email: user.email
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

// Verify login OTP
router.post('/verify-login', async (req, res) => {
  try {
    const { userId, otpCode } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại'
      });
    }

    if (!user.otpCode || !user.otpExpires) {
      return res.status(400).json({
        message: 'Mã OTP không hợp lệ'
      });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({
        message: 'Mã OTP đã hết hạn'
      });
    }

    if (user.otpCode !== otpCode) {
      return res.status(400).json({
        message: 'Mã OTP không đúng'
      });
    }

    // Clear OTP
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        fullName: user.fullName,
        age: user.age,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Verify login error:', error);
    res.status(500).json({
      message: 'Lỗi server'
    });
  }
});

module.exports = router;
