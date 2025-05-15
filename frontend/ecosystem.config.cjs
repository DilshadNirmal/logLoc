module.exports = {
  apps: [
    {
      name: "logloc-frontend",
      script: "serve",
      args: "./start-server.sh",
      instances: "1",
      exec_mode: "fork",
      env: {
        PM2_SERVE_PATH: "./dist",
        PM2_SERVE_PORT: 5173,
        PM2_SERVE_SPA: "true",
        NODE_ENV: "production",
        HOST: "0.0.0.0",
      },

      //   for live running not worked
      //   script: "pnpm",
      //   args: "run dev",
      //   interpreter: "none", // Don't use Node.js for npm/yarn
      //   watch: true, // Optional: Restart on file changes
      //   env: {
      //     NODE_ENV: "development",
      //     PORT: 5173, // Match Vite's default port
      //     HOST: "0.0.0.0", // Allow LAN access
      //   },
    },
  ],
};
