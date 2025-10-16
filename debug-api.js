// Debug script để kiểm tra API
const fetch = require('node-fetch');

const API_URL = 'https://ungdungnhantinbaomatniel-production.up.railway.app/api';

async function debugAPI() {
  console.log('🔍 Debug API...');
  
  // Test health check
  try {
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

debugAPI();
