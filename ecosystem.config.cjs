module.exports = {
  apps: [
    {
      name: 'gfx-server',
      script: 'server.js',
      cwd: '/Users/keenansquires/Desktop/graphics-business',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
    },
    {
      name: 'gfx-tunnel',
      script: 'cloudflared',
      interpreter: 'none',
      args: 'tunnel --url http://localhost:3001 --no-autoupdate',
      cwd: '/Users/keenansquires/Desktop/graphics-business',
      watch: false,
      autorestart: true,
    },
  ],
}
