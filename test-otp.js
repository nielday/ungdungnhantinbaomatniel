// Test OTP functionality
const nodemailer = require('nodemailer');
require('dotenv').config();

// Test email configuration
const testEmailConfig = () => {
  console.log('🔧 Testing Email Configuration...');
  
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      ciphers: 'SSLv3'
    }
  });

  // Test connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email configuration error:', error);
    } else {
      console.log('✅ Email server is ready to send emails');
    }
  });
};

// Test OTP generation
const testOTPGeneration = () => {
  console.log('🔢 Testing OTP Generation...');
  
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
  for (let i = 0; i < 5; i++) {
    const otp = generateOTP();
    console.log(`OTP ${i + 1}: ${otp} (length: ${otp.length})`);
  }
};

// Test email sending
const testEmailSending = async () => {
  console.log('📧 Testing Email Sending...');
  
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      ciphers: 'SSLv3'
    }
  });

  const testOTP = '123456';
  const testEmail = process.env.EMAIL_USER; // Send to yourself

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: testEmail,
      subject: 'Test OTP - Messaging App Niel',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Test OTP Email</h2>
          <p>This is a test email to verify OTP functionality.</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #007bff; letter-spacing: 5px;">
            ${testOTP}
          </div>
          <p>If you receive this email, OTP configuration is working correctly!</p>
        </div>
      `
    });
    
    console.log('✅ Test email sent successfully!');
  } catch (error) {
    console.error('❌ Error sending test email:', error);
  }
};

// Run all tests
const runTests = async () => {
  console.log('🚀 Starting OTP Configuration Tests...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`EMAIL_HOST: ${process.env.EMAIL_HOST || 'NOT SET'}`);
  console.log(`EMAIL_PORT: ${process.env.EMAIL_PORT || 'NOT SET'}`);
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? 'SET' : 'NOT SET'}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}`);
  console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'SET' : 'NOT SET'}\n`);
  
  // Run tests
  testEmailConfig();
  testOTPGeneration();
  await testEmailSending();
  
  console.log('\n✅ All tests completed!');
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEmailConfig, testOTPGeneration, testEmailSending };
