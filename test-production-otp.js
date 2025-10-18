// Test OTP trên production environment
const API_BASE_URL = 'https://ungdungnhantinbaomatniel-production.up.railway.app/api';

const testProductionOTP = async () => {
  console.log('🚀 Testing OTP on Production Environment...\n');
  
  // Test 1: Health check
  try {
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
  
  // Test 2: Debug info
  try {
    const debugResponse = await fetch(`${API_BASE_URL}/debug`);
    const debugData = await debugResponse.json();
    console.log('✅ Debug info:', debugData);
  } catch (error) {
    console.error('❌ Debug check failed:', error);
  }
  
  // Test 3: Test route
  try {
    const testResponse = await fetch(`${API_BASE_URL}/test`);
    const testData = await testResponse.json();
    console.log('✅ Test route:', testData);
  } catch (error) {
    console.error('❌ Test route failed:', error);
  }
  
  console.log('\n📧 Để test OTP:');
  console.log('1. Truy cập: https://ung-dung-nhan-tin-niel.vercel.app');
  console.log('2. Thử đăng ký tài khoản mới');
  console.log('3. Kiểm tra email nhận OTP');
  console.log('4. Nhập OTP để xác thực');
  
  console.log('\n🔍 Nếu có lỗi:');
  console.log('- Kiểm tra Railway logs');
  console.log('- Kiểm tra environment variables trên Railway');
  console.log('- Đảm bảo Gmail App Password đúng');
};

// Chạy test
testProductionOTP().catch(console.error);
