import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (accessToken && refreshToken) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/verify-token`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          console.log(response);
          setUser(response.data.user);
        } catch (error) {
          try {
            const refreshResponse = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/refresh-token`,
              { refreshToken }
            );
            localStorage.setItem(
              "accessToken",
              refreshResponse.data.accessToken
            );
            setUser(refreshResponse.data.user);
          } catch (refreshError) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setUser(null);
          }
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false); // Set loading to false when there's no acces
      }
    };
    initializeAuth();
  }, []);

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

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshToken = localStorage.getItem("refreshToken");

          try {
            const response = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/refresh-token`,
              { refreshToken }
            );
            localStorage.setItem("accessToken", response.data.accessToken);
            axios.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${response.data.accessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setUser(null);
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, verifyOTP }}
    >
      {children}
    </AuthContext.Provider>
  );
}
