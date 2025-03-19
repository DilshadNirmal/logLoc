import React from "react";

const AdminDashboardTable = (activity, activityIndex, userData) => {
  return (
    <tr key={`${userData._id}-${activityIndex}`} className="hover:bg-gray-50">
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
        {`${activity.location.city || "Unknown"}, ${
          activity.location.country || "Unknown"
        }`}
      </td>
    </tr>
  );
};

export default AdminDashboardTable;
