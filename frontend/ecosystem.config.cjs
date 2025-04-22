module.exports = {
    apps: [{
        name: "logLoc-frontend",
        script: "serve",
        args: "./start-server.sh",
        instances: "1",
        exec_mode: "fork",
        env: {
            PM2_SERVE_PATH: "./dist",
            PM2_SERVE_PORT: 5173,
            PM2_SERVE_SPA: "true",
            NODE_ENV: "production",
            HOST: "0.0.0.0"
        }
    }]
}