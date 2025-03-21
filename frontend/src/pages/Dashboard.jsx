import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../utils/AxiosInstance";
import Table from "../components/Table";
import Modal from "../components/Modal";

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const [allUserData, setAllUserData] = useState([]);
  const [activeTab, setActiveTab] = useState("user-data");
  const [isDataSending, setIsDataSending] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState("1h");
  const navigate = useNavigate();
  const isAdmin = user?.Role === "admin";

  useEffect(() => {
    const fetchData = async () => {
      if (isAdmin) {
        try {
          const response = await AxiosInstance.get("/users", {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log(response.data);
          setAllUserData(response.data);
        } catch (error) {
          console.error("Failed to fetch users:", error);
        }
      }
    };

    fetchData();
  }, [user, token, isAdmin]);

  const handleLogout = async () => {
    try {
      await AxiosInstance.post("/logout");
      logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSendEmailClick = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDurationChange = (event) => {
    setSelectedDuration(event.target.value);
  };

  const handleSendEmail = async () => {
    if (selectedUser) {
      try {
        await AxiosInstance.post(
          `/send-data/${selectedUser._id}`,
          { duration: selectedDuration },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsDataSending((prev) => ({
          ...prev,
          [selectedUser._id]: true,
        }));
        setShowModal(false);
      } catch (error) {
        console.error("Error sending email:", error);
      }
    }
  };

  const handleStopEmail = async (userId) => {
    try {
      await AxiosInstance.post(
        `/stop-data/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsDataSending((prev) => ({
        ...prev,
        [userId]: false,
      }));
    } catch (error) {
      console.error("Error stopping email:", error);
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
          <ul className="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-b-gray-200">
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
