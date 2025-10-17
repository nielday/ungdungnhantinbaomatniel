const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    default: '',
    maxlength: 200
  },
  avatar: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'admin'],
      default: 'member'
    }
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
  settings: {
    allowMemberInvite: {
      type: Boolean,
      default: true
    },
    allowMemberLeave: {
      type: Boolean,
      default: true
    },
    maxMembers: {
      type: Number,
      default: 100
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
GroupSchema.index({ members: 1, isActive: 1 });
GroupSchema.index({ createdBy: 1 });
GroupSchema.index({ lastMessageAt: -1 });
GroupSchema.index({ name: 'text', description: 'text' });

// Virtual for member count
GroupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Method to check if user is admin
GroupSchema.methods.isAdmin = function(userId) {
  return this.createdBy.toString() === userId.toString() || 
         this.admins.some(admin => admin.toString() === userId.toString());
};

// Method to check if user is member
GroupSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

// Method to add member
GroupSchema.methods.addMember = function(userId, role = 'member') {
  if (!this.isMember(userId)) {
    this.members.push({
      user: userId,
      role: role
    });
  }
};

// Method to remove member
GroupSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => 
    member.user.toString() !== userId.toString()
  );
};

// Method to promote to admin
GroupSchema.methods.promoteToAdmin = function(userId) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  if (member) {
    member.role = 'admin';
    if (!this.admins.includes(userId)) {
      this.admins.push(userId);
    }
  }
};

// Method to demote from admin
GroupSchema.methods.demoteFromAdmin = function(userId) {
  this.admins = this.admins.filter(admin => 
    admin.toString() !== userId.toString()
  );
  const member = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  if (member) {
    member.role = 'member';
  }
};

module.exports = mongoose.model('Group', GroupSchema);
