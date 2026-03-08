const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // E2EE Encryption mode
  encryptionMode: {
    type: String,
    enum: ['none', 'e2ee'],
    default: 'none'
  },

  // Soft delete for local history clearing
  deletedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deletedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Archived chats
  archivedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for efficient querying
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
