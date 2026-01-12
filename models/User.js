const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 1,
    max: 120
  },
  avatar: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otpCode: {
    type: String,
    default: null
  },
  otpExpires: {
    type: Date,
    default: null
  },

  // E2EE Encryption Keys
  publicKey: {
    type: String,
    default: null
  },
  encryptedPrivateKey: {
    type: String,
    default: null
  },
  keySalt: {
    type: String,
    default: null
  },
  keyCreatedAt: {
    type: Date,
    default: null
  },

  // Trusted Devices for E2EE key access
  trustedDevices: [{
    deviceId: {
      type: String,
      required: true
    },
    deviceName: {
      type: String,
      default: 'Unknown Device'
    },
    lastUsed: {
      type: Date,
      default: Date.now
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
