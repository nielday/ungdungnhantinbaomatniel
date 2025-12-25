const express = require('express');
const { generatePresignedUrl } = require('../config/b2');

const router = express.Router();

// Get presigned URL for a B2 file
// This allows private bucket files to be accessed with time-limited URLs
router.get('/presigned-url', async (req, res) => {
  try {
    const { fileUrl } = req.query;
    
    if (!fileUrl) {
      return res.status(400).json({
        message: 'fileUrl parameter is required'
      });
    }

    // Check if it's a B2 URL
    if (!fileUrl.includes('backblazeb2.com')) {
      // Not a B2 URL, return as-is (might be old local file)
      return res.json({ url: fileUrl });
    }

    // Generate presigned URL (valid for 24 hours)
    const presignedUrl = await generatePresignedUrl(fileUrl, 86400);
    
    res.json({ 
      url: presignedUrl,
      expiresIn: 86400 // 24 hours in seconds
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    res.status(500).json({
      message: 'Failed to generate presigned URL',
      error: error.message
    });
  }
});

// Proxy endpoint - redirect to file with presigned URL
router.get('/proxy', async (req, res) => {
  try {
    const { fileUrl } = req.query;
    
    if (!fileUrl) {
      return res.status(400).json({
        message: 'fileUrl parameter is required'
      });
    }

    // Check if it's a B2 URL
    if (!fileUrl.includes('backblazeb2.com')) {
      // Not a B2 URL, redirect to original
      return res.redirect(fileUrl);
    }

    // Generate presigned URL and redirect
    const presignedUrl = await generatePresignedUrl(fileUrl, 3600); // 1 hour
    res.redirect(presignedUrl);
  } catch (error) {
    console.error('File proxy error:', error);
    res.status(500).json({
      message: 'Failed to access file',
      error: error.message
    });
  }
});

module.exports = router;

