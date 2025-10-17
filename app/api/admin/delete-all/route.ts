import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

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

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
    const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

    console.log('Starting database cleanup...');

    // Delete all data
    const [deletedUsers, deletedConversations, deletedMessages] = await Promise.all([
      User.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({})
    ]);

    console.log('Database cleanup completed:', {
      users: deletedUsers.deletedCount,
      conversations: deletedConversations.deletedCount,
      messages: deletedMessages.deletedCount
    });

    // Clean up uploads directory
    try {
      const uploadsPath = process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads');
      
      if (fs.existsSync(uploadsPath)) {
        const files = fs.readdirSync(uploadsPath);
        
        for (const file of files) {
          if (file !== '.gitkeep') {
            const filePath = path.join(uploadsPath, file);
            try {
              fs.unlinkSync(filePath);
              console.log('Deleted file:', file);
            } catch (error) {
              console.error('Error deleting file:', file, error);
            }
          }
        }
        
        console.log('Uploads directory cleaned');
      }
    } catch (error) {
      console.error('Error cleaning uploads directory:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'All data deleted successfully',
      deleted: {
        users: deletedUsers.deletedCount,
        conversations: deletedConversations.deletedCount,
        messages: deletedMessages.deletedCount
      }
    });

  } catch (error) {
    console.error('Admin delete-all error:', error);
    return NextResponse.json(
      { error: 'Failed to delete data' },
      { status: 500 }
    );
  }
}
