import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../utils/AxiosInstance";
import AdminDashboardTable from "../components/AdminDashboardTable";

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const [allUserData, setAllUserData] = useState([]);
  const [activeTab, setActiveTab] = useState("user-data");
  const [isDataSending, setIsDataSending] = useState(false);
  const [currentInterval, setCurrentInterval] = useState(null);
  const navigate = useNavigate();
  const isAdmin = user?.Role === "admin";

  useEffect(() => {
    const fetchData = async () => {
      if (isAdmin) {
        try {
          const response = await AxiosInstance.get("/users");
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

  const handleDataSend = async (duration) => {
    try {
      if (isDataSending && currentInterval === duration) {
        const response = await AxiosInstance.post("/stop-data-send");

        if (response.data.success) {
          setIsDataSending(false);
          setCurrentInterval(null);
        }
      } else {
        const response = await AxiosInstance.post("/start-data-send", {
          duration,
        });

        if (response.data.success) {
          setIsDataSending(true);
          setCurrentInterval(duration);
        }
      }
    } catch (error) {
      console.error("Failed to toggle data sending:", error);
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
                href="#"
                className={`inline-block p-4 rounded-t-lg ${
                  activeTab === "user-data"
                    ? "bg-white text-blue-600 border-b-2 border-blue-600"
                    : "hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                user-data
              </button>
            </li>
            <li className="me-2">
              <button
                onClick={() => setActiveTab("mail-send")}
                href="#"
                className={`inline-block p-4 rounded-t-lg ${
                  activeTab === "mail-send"
                    ? "bg-white text-blue-600 border-b-2 border-blue-600"
                    : "hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                mail-send
              </button>
            </li>
          </ul>
        )}
        <div className="bg-white shadow rounded-lg p-6">
          {activeTab === "user-data" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {isAdmin && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          User Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          PhoneNumber
                        </th>
                      </>
                    )}

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Activity Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isAdmin ? (
                    allUserData.map((userData) =>
                      userData.activities.map((activity, activityIndex) =>
                        AdminDashboardTable(activity, activityIndex, userData)
                      )
                    )
                  ) : user?.activities?.length > 0 ? (
                    user.activities.map((activity, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              activity.type === "login"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {activity.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {activity.ipAddress}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {`${activity.location.city || "Unknown"}, ${
                            activity.location.country || "Unknown"
                          }`}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No activities to display
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Periodic Data Sender
              </h2>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: "1h", label: "Last Hour" },
                  { key: "1d", label: "Last Day" },
                  { key: "1w", label: "Last Week" },
                  { key: "1m", label: "Last Month" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleDataSend(key)}
                    className={`px-4 py-2 rounded-md ${
                      isDataSending && currentInterval === key
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    } text-white`}
                    disabled={isDataSending && currentInterval !== key}
                  >
                    {isDataSending && currentInterval === key
                      ? "Stop Sending"
                      : `Send ${label}`}
                  </button>
                ))}
              </div>
              {isDataSending && (
                <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-md">
                  Currently sending {currentInterval} data to your email...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
