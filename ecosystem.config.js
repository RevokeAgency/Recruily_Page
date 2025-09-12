module.exports = {
  apps: [{
    name: 'recruily-dev',
    script: './node_modules/.bin/next',
    args: 'dev',
    cwd: '/home/user/webapp',
    env: {
      NODE_ENV: 'development',
      PORT: '3000'
    },
    // PM2 configuration
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    // Development specific
    ignore_watch: ['node_modules', '.next', 'logs'],
    wait_ready: false
  }]
};