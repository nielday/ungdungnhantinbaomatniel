const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

// Backblaze B2 Configuration
// B2 is S3-compatible, so we use AWS SDK
const b2Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT || 'https://s3.us-west-004.backblazeb2.com',
  region: process.env.B2_REGION || 'us-west-004',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY
  },
  forcePathStyle: true // Required for B2
});

const BUCKET_NAME = process.env.B2_BUCKET_NAME;

// Upload file to B2
async function uploadToB2(fileBuffer, fileName, mimeType, folder = 'uploads') {
  try {
    const key = `${folder}/${Date.now()}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType
      // No ACL for private buckets - will use presigned URLs or direct download
    });

    await b2Client.send(command);
    
    // For private buckets, construct download URL via B2 API
    // Format: https://{endpoint}/{bucketName}/{key}
    const endpoint = process.env.B2_ENDPOINT?.replace('https://', '');
    const fileUrl = `https://${endpoint}/file/${BUCKET_NAME}/${key}`;
    
    console.log('File uploaded to B2:', fileUrl);
    return fileUrl;
  } catch (error) {
    console.error('B2 upload error:', error);
    throw new Error('Failed to upload file to B2');
  }
}

// Delete file from B2
async function deleteFromB2(fileUrl) {
  try {
    // Extract key from URL
    // For private buckets: https://{endpoint}/file/{bucketName}/{key}
    // Need to extract the key part after bucketName
    let key;
    
    if (fileUrl.includes('/file/')) {
      // Format: https://{endpoint}/file/{bucketName}/{key}
      const parts = fileUrl.split(`/file/${BUCKET_NAME}/`);
      key = parts[1];
    } else {
      // Fallback: assume it's just the key or try to extract
      const urlParts = fileUrl.split('/');
      key = urlParts.slice(3).join('/');
    }
    
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await b2Client.send(command);
    console.log('File deleted from B2:', key);
    return true;
  } catch (error) {
    console.error('B2 delete error:', error);
    return false;
  }
}

// Generate presigned URL for private bucket files
async function generatePresignedUrl(fileUrl, expiresIn = 86400) { // 24 hours default
  try {
    // Extract key from B2 file URL
    // Format: https://{endpoint}/file/{bucketName}/{key}
    let key;
    
    if (fileUrl.includes('/file/')) {
      const parts = fileUrl.split(`/file/${BUCKET_NAME}/`);
      key = parts[1];
    } else {
      // Fallback
      const urlParts = fileUrl.split('/');
      key = urlParts.slice(3).join('/');
    }
    
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const signedUrl = await getSignedUrl(b2Client, command, { expiresIn });
    console.log('Generated presigned URL for:', key);
    return signedUrl;
  } catch (error) {
    console.error('Generate presigned URL error:', error);
    throw error;
  }
}

module.exports = {
  b2Client,
  uploadToB2,
  deleteFromB2,
  generatePresignedUrl,
  BUCKET_NAME
};

