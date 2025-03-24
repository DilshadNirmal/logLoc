import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axiosInstance from "../lib/axios";

const CookieConsent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleConsent = async () => {
    try {
      await axiosInstance.post("/update-cookie-consent", {
        userId: user._id,
        consent: true,
      });
      navigate("/");
    } catch (error) {
      console.error("Error updating cookie consent:", error);
    }
  };

  const handleDecline = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          Cookie Consent
        </h2>
        <div className="mt-4 space-y-4">
          <p className="text-gray-600">
            We use cookies and similar technologies to help personalize content,
            tailor and measure ads, and provide a better experience. By clicking
            'Accept', you agree to this use of cookies and data.
          </p>
          <div className="space-y-2">
            <h3 className="font-semibold">We use cookies to:</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Remember your login details</li>
              <li>Understand how you use our website</li>
              <li>Enhance site navigation</li>
              <li>Improve our platform</li>
            </ul>
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={handleDecline}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Decline
            </button>
            <button
              onClick={handleConsent}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Accept All Cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
