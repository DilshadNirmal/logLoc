import { createContext, useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AxiosInstance from "../utils/AxiosInstance";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Add this effect to fetch user data on refresh
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          // Add an endpoint to verify token and get user data
          const response = await AxiosInstance.get("/me");
          setUser(response.data);
          setToken(storedToken);

          // Redirect to intended path
          if (
            location.pathname === "/login" ||
            location.pathname === "/register"
          ) {
            navigate(location.state?.from || "/dashboard");
          }
        } catch (error) {
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
          navigate("/login");
        }
      } else if (
        location.pathname !== "/login" &&
        location.pathname !== "/register"
      ) {
        navigate("/login", { state: { from: location.pathname } });
      }
      setLoading(false);
    };

    initializeAuth();
  }, [navigate, location]);

  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem("token", accessToken);
    // localStorage.setItem("userData", JSON.stringify(userData));
  };

  useEffect(() => {
    console.log("Auth state:", {
      user,
      token,
      cookieConsent: localStorage.getItem("cookieConsent"),
      cookies: document.cookie,
    });
  }, [user, token]);

  const logout = async () => {
    try {
      await AxiosInstance.post("/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      // localStorage.removeItem("cookieConsent");
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
