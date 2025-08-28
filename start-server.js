#!/usr/bin/env node

/**
 * Stable server startup script
 * This ensures Next.js starts correctly and stays running
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Recruily server...');

// Change to the correct directory
process.chdir('/home/user/webapp/Recruily_Page');

// Set environment variables
process.env.NODE_ENV = 'development';
process.env.PORT = '3000';

// Start Next.js development server
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  cwd: '/home/user/webapp/Recruily_Page',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: '3000'
  }
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

server.on('exit', (code, signal) => {
  console.log(`🔄 Server exited with code ${code} and signal ${signal}`);
  if (code !== 0) {
    console.log('🔄 Restarting server...');
    // Restart after a short delay
    setTimeout(() => {
      console.log('🔄 Attempting restart...');
      process.exit(1); // Let PM2 handle the restart
    }, 2000);
  }
});

// Handle process signals
process.on('SIGINT', () => {
  console.log('🛑 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down server...');
  server.kill('SIGTERM');
});