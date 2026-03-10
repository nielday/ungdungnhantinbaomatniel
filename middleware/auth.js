const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  // Lấy token từ header Authorization (cách cũ) HOẶC từ HttpOnly cookie (cách mới)
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // Nếu không có token ở header, kiểm tra trong cookie
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-otpCode -otpExpires');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Single Active Device Policy Check
    if (!decoded.sessionId || !user.currentSessionToken || user.currentSessionToken !== decoded.sessionId) {
      return res.status(401).json({
        message: 'Phiên đăng nhập đã hết hạn hoặc bạn đã đăng nhập ở thiết bị khác.',
        isSessionRevoked: true
      });
    }

    // Allow unverified users for verification routes
    const verificationRoutes = ['/send-verification-otp', '/verify-account'];
    const isVerificationRoute = verificationRoutes.some(route => req.path.includes(route));

    if (!user.isVerified && !isVerificationRoute) {
      return res.status(401).json({ message: 'User not verified' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = {
  authenticateToken
};
