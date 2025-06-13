import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthContextProvider = AuthContext.Provider;
export const AuthContextConsumer = AuthContext.Consumer;

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
            `${import.meta.env.VITE_BACKEND_URL}auth/verify-token`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          setUser(response.data.user);
        } catch (error) {
          try {
            const refreshResponse = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}auth/refresh-token`,
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

  const updateUser = async (updatedUserData) => {
    try {
      // First verify the token
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      // Update the user state immediately
      const updatedUser = { ...user, ...updatedUserData };
      setUser(updatedUser);

      // Also update the user in the server
      if (updatedUserData.cookieConsent !== undefined) {
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}auth/update-cookie-consent`,
          {
            consent: updatedUserData.cookieConsent,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      }

      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

  const changePassword = async (userId, currentPassword, newPassword) => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      return {
        success: false,
        error: "No access token found. Please log in again.",
      };
    }

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/users/${userId}/change-password`,
        { currentPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return { success: true, message: response.data.message };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to change password.";
      console.error(
        "Change password error:",
        err.response?.data || err.message
      );
      return { success: false, error: errorMessage };
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}auth/login`,
        credentials
      );

      const { user, accessToken, refreshToken, loginActivityId } =
        response.data;

      // First check verification status before setting user
      if (!user.phoneVerified) {
        // Store tokens but don't set user state yet
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        return {
          success: true,
          redirect: "/verify-otp",
          user,
        };
      }

      if (!user.cookieConsent) {
        // Store tokens but don't set user state yet
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        return {
          success: true,
          redirect: "/cookie-consent",
          user,
        };
      }

      // Only set user state if fully verified
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      setUser(user);

      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear all auth data
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
      setError(null);
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
              `${import.meta.env.VITE_BACKEND_URL}auth/refresh-token`,
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
      value={{
        user,
        updateUser,
        loading,
        error,
        login,
        logout,
        verifyOTP,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
