// Create new file: src/components/Settings/ChangePasswordModal.jsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSignals } from "@preact/signals-react/runtime";
import { showChangePasswordModal } from "../signals/settings";
import { toast } from "react-hot-toast";

const ChangePasswordModal = () => {
  useSignals();
  const { user, changePassword } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (!user || !user._id) {
      setError("User not found. Please log in again.");
      return;
    }

    try {
      const result = await changePassword(
        user._id,
        formData.currentPassword,
        formData.newPassword
      );
      if (result.success) {
        setSuccessMessage(result.message || "Password changed successfully!");
        toast.success(result.message || "Password changed successfully!");
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        // Optionally close the modal after a delay
        setTimeout(() => {
          showChangePasswordModal.value = false;
        }, 2000);
      } else {
        setError(result.error || "Failed to change password.");
        toast.error(result.error || "Failed to change password.");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Handle submit error:", err);
    }
  };

  // if (!user || user.Role === "super_admin") {
  //   return null;
  // }

  return (
    <div className="p-4 rounded-lg w-full">
      <h1 className="text-2xl font-semibold tracking-wider text-text mb-8">
        Change Password
      </h1>

      {/* {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )} */}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-text/70 mb-2">Current Password</label>
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            className="w-full p-2 border border-secondary rounded bg-background text-text"
            required
          />
        </div>

        <div>
          <label className="block text-text/70 mb-2">New Password</label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className="w-full p-2 border border-secondary rounded bg-background text-text"
            required
          />
        </div>

        <div>
          <label className="block text-text/70 mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full p-2 border border-secondary rounded bg-background text-text"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary/80 transition-colors"
        >
          Change Password
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordModal;
