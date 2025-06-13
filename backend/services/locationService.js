const axios = require("axios");

const isPrivateIP = (ipAddress) => {
  const parts = ipAddress.split(".");
  return (
    parts[0] === "10" ||
    parts[0] === "127" ||
    (parts[0] === "172" &&
      parseInt(parts[1]) >= 16 &&
      parseInt(parts[1]) <= 31) ||
    (parts[0] === "192" && parts[1] === "168")
  );
};

// Cache for storing successful lookups
const locationCache = new Map();

// Configure axios instances with proper headers and timeouts
const createAxiosInstance = (baseURL) => {
  return axios.create({
    baseURL,
    timeout: 5000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
  });
};

const geoServices = [
  {
    name: "ip-api",
    fetch: async (ipAddress) => {
      const api = createAxiosInstance("http://ip-api.com");
      const response = await api.get(`/json/${ipAddress}`);
      if (response.data.status === "success") {
        return {
          city: response.data.city,
          country: response.data.country,
          latitude: response.data.lat,
          longitude: response.data.lon,
          source: "ip-api",
        };
      }
      throw new Error("IP-API request failed");
    },
  },
  {
    name: "ipapi.co",
    fetch: async (ipAddress) => {
      const api = createAxiosInstance("https://ipapi.co");
      const response = await api.get(`/${ipAddress}/json/`);
      if (response.data.error)
        throw new Error(response.data.reason || "ipapi.co request failed");
      return {
        city: response.data.city,
        country: response.data.country_name,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        source: "ipapi.co",
      };
    },
  },
];

const locationFind = async (ipAddress) => {
  try {
    // Validate IP address format
    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (!ipRegex.test(ipAddress)) {
      throw new Error("Invalid IP address format");
    }

    // Check cache first
    if (locationCache.has(ipAddress)) {
      return locationCache.get(ipAddress);
    }

    // Handle private IP addresses
    if (isPrivateIP(ipAddress)) {
      const localData = {
        city: "Local Network",
        country: "Local",
        latitude: 0,
        longitude: 0,
        source: "local",
      };
      locationCache.set(ipAddress, localData);
      return localData;
    }

    // Try each service in sequence until one succeeds
    let lastError = null;
    for (const service of geoServices) {
      try {
        const locationData = await service.fetch(ipAddress);

        // Cache successful lookup
        locationCache.set(ipAddress, locationData);
        return locationData;
      } catch (error) {
        console.error(`${service.name} failed:`, error.message);
        lastError = error;
        continue;
      }
    }

    throw new Error(
      `All geolocation services failed. Last error: ${lastError.message}`
    );
  } catch (error) {
    console.error("Location lookup failed:", error.message);
    throw error;
  }
};

// Add the reverse geocode function
const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );

    return {
      city:
        response.data.address.city ||
        response.data.address.town ||
        response.data.address.village ||
        response.data.address.state_district ||
        "Unknown",
      country: response.data.address.country || "Unknown",
      latitude,
      longitude,
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
};

module.exports = {
  locationFind,
  reverseGeocode,
};
