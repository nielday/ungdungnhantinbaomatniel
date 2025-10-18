const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fetch = require('node-fetch');
const { User } = require('../models');

const router = express.Router();

// Email configuration for Brevo API
console.log('Brevo API config debug:', {
  apiKey: process.env.BREVO_API_KEY ? 'Present' : 'Missing',
  fromEmail: process.env.BREVO_FROM_EMAIL || 'Missing'
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email using Brevo API
const sendOTPEmail = async (email, otp) => {
  try {
    console.log('Attempting to send email to:', email);
    console.log('OTP code:', otp);
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: 'Messaging App Niel',
          email: process.env.BREVO_FROM_EMAIL
        },
        to: [
          {
            email: email
          }
        ],
        subject: 'Mã OTP xác thực tài khoản',
        htmlContent: `
          <!DOCTYPE html>
          <html lang="vi">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mã OTP Xác Thực</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
                <div style="background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; line-height: 1;">
                  <span style="font-size: 36px; color: white; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">🔐</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Xác Thực Tài Khoản</h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Ứng Dụng Nhắn Tin Bảo Mật Niel</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h2 style="color: #2d3748; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Mã Xác Thực Của Bạn</h2>
                  <p style="color: #718096; margin: 0; font-size: 16px; line-height: 1.5;">
                    Chúng tôi đã nhận được yêu cầu xác thực tài khoản của bạn. 
                    Vui lòng sử dụng mã OTP bên dưới để hoàn tất quá trình đăng ký/đăng nhập.
                  </p>
                </div>
                
                <!-- OTP Code -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                  <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 15px; font-size: 16px; font-weight: 500;">Mã OTP của bạn</p>
                  <div style="background-color: rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 20px; display: inline-block;">
                    <span style="font-size: 32px; font-weight: 700; color: white; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</span>
                  </div>
                </div>
                
                <!-- Info Box -->
                <div style="background-color: #f7fafc; border-left: 4px solid #4299e1; padding: 20px; border-radius: 8px; margin: 30px 0;">
                  <h3 style="color: #2d3748; margin: 0 0 10px; font-size: 18px; font-weight: 600;">📋 Thông Tin Quan Trọng</h3>
                  <ul style="color: #4a5568; margin: 0; padding-left: 20px; line-height: 1.6;">
                    <li>Mã OTP có hiệu lực trong <strong>5 phút</strong></li>
                    <li>Mã chỉ có thể sử dụng <strong>1 lần</strong></li>
                    <li>Không chia sẻ mã này với bất kỳ ai</li>
                    <li>Nếu không yêu cầu, vui lòng bỏ qua email này</li>
                  </ul>
                </div>
                
                <!-- Security Notice -->
                <div style="background-color: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px; padding: 20px; margin: 30px 0;">
                  <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 20px; margin-right: 10px;">🛡️</span>
                    <h3 style="color: #c53030; margin: 0; font-size: 16px; font-weight: 600;">Bảo Mật Tài Khoản</h3>
                  </div>
                  <p style="color: #742a2a; margin: 0; font-size: 14px; line-height: 1.5;">
                    Để bảo vệ tài khoản của bạn, chúng tôi khuyến nghị:
                  </p>
                  <ul style="color: #742a2a; margin: 10px 0 0; padding-left: 20px; font-size: 14px; line-height: 1.5;">
                    <li>Sử dụng mật khẩu mạnh và duy nhất</li>
                    <li>Không chia sẻ thông tin đăng nhập</li>
                    <li>Đăng xuất khỏi các thiết bị công cộng</li>
                  </ul>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
                  <p style="color: #718096; margin: 0 0 10px; font-size: 14px;">
                    Nếu bạn gặp vấn đề, vui lòng liên hệ hỗ trợ
                  </p>
                  <p style="color: #a0aec0; margin: 0; font-size: 12px;">
                    © 2024 Ứng Dụng Nhắn Tin Bảo Mật Niel. Tất cả quyền được bảo lưu.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Brevo API error:', error);
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
