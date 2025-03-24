const axios = require("axios");

const axiosInstance = axios.create();

axiosInstance.interceptors.request.use(
  (config) => {
    console.log(
      `[${new Date().toISOString()}] Making ${config.method.toUpperCase()} request to ${
        config.url
      }`
    );

    config.headers = {
      ...config.headers,
      "Content-Type": "application/json",
      "User-Agent": "Backend-Server",
    };

    return config;
  },
  (error) => {
    console.error(`Request error: ${error}`);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    console.log(
      `[${new Date().toISOString()}] Response from ${response.config.url}: ${
        response.status
      }`
    );
    return response;
  },
  (error) => {
    if (error.response) {
      console.error("Response error:", {
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      console.error("Request error:", error.request);
    } else {
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

module.exports = axiosInstance;
