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
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://phonghd2005:phonghd2005@cluster0.mongodb.net/chat-app?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
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
    console.log('Starting admin delete-all request...');
    
    await connectDB();
    console.log('MongoDB connected, proceeding with deletion...');

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
      { 
        error: 'Failed to delete data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
