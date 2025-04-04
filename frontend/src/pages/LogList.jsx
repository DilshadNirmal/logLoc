import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Table from "../components/Table";
import Modal from "../components/Modal";
import axiosInstance from "../lib/axios";

const LogList = () => {
  const { user, logout } = useAuth();
  const [allUserData, setAllUserData] = useState([]);
  const [isDataSending, setIsDataSending] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("1h");
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("user-data");
  const isAdmin = user?.Role === "admin" || user?.Role === "super_admin";

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
    <div className="min-h-screen bg-background pt-28">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">Dashboard</h1>
          <p className="text-text/75">
            Welcome, {user?.UserName} ({user?.Role})
          </p>
          <p className="text-text/70">Email: {user?.Email}</p>
        </div>

        {/* {isAdmin && (
          <ul className="flex flex-wrap text-sm text-center">
            <li className="me-2">
              <button
                onClick={() => setActiveTab("user-data")}
                className={`inline-block p-4 rounded-t-lg font-medium text-xl ${
                  activeTab === "user-data"
                    ? "bg-primary/85 text-secondary "
                    : "hover:text-secondary/80 hover:bg-primary/80"
                }`}
              >
                User Data
              </button>
            </li>
          </ul>
        )} */}

        <div className="bg-secondary/10 shadow rounded-lg overflow-hidden">
          <Table
            data={allUserData}
            columns={[
              { key: "UserName", header: "Username" },
              { key: "Email", header: "Email" },
              {
                key: "Role",
                header: "Role",
                render: (role) => (
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      role === "admin"
                        ? "bg-purple-300 text-purple-800"
                        : "bg-blue-200 text-blue-800"
                    }`}
                  >
                    {role || "User"}
                  </span>
                ),
              },
              { key: "phoneNumber", header: "Phone Number" },
            ]}
            actions={(userData) => (
              <>
                {isDataSending[userData._id] ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStopEmail(userData._id);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    disabled={!isDataSending[userData._id]}
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendEmailClick(userData);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Send Email
                  </button>
                )}
              </>
            )}
            expandableContent={(userData) => (
              <div className="px-8 py-6 bg-background/50">
                <h3 className="text-lg font-semibold text-primary mb-4">
                  Activity History
                </h3>
                <div className="space-y-4">
                  {userData.activities.map((activity, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-4 gap-6 p-4 rounded-lg bg-secondary/5 border border-secondary/10"
                    >
                      <div className="flex flex-col space-y-1">
                        <span className="font-medium text-text/75 text-sm">
                          Activity Type
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs w-fit ${
                            activity.type === "login"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {activity.type}
                        </span>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="font-medium text-text/75 text-sm">
                          Timestamp
                        </span>
                        <span className="text-primary/80">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="font-medium text-text/75 text-sm">
                          IP Address
                        </span>
                        <span className="font-mono text-text/90">
                          {activity.ipAddress}
                        </span>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="font-medium text-text/75 text-sm">
                          Location
                        </span>
                        <span className="text-text/90">
                          {`${activity.location?.city || "Unknown"}, ${
                            activity.location?.country || "Unknown"
                          }`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          />
        </div>
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h2 className="text-xl font-semibold text-primary mb-4">
            Select Duration
          </h2>
          <div className="flex items-center justify-evenly gap-4">
            <select
              value={selectedDuration}
              onChange={handleDurationChange}
              className="w-full p-2 border border-secondary rounded bg-background text-text"
            >
              {/* <option value="1h">Last 1 Hour</option> */}
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

export default LogList;
