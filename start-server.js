const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Messaging App...\n');

// Start backend server
console.log('📡 Starting backend server on port 3001...');
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

server.on('error', (err) => {
  console.error('❌ Backend server error:', err);
});

server.on('close', (code) => {
  console.log(`📡 Backend server exited with code ${code}`);
});

// Start frontend server
console.log('🌐 Starting frontend server on port 3000...');
const frontend = spawn('npm', ['run', 'dev', '--', '-p', '3000'], {
  stdio: 'inherit',
  cwd: __dirname
});

frontend.on('error', (err) => {
  console.error('❌ Frontend server error:', err);
});

frontend.on('close', (code) => {
  console.log(`🌐 Frontend server exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  server.kill();
  frontend.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down servers...');
  server.kill();
  frontend.kill();
  process.exit(0);
});
