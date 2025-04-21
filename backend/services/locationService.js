// reverse geocode function
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

module.exports = { reverseGeocode };
