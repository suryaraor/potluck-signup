module.exports = {
  apps: [{
    name: 'potluck-backend',
    script: './backend/index.js',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3001
    }
  }]
}