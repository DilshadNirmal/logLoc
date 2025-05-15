module.exports = {
  apps: [
    {
      name: "logloc-backend",
      script: "server.js",
      cwd: "/mnt/appdata/apps/logLoc/backend",
      interpreter:
        "/home/lamrin/.local/share/fnm/node-versions/v22.15.1/installation/bin/node",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        REDIS_URL: "redis://localhost:6379",
        MONGODB_URI: "mongodb://localhost:27017",
      },
      watch: false,
      instances: "3",
      exec_mode: "cluster",
    },
  ],
};
