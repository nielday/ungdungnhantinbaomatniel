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

// Proxy endpoint - stream file through backend to avoid CORS issues
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

    // Generate presigned URL
    const presignedUrl = await generatePresignedUrl(fileUrl, 3600); // 1 hour

    // Fetch the file from B2 and stream it through our server
    const response = await fetch(presignedUrl);

    if (!response.ok) {
      return res.status(response.status).json({
        message: 'Failed to fetch file from storage'
      });
    }

    // Forward relevant headers
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1 hour

    // Stream the response body to client
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('File proxy error:', error);
    res.status(500).json({
      message: 'Failed to access file',
      error: error.message
    });
  }
});

module.exports = router;

