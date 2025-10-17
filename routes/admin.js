const express = require('express');
const { User, Conversation, Message } = require('../models');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Delete all data
router.delete('/delete-all', async (req, res) => {
  try {
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
      const uploadsPath = process.env.UPLOAD_PATH || path.join(__dirname, 'uploads');
      
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

    res.json({
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
    res.status(500).json({
      error: 'Failed to delete data',
      details: error.message
    });
  }
});

module.exports = router;
