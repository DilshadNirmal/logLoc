import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AxiosInstance from "../utils/AxiosInstance";

const Login = () => {
  const [credentials, setCredentials] = useState({
    UserName: "",
    Password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  // Function to handle the login process
  const handleLogin = async (latitude = null, longitude = null) => {
    try {
      const loginData = {
        ...credentials,
        latitude,
        longitude,
      };

      const response = await AxiosInstance.post("/login", loginData);
      login(response.data.user, response.data.accessToken);
      if (!response.data.user.phoneVerified) {
        navigate("/otp");
      } else if (response.data.hasCookieConsent) {
        localStorage.setItem("cookieConsent", "true");
        navigate("/dashboard");
      } else {
        navigate("/cookie-consent");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      await handleLogin(position.coords.latitude, position.coords.longitude);
    } catch (err) {
      if (err.code === err.PERMISSION_DENIED) {
        // Fallback if location access is denied
        await handleLogin(null, null);
      } else {
        setError(err.response?.data?.error || "Login failed");
      }
    }
  };

  useEffect(() => {
    if (user) {
      navigate(location.state?.from || "/dashboard");
    }
  }, [user, navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          Sign in
        </h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={credentials.UserName}
                onChange={(e) =>
                  setCredentials({ ...credentials, UserName: e.target.value })
                }
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={credentials.Password}
                onChange={(e) =>
                  setCredentials({ ...credentials, Password: e.target.value })
                }
              />
            </div>
          </div>
          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
