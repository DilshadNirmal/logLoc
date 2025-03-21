import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../utils/AxiosInstance";

const OTPVerification = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // On mount, fetch user info and send OTP automatically
  useEffect(() => {
    const fetchUserAndSendOTP = async () => {
      try {
        const userResponse = await AxiosInstance.get("/me");
        const userPhone = userResponse.data.phoneNumber;
        if (userPhone) {
          setPhoneNumber(userPhone);
          const otpResponse = await AxiosInstance.post("/send-otp", {
            phoneNumber: userPhone,
          });
          if (otpResponse.data.success) {
            setMessage(`OTP sent to ${userPhone}`);
          } else {
            setError(otpResponse.data.message);
          }
        } else {
          setError("Phone number not found in your profile.");
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to retrieve phone number and send OTP"
        );
      }
    };

    fetchUserAndSendOTP();
  }, []);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await AxiosInstance.post("/verify-otp", {
        phoneNumber,
        otp,
      });
      if (response.data.success) {
        setMessage(response.data.message);
        // Redirect to dashboard or another page after successful verification
        navigate("/dashboard");
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          OTP Verification
        </h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        {message && <p className="text-green-500 text-center">{message}</p>}
        <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                readOnly={!!phoneNumber} // if phoneNumber was fetched, make field read-only
                className="appearance-none relative block w-full px-3 py-2 border 
                  border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                One-Time Password (OTP)
              </label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="appearance-none relative block w-full px-3 py-2 border 
                  border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Verify OTP
          </button>
        </form>
      </div>
    </div>
  );
};

export default OTPVerification;
