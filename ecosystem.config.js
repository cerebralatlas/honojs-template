module.exports = {
  apps: [{
    name: 'honojs-template',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    
    // Process management
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Monitoring
    monitoring: false,
    
    // Memory management
    max_memory_restart: '1G',
    
    // Auto restart on file changes (development only)
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      '.git'
    ],
    
    // Health check
    health_check_enabled: true,
    health_check_grace_period: 3000,
    health_check_interval: 30000,
    health_check_max_restarts: 3,
    health_check_fatal_exceptions: true
  }]
}