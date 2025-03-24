import { createContext, useContext, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation error:", error);
          resolve(null);
        },
        { timeout: 5000 }
      );
    });
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      // Get user's location
      const locationData = await getUserLocation();

      const loginData = {
        ...credentials,
        ...(locationData && {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        }),
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/login`,
        loginData
      );

      setUser(response.data.user);
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  };

  const verifyOTP = async (phoneNumber, otp) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/verify-otp`,
        {
          phoneNumber,
          otp,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response.data.success) {
        setUser(response.data.user);
      }
      return response.data;
    } catch (err) {
      throw err.response?.data?.error || "OTP verification failed";
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, verifyOTP }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
