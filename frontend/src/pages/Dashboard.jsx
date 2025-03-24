import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Table from "../components/Table";
import Modal from "../components/Modal";
import axiosInstance from "../lib/axios";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [allUserData, setAllUserData] = useState([]);
  const [isDataSending, setIsDataSending] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("1h");
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("user-data");
  const isAdmin = user?.Role === "admin";

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/users");
      setAllUserData(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSendEmailClick = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDurationChange = (e) => {
    setSelectedDuration(e.target.value);
  };

  const handleSendEmail = async () => {
    try {
      await axiosInstance.post(`/send-data/${selectedUser._id}`, {
        duration: selectedDuration,
      });
      setIsDataSending((prev) => ({ ...prev, [selectedUser._id]: true }));
      setShowModal(false);
    } catch (error) {
      console.error("Error starting data sending:", error);
    }
  };

  const handleStopEmail = async (userId) => {
    try {
      await axiosInstance.post(`/stop-data/${userId}`);
      setIsDataSending((prev) => ({ ...prev, [userId]: false }));
    } catch (error) {
      console.error("Error stopping data sending:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">
              Welcome, {user?.UserName} ({user?.Role})
            </p>
            <p className="text-gray-600">Email: {user?.Email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {isAdmin && (
          <ul className="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200">
            <li className="me-2">
              <button
                onClick={() => setActiveTab("user-data")}
                className={`inline-block p-4 rounded-t-lg ${
                  activeTab === "user-data"
                    ? "bg-white text-blue-600 border-b-2 border-blue-600"
                    : "hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                User Data
              </button>
            </li>
          </ul>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          {activeTab === "user-data" && (
            <Table
              allUserData={allUserData}
              isDataSending={isDataSending}
              handleSendEmailClick={handleSendEmailClick}
              handleStopEmail={handleStopEmail}
            />
          )}
        </div>
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h2 className="text-xl font-semibold text-gray-900">
            Select Duration
          </h2>
          <div className="flex items-center justify-evenly gap-4">
            <select
              value={selectedDuration}
              onChange={handleDurationChange}
              className="mt-2 mb-4 p-2 border border-gray-300 rounded-md"
            >
              <option value="1h">Last 1 Hour</option>
              <option value="1d">Last 1 Day</option>
              <option value="1w">Last 1 Week</option>
              <option value="1m">Last 1 Month</option>
            </select>
            <button
              onClick={handleSendEmail}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
