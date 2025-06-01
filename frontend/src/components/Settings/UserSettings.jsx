import React from "react";
import { FaUserGroup } from "react-icons/fa6";
import { IoIosArrowUp } from "react-icons/io";
import Table from "../Table";
import { useSignals } from "@preact/signals-react/runtime";
import {
  activeUserView,
  sortBy,
  sortOpen,
  sortOrder,
} from "../../signals/settings";

const UserSettings = ({ isSuperAdmin, userSignals }) => {
  useSignals();
  return (
    <div className="p-4 bg-primary/25 rounded-lg shadow-lg h-full">
      {/* Header controls */}
      <div className="flex justify-between items-center mb-6">
        {/* View toggle and sort controls */}
        <div className="flex gap-5">
          {isSuperAdmin && (
            <div className="flex gap-4 border border-primary/75 bg-background/25 p-2 md:p-1.5 2xl:p-2 rounded-lg md:rounded-md 2xl:rounded-lg">
              <button
                className={`p-2 md:p-1.5 2xl:p-2 rounded tracking-wider md:text-sm 2xl:text-base ${
                  activeUserView.value === "profile"
                    ? "bg-primary text-secondary font-semibold"
                    : ""
                }`}
                onClick={() => {
                  activeUserView.value = "profile";
                  sortBy.value = "Sort By";
                  sortOrder.value = "asc";
                }}
              >
                User Profile
              </button>
              <button
                className={`p-2 md:p-1.5 2xl:p-2 rounded tracking-wider md:text-sm 2xl:text-base ${
                  activeUserView.value === "log"
                    ? "bg-primary text-secondary font-semibold"
                    : ""
                }`}
                onClick={() => {
                  activeUserView.value = "log";
                  sortBy.value = "Sort By";
                  sortOrder.value = "asc";
                }}
              >
                User Log
              </button>
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => (sortOpen.value = !sortOpen.value)}
              className="border border-primary/75 bg-background/25 p-2 md:p-1.5 2xl:p-2 px-3 md:px-2 2xl:px-3 h-full rounded-lg flex items-center justify-around gap-2 w-30"
            >
              <span className="md:text-sm 2xl:text-base">
                {sortBy.value === "username"
                  ? "Username"
                  : sortBy.value === "location"
                  ? "Region"
                  : sortBy.value === "timestamp"
                  ? "Time"
                  : "Sort By"}
                {/* {sortOrder === "desc" ? " ↓" : " ↑"} */}
              </span>
              <span
                className={`transform transition-transform duration-200 ${
                  sortOpen.value ? "rotate-180" : ""
                }`}
              >
                <IoIosArrowUp className="w-4 h-4 md:w-3.5 md:h-3.5 2xl:w-5 2xl:h-5" />
              </span>
            </button>

            {sortOpen.value && (
              <div className="absolute top-full left-0 mt-1.5 w-35 bg-background border border-primary/75 rounded-md shadow-lg z-50">
                <div className="p-1">
                  <button
                    onClick={() => {
                      sortBy.value = "username";
                      sortOrder.value =
                        sortOrder.value === "asc" ? "desc" : "asc";
                      sortOpen.value = false;
                    }}
                    className="w-full text-left md:text-sm 2xl:text-base tracking-wide px-2.5 py-2 hover:bg-primary/20 rounded"
                  >
                    Username
                  </button>
                  <button
                    onClick={() => {
                      sortBy.value = "location";
                      sortOrder.value =
                        sortOrder.value === "asc" ? "desc" : "asc";
                      sortOpen.value = false;
                    }}
                    className="w-full text-left md:text-sm 2xl:text-base tracking-wide px-2.5 py-2 hover:bg-primary/20 rounded"
                  >
                    Region
                  </button>
                  <button
                    onClick={() => {
                      sortBy.value = "timestamp";
                      sortOrder.value =
                        sortOrder.value === "asc" ? "desc" : "asc";
                      sortOpen.value = false;
                    }}
                    className="w-full text-left md:text-sm 2xl:text-base tracking-wide px-2.5 py-2 hover:bg-primary/20 rounded"
                  >
                    Time
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Add user button */}
        {isSuperAdmin && (
          <button
            onClick={() => (userSignals.showAddModal.value = true)}
            className="flex items-center gap-2 bg-background/25 border border-primary/75 text-white rounded-lg p-2.5 2xl:p-3 px-3 md:px-2.5 2xl:px-3"
          >
            <FaUserGroup className="md:w-4 md:h-4 2xl:w-6 2xl:h-6" />
            <span className="tracking-wider md:text-sm 2xl:text-base">
              Add Users
            </span>
          </button>
        )}
      </div>

      {/* User table */}
      <div className="bg-secondary/10 shadow rounded-lg overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto">
        {activeUserView.value === "profile" ? (
          <Table
            data={userSignals.users.value.sort((a, b) => {
              if (sortBy.value === "username") {
                return sortOrder.value === "asc"
                  ? a.UserName.localeCompare(b.UserName)
                  : b.UserName.localeCompare(a.UserName);
              }
              if (sortBy.value === "location") {
                const aEmail = a.Email || "";
                const bEmail = b.Email || "";
                return sortOrder.value === "asc"
                  ? aEmail.localeCompare(bEmail)
                  : bEmail.localeCompare(aEmail);
              }
              if (sortBy.value === "timestamp") {
                const aPhone = a.phoneNumber || "";
                const bPhone = b.phoneNumber || "";
                return sortOrder.value === "asc"
                  ? aPhone.localeCompare(bPhone)
                  : bPhone.localeCompare(aPhone);
              }
              return 0;
            })}
            columns={[
              { key: "UserName", header: "Username" },
              { key: "Email", header: "Email Id" },
              { key: "Role", header: "job Role" },
              { key: "phoneNumber", header: "Phone" },
            ]}
            actions={(userData) => {
              // Don't show any actions for regular users
              if (!isSuperAdmin && userData.Role === "super_admin") {
                return null;
              }

              return (
                <>
                  {/* Super admin can edit and delete everyone */}
                  {isSuperAdmin && (
                    <>
                      <button
                        onClick={() => {
                          userSignals.selectedUser.value = userData;
                          userSignals.editForm.value = {
                            UserName: userData.UserName,
                            Email: userData.Email,
                            Role: userData.Role,
                            phoneNumber: userData.phoneNumber,
                          };
                          userSignals.showEditModal.value = true;
                        }}
                        className="text-primary hover:text-primary/80 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          userSignals.handleDeleteUser(userData._id)
                        }
                        className="text-red-500 hover:text-red-600 mr-4"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => {
                          userSignals.selectedUser.value = {
                            _id: userData._id,
                          };
                          userSignals.showPasswordModal.value = true;
                        }}
                        className="text-primary hover:text-primary/80"
                      >
                        Change Password
                      </button>
                    </>
                  )}

                  {/* Admin can only edit and delete regular users */}
                  {!isSuperAdmin && userData.Role === "user" && (
                    <>
                      <button
                        onClick={() => {
                          userSignals.selectedUser.value = userData;
                          userSignals.editForm.value = {
                            UserName: userData.UserName,
                            Email: userData.Email,
                            Role: userData.Role,
                            phoneNumber: userData.phoneNumber,
                          };
                          userSignals.showEditModal.value = true;
                        }}
                        className="text-primary hover:text-primary/80 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          userSignals.handleDeleteUser(userData._id)
                        }
                        className="text-red-500 hover:text-red-600 mr-4"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </>
              );
            }}
          />
        ) : (
          <Table
            data={userSignals.users.value
              .flatMap((user) =>
                (user.activities || []).map((activity) => ({
                  username: user.UserName,
                  method: activity.type,
                  timestamp: new Date(activity.timestamp).toLocaleString(),
                  ipAddress: activity.ipAddress,
                  location: activity.location?.[0]
                    ? `${activity.location[0].city || "Unknown"}, ${
                        activity.location[0].country || "Unknown"
                      }`
                    : "Unknown",
                  latitude: activity.location?.[0]?.latitude ?? "Not available",
                  longitude:
                    activity.location?.[0]?.longitude ?? "Not available",
                  rawTimestamp: new Date(activity.timestamp).getTime(),
                }))
              )
              .sort((a, b) => {
                if (sortBy.value === "username") {
                  return sortOrder.value === "asc"
                    ? a.username.localeCompare(b.username)
                    : b.username.localeCompare(a.username);
                }
                if (sortBy.value === "location") {
                  return sortOrder.value === "asc"
                    ? a.location.localeCompare(b.location)
                    : b.location.localeCompare(a.location);
                }
                if (sortBy.value === "timestamp") {
                  return sortOrder.value === "asc"
                    ? a.rawTimestamp - b.rawTimestamp
                    : b.rawTimestamp - a.rawTimestamp;
                }
                return 0;
              })}
            columns={[
              { key: "username", header: "Username" },
              {
                key: "method",
                header: "Method",
                render: (method) => (
                  <span
                    className={`px-3 py-1 rounded-full font-semibold tracking-wider ${
                      method === "login" ? " text-green-800" : " text-red-800"
                    }`}
                  >
                    {method}
                  </span>
                ),
              },
              { key: "timestamp", header: "Timestamp" },
              { key: "ipAddress", header: "IP Address" },
              { key: "location", header: "Location" },
              { key: "latitude", header: "Latitude" },
              { key: "longitude", header: "Longitude" },
            ]}
          />
        )}
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
