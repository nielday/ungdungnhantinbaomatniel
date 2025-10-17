import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// Define schemas
const UserSchema = new mongoose.Schema({
  phoneNumber: String,
  email: String,
  fullName: String,
  age: Number,
  avatar: String,
  isVerified: Boolean,
  otpCode: String,
  otpExpires: Date
});

const ConversationSchema = new mongoose.Schema({
  type: String,
  participants: [mongoose.Schema.Types.ObjectId],
  groupName: String,
  groupAvatar: String,
  lastMessage: mongoose.Schema.Types.ObjectId,
  lastMessageAt: Date,
  createdBy: mongoose.Schema.Types.ObjectId,
  isActive: Boolean
});

const MessageSchema = new mongoose.Schema({
  conversationId: mongoose.Schema.Types.ObjectId,
  senderId: mongoose.Schema.Types.ObjectId,
  content: String,
  messageType: String,
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    mimeType: String
  }],
  replyTo: mongoose.Schema.Types.ObjectId,
  isEdited: Boolean,
  editedAt: Date,
  isDeleted: Boolean,
  readBy: [{
    userId: mongoose.Schema.Types.ObjectId,
    readAt: Date
  }],
  createdAt: Date
});

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
    const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

    // Get stats
    const [usersCount, conversationsCount, messagesCount] = await Promise.all([
      User.countDocuments(),
      Conversation.countDocuments(),
      Message.countDocuments()
    ]);

    // Count files (messages with attachments)
    const filesCount = await Message.countDocuments({
      'attachments.0': { $exists: true }
    });

    return NextResponse.json({
      users: usersCount,
      conversations: conversationsCount,
      messages: messagesCount,
      files: filesCount
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
