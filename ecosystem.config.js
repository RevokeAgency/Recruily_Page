module.exports = {
  apps: [{
    name: 'recruily-dev',
    script: 'npm',
    args: 'run dev',
    cwd: '/home/user/webapp/Recruily_Page',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }, {
    name: 'recruily-prod',
    script: 'npm',
    args: 'run start',
    cwd: '/home/user/webapp/Recruily_Page',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};