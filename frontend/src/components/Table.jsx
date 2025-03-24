const Table = ({
  allUserData,
  isDataSending,
  handleSendEmailClick,
  handleStopEmail,
  isLoading = false,
}) => {
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {allUserData.map((userData) =>
            userData.activities.map((activity, activityIndex) => (
              <tr
                key={`${userData._id}-${activityIndex}`}
                className="hover:bg-gray-50"
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
                  {`${activity.location?.city || "Unknown"}, ${
                    activity.location?.country || "Unknown"
                  }`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isDataSending[userData._id] ? (
                    <button
                      onClick={() => handleStopEmail(userData._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                      disabled={!isDataSending[userData._id]}
                    >
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendEmailClick(userData)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Send Email
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
