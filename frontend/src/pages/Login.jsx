import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login, error } = useAuth();
  const [credentials, setCredentials] = useState({
    UserName: "",
    Password: "",
  });
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by your browser. Using IP-based location."
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(credentials);

      if (!response.user.cookieConsent) {
        navigate("/cookie-consent");
      } else if (!response.user.phoneVerified) {
        navigate("/verify-otp");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          Sign in
        </h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        {locationError && (
          <p className="text-yellow-500 text-center text-sm">{locationError}</p>
        )}
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
