import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axiosInstance from "../lib/axios";
import { useState } from "react";

const CookieConsent = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleConsent = async () => {
    try {
      setError("");
      setSuccess("");

      // Update user state with cookie consent
      const updatedUser = await updateUser({
        cookieConsent: true,
      });

      if (updatedUser) {
        setSuccess("Cookie consent updated successfully");
        // Navigate to dashboard since both verifications are complete
        setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
      }
    } catch (error) {
      setError(error.message || "Failed to update cookie consent");
      console.error("Cookie consent error details:", error);
    }
  };

  const handleDecline = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-2xl w-full space-y-8 p-8 bg-secondary rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center text-text">
          Cookie Consent
        </h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        {success && <p className="text-green-500 text-center">{success}</p>}
        <div className="mt-4 space-y-4">
          <p className="text-text/80">
            We use cookies and similar technologies to help personalize content,
            tailor and measure ads, and provide a better experience. By clicking
            'Accept', you agree to this use of cookies and data.
          </p>
          <div className="space-y-2">
            <h3 className="font-semibold text-text">We use cookies to:</h3>
            <ul className="list-disc list-inside text-text/80 space-y-1">
              <li>Remember your login details</li>
              <li>Understand how you use our website</li>
              <li>Enhance site navigation</li>
              <li>Improve our platform</li>
            </ul>
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={handleDecline}
              className="px-4 py-2 border border-text/20 text-text rounded-md hover:bg-secondary/70"
            >
              Decline
            </button>
            <button
              onClick={handleConsent}
              className="px-4 py-2 bg-primary text-text rounded-md hover:bg-primary/80"
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
