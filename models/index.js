const mongoose = require('mongoose');

// Database connection with retry logic
const connectDB = async (retries = 5, delay = 5000) => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/messaging-app';
  
  // Validate MongoDB URI
  if (!mongoURI || mongoURI === 'mongodb://localhost:27017/messaging-app') {
    console.warn('⚠️  MONGODB_URI not set or using default. Please set MONGODB_URI environment variable.');
  }

  // Check if URI is valid format
  if (!mongoURI.includes('mongodb://') && !mongoURI.includes('mongodb+srv://')) {
    console.error('❌ Invalid MongoDB URI format. Must start with mongodb:// or mongodb+srv://');
    console.error('Current URI:', mongoURI.substring(0, 20) + '...');
    process.exit(1);
  }

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Attempting to connect to MongoDB (${i + 1}/${retries})...`);
      
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        retryWrites: true,
        w: 'majority'
      });
      
      console.log('✅ MongoDB connected successfully');
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err.message);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected successfully');
      });
      
      return;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${i + 1} failed:`, error.message);
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.error('💡 Possible issues:');
        console.error('   - MongoDB cluster may not exist or was deleted');
        console.error('   - Connection string may be incorrect');
        console.error('   - Network/DNS issues');
        console.error('   - Check MongoDB Atlas IP whitelist settings');
      }
      
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ Failed to connect to MongoDB after', retries, 'attempts');
        console.error('💡 Please check:');
        console.error('   1. MONGODB_URI environment variable is set correctly');
        console.error('   2. MongoDB cluster exists and is accessible');
        console.error('   3. IP whitelist allows Railway IPs (0.0.0.0/0 for all)');
        console.error('   4. Database user credentials are correct');
        // Don't exit process - let server continue running
        // process.exit(1);
      }
    }
  }
};

// Export all models
const User = require('./User');
const Conversation = require('./Conversation');
const Message = require('./Message');
const Group = require('./Group');

module.exports = {
  connectDB,
  User,
  Conversation,
  Message,
  Group
};
