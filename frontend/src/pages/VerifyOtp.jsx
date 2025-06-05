import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axiosInstance from "../lib/axios";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user?.phoneNumber) {
      setPhoneNumber(user.phoneNumber);
    }
  }, [user]);

  const handleSendOTP = async () => {
    try {
      setError("");
      setMessage("");

      await axiosInstance.post("/send-otp", { phoneNumber });
      setIsOtpSent(true);
      setIsEditing(false);
      setMessage("OTP sent successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setMessage("");
  
      const response = await axiosInstance.post("/verify-otp", {
        phoneNumber,
        otp,
      });
  
      if (response.data.success) {
        setMessage("Phone number verified successfully");
        if (updateUser) {
          updateUser({
            ...user,
            phoneNumber,
            phoneVerified: true,
          });
        }
  
        // Check if cookie consent is needed
        if (!user.cookieConsent) {
          setTimeout(() => navigate("/cookie-consent", { replace: true }), 1500);
        } else {
          setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setIsOtpSent(false);
    setError("");
    setMessage("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-secondary rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center text-text">
          Phone Verification
        </h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        {message && <p className="text-green-500 text-center">{message}</p>}

        <div className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-text">
              Phone Number
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                disabled={!isEditing}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-text/20 bg-secondary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-secondary/50 text-text placeholder-text/50"
              />
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="inline-flex items-center px-4 py-2 border border-text/20 text-sm font-medium rounded-r-md text-text bg-secondary hover:bg-secondary/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Edit
                </button>
              ) : (
                <button
                  onClick={handleSendOTP}
                  disabled={isOtpSent}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-text bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                >
                  Send OTP
                </button>
              )}
            </div>
          </div>

          {isOtpSent && (
            <form onSubmit={handleVerifyOTP}>
              <div>
                <label className="block text-sm font-medium text-text">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="mt-1 block w-full px-3 py-2 border border-text/20 rounded-md shadow-sm bg-secondary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-text placeholder-text/50"
                />
              </div>
              <button
                type="submit"
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-text bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Verify OTP
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
