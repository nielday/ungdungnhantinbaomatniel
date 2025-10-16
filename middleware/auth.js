const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Auth middleware - URL:', req.url);
  console.log('Auth middleware - Token:', token ? 'Present' : 'Missing');
  console.log('Auth middleware - JWT_SECRET:', process.env.JWT_SECRET ? 'Present' : 'Missing');

  if (!token) {
    console.log('Auth middleware - No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Decoded token:', decoded);
    
    const user = await User.findById(decoded.userId).select('-otpCode -otpExpires');
    console.log('Auth middleware - User found:', user ? 'Yes' : 'No');
    console.log('Auth middleware - User ID:', user?._id);
    
    if (!user) {
      console.log('Auth middleware - User not found');
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isVerified) {
      console.log('Auth middleware - User not verified');
      return res.status(401).json({ message: 'User not verified' });
    }

    console.log('Auth middleware - Authentication successful for user:', user._id);
    req.user = user;
    next();
  } catch (error) {
    console.log('Auth middleware - Token verification failed:', error.message);
    console.log('Auth middleware - Error details:', error);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = {
  authenticateToken
};
