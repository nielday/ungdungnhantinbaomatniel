const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

// Check if B2 is configured
const isB2Configured = () => {
  return !!(process.env.B2_KEY_ID && 
            process.env.B2_APPLICATION_KEY && 
            process.env.B2_BUCKET_NAME &&
            process.env.B2_ENDPOINT &&
            process.env.B2_REGION);
};

// Backblaze B2 Configuration
// B2 is S3-compatible, so we use AWS SDK
let b2Client = null;
let BUCKET_NAME = null;

if (isB2Configured()) {
  console.log('✅ Backblaze B2 configured, initializing client...');
  b2Client = new S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: process.env.B2_REGION,
    credentials: {
      accessKeyId: process.env.B2_KEY_ID,
      secretAccessKey: process.env.B2_APPLICATION_KEY
    },
    forcePathStyle: true // Required for B2
  });
  BUCKET_NAME = process.env.B2_BUCKET_NAME;
  console.log('✅ B2 client initialized for bucket:', BUCKET_NAME);
} else {
  console.warn('⚠️ Backblaze B2 not configured. File uploads will not work.');
  console.warn('Required env vars: B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME, B2_ENDPOINT, B2_REGION');
}

// Upload file to B2
async function uploadToB2(fileBuffer, fileName, mimeType, folder = 'uploads') {
  if (!b2Client || !BUCKET_NAME) {
    throw new Error('Backblaze B2 is not configured. Please set B2 environment variables.');
  }
  
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
  if (!b2Client || !BUCKET_NAME) {
    console.warn('B2 not configured, skipping delete');
    return false;
  }
  
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
  if (!b2Client || !BUCKET_NAME) {
    throw new Error('Backblaze B2 is not configured');
  }
  
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
  BUCKET_NAME,
  isB2Configured
};

