import React from "react";

const Table = ({
  allUserData,
  isDataSending,
  handleSendEmailClick,
  handleStopEmail,
  isLoading = false,
}) => {
  const [expandedRows, setExpandedRows] = React.useState([]);

  const toggleRow = (userId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!allUserData?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No user data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {allUserData.map((userData) => (
            <React.Fragment key={userData._id}>
              <tr
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleRow(userData._id)}
              >
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {userData.UserName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {userData.Email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      userData.Role === "admin"
                        ? "bg-purple-300 text-purple-800"
                        : "bg-blue-200 text-blue-800"
                    }`}
                  >
                    {userData.Role || "User"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {userData.phoneNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
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
                </td>
              </tr>
              {expandedRows[userData._id] &&
                userData.activities.map((activity, index) => (
                  <tr
                    key={`${userData._id}-activity-${index}`}
                    className="bg-gray-50"
                  >
                    <td colSpan="5" className="px-6 py-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <span className="font-semibold">Activity Type:</span>
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs ${
                              activity.type === "login"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {activity.type}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold">Timestamp:</span>
                          <span className="ml-2">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold">IP Address:</span>
                          <span className="ml-2">{activity.ipAddress}</span>
                        </div>
                        <div>
                          <span className="font-semibold">Location:</span>
                          <span className="ml-2">
                            {`${activity.location?.city || "Unknown"}, ${
                              activity.location?.country || "Unknown"
                            }`}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
