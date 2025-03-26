import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import bg_image from "../assets/RusticHome.jpg";
import logo from "../assets/xyma.png";

const Login = () => {
  const navigate = useNavigate();
  const { user, login, error } = useAuth();
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

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#C5D5E0]">
      <div className="flex bg-cyan-100 rounded-2xl shadow-lg max-w-3xl p-5">
        {/* form */}
        <div className="sm:w-1/2 px-8 md:px-16 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#002D74]">Welcome Back!</h2>
            <p className="text-sm mt-4">
              Please enter your credentials to login.
            </p>
          </div>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          {locationError && (
            <p className="text-yellow-500 text-center text-sm mb-4">
              {locationError}
            </p>
          )}
          <form className="flex flex-col gap-6 w-full" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="name"
                className="block mb-2 font-medium text-[#295092]"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                className="w-full p-2 rounded-xl border border-[#295092] focus:outline-none focus:ring focus:ring-[#295092] focus:border-transparent transition-all duration-200"
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
                className="block mb-2 font-medium text-[#295092]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="w-full p-2 rounded-xl border border-[#295092] focus:outline-none focus:ring focus:ring-[#295092] focus:border-transparent transition-all duration-200"
                placeholder="Password"
                value={credentials.Password}
                onChange={(e) =>
                  setCredentials({ ...credentials, Password: e.target.value })
                }
              />
            </div>
            <button
              type="submit"
              className="bg-[#002D74] text-white font-medium py-3 mt-4 rounded-xl hover:bg-[#001d4d] transition-colors duration-200"
            >
              Sign in
            </button>
          </form>
        </div>
        {/* image */}
        <div className="sm:block hiddden w-1/2 relative">
          <img
            src={bg_image}
            alt="some image"
            className="rounded-2xl object-cover h-full"
          />
          <div className="absolute top-0 right-0 w-full h-full bg-[#006471] opacity-65 rounded-2xl"></div>
          <img src={logo} alt="" className="absolute inset-0 m-auto w-1/2" />
        </div>
      </div>
    </section>
  );
};

export default Login;
