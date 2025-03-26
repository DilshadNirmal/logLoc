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
    <div className="min-h-screen flex">
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white p-8 flex flex-col justify-center">
        <div className="max-w-xs mx-auto w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Sign in</h2>
          {error && <p className="text-red-500 text-center">{error}</p>}
          {locationError && (
            <p className="text-yellow-500 text-center text-sm">
              {locationError}
            </p>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Username"
                value={credentials.UserName}
                onChange={(e) =>
                  setCredentials({ ...credentials, UserName: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>
              <input
                id="password"
                type="password"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Password"
                value={credentials.Password}
                onChange={(e) =>
                  setCredentials({ ...credentials, Password: e.target.value })
                }
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>

      <div className="hidden md:flex md:w-2/3 lg:w-3/4 bg-gradient-to-r from-indigo-500 to-purple-600 p-12 flex-col justify-center">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-bold text-white mb-6">
            Discovering the Best Furniture for Your Home
          </h2>
          <p className="text-xl text-indigo-100 opacity-90">
            Our practice is Designing Complete Environments exceptional
            buildings communities and place in special situations
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
