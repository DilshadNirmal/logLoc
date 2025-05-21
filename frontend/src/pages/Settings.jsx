import React, { useState, useEffect } from "react";
import { HiOutlineBellAlert } from "react-icons/hi2";
import { FaRegUser } from "react-icons/fa6";
import { IoDocumentTextOutline } from "react-icons/io5";
import { VscGraphLine } from "react-icons/vsc";
import { FaUserGroup } from "react-icons/fa6";
import { IoIosArrowUp } from "react-icons/io";

import { useSignals } from "@preact/signals-react/runtime";
import { useAuth } from "../contexts/AuthContext";
import Table from "../components/Table";
import Modal from "../components/Modal";
import * as userSignals from "../signals/users";

const TabButton = ({ isSelected, onClick, icon: Icon, label }) => (
  <button
    className={`flex flex-col items-center justify-center gap-6 p-3 md:p-2 lg:p-4 rounded-lg transition-all ${
      isSelected
        ? "bg-primary text-white"
        : "bg-secondary text-primary hover:bg-secondary/70"
    }`}
    onClick={onClick}
  >
    <Icon className="w-5 h-5 lg:w-6 lg:h-6 2xl:w-14 2xl:h-14" />
    <span className="text-base 2xl:text-base text-text font-medium tracking-wide">
      {label}
    </span>
  </button>
);

const Settings = () => {
  useSignals();
  const { user } = useAuth();
  const [navHeight, setNavHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [selectedTab, setSelectedTab] = useState("user");
  const [activeUserView, setActiveUserView] = useState("profile");
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Sort By");
  const [sortOrder, setSortOrder] = useState("asc");
  const isSuperAdmin = user?.Role === "super_admin";

  const tabOptions = [
    { id: "report", label: "Set Report Options", icon: IoDocumentTextOutline },
    { id: "alert", label: "Set Alert", icon: HiOutlineBellAlert },
    { id: "threshold", label: "Set threshold", icon: VscGraphLine },
    { id: "user", label: "Set User Options", icon: FaRegUser },
  ];

  useEffect(() => {
    const updateDimensions = () => {
      const header = document.querySelector("header");
      if (header) setNavHeight(header.offsetHeight);
      if (window.innerWidth >= 1024) {
        setContentHeight(window.innerHeight - 100);
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (selectedTab === "user") {
      userSignals.fetchUsers();
    }
  }, [selectedTab]);

  const renderUserContent = () => {
    return (
      <div className="p-4 bg-primary/25 rounded-lg shadow-lg h-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-5">
            <div className="flex gap-4 border border-primary/75 bg-background/25 p-2 rounded-lg">
              <button
                className={`text-white  p-2 rounded ${
                  activeUserView === "profile"
                    ? "bg-primary tracking-wider"
                    : ""
                }`}
                onClick={() => {
                  setActiveUserView("profile");
                  setSortBy("Sort By");
                  setSortOrder("asc");
                }}
              >
                User Profile
              </button>
              <button
                className={`text-white p-2 rounded ${
                  activeUserView === "log" ? "bg-primary" : ""
                }`}
                onClick={() => {
                  setActiveUserView("log");
                  setSortBy("Sort By");
                  setSortOrder("asc");
                }}
              >
                User Log
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="border border-primary/75 bg-background/25 p-2 px-3 h-full rounded-lg flex items-center justify-between gap-2 w-40"
              >
                <span>
                  {sortBy === "username"
                    ? "Username"
                    : sortBy === "location"
                    ? "Region"
                    : sortBy === "timestamp"
                    ? "Time"
                    : "Sort By"}
                  {/* {sortOrder === "desc" ? " ↓" : " ↑"} */}
                </span>
                <span
                  className={`transform transition-transform duration-200 ${
                    sortOpen ? "rotate-180" : ""
                  }`}
                >
                  <IoIosArrowUp className="w-4 h-4 lg:w-4 lg:h-4 2xl:w-5 2xl:h-5" />
                </span>
              </button>

              {sortOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-background border border-primary/75 rounded-lg shadow-lg z-50">
                  <div className="p-2 space-y-2">
                    <button
                      onClick={() => {
                        setSortBy("username");
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        setSortOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-primary/20 rounded"
                    >
                      Username
                    </button>
                    <button
                      onClick={() => {
                        setSortBy("location");
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        setSortOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-primary/20 rounded"
                    >
                      Region
                    </button>
                    <button
                      onClick={() => {
                        setSortBy("timestamp");
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        setSortOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-primary/20 rounded"
                    >
                      Time
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => (userSignals.showAddModal.value = true)}
              className="flex gap-2 bg-background/25 border border-primary/75 text-white rounded-lg p-4"
            >
              <FaUserGroup className="2xl:w-6 2xl:h-6" />
              <span className="tracking-wider">Add Users</span>
            </button>
          )}
        </div>

        <div className="bg-secondary/10 shadow rounded-lg overflow-hidden">
          {activeUserView === "profile" ? (
            <Table
              data={userSignals.users.value.sort((a, b) => {
                if (sortBy === "username") {
                  return sortOrder === "asc"
                    ? a.UserName.localeCompare(b.UserName)
                    : b.UserName.localeCompare(a.UserName);
                }
                if (sortBy === "location") {
                  const aEmail = a.Email || "";
                  const bEmail = b.Email || "";
                  return sortOrder === "asc"
                    ? aEmail.localeCompare(bEmail)
                    : bEmail.localeCompare(aEmail);
                }
                if (sortBy === "timestamp") {
                  const aPhone = a.phoneNumber || "";
                  const bPhone = b.phoneNumber || "";
                  return sortOrder === "asc"
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
              actions={(userData) => (
                <>
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
                    </>
                  )}
                  <button
                    onClick={() => {
                      userSignals.selectedUser.value = { _id: userData._id };
                      userSignals.showPasswordModal.value = true;
                    }}
                    className="text-primary hover:text-primary/80"
                  >
                    Change Password
                  </button>
                </>
              )}
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
                    latitude:
                      activity.location?.[0]?.latitude ?? "Not available",
                    longitude:
                      activity.location?.[0]?.longitude ?? "Not available",
                    rawTimestamp: new Date(activity.timestamp).getTime(),
                  }))
                )
                .sort((a, b) => {
                  if (sortBy === "username") {
                    return sortOrder === "asc"
                      ? a.username.localeCompare(b.username)
                      : b.username.localeCompare(a.username);
                  }
                  if (sortBy === "location") {
                    return sortOrder === "asc"
                      ? a.location.localeCompare(b.location)
                      : b.location.localeCompare(a.location);
                  }
                  if (sortBy === "timestamp") {
                    return sortOrder === "asc"
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
    );
  };

  return (
    <section
      className="bg-background text-text min-h-screen w-full overflow-x-hidden"
      style={{ marginTop: `${navHeight}px` }}
    >
      <div
        className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-8"
        style={{
          height: window.innerWidth >= 1024 ? `${contentHeight}px` : "auto",
        }}
      >
        <div className="flex gap-4 mx-8 my-2 h-full">
          <fieldset className="border border-primary/75 rounded-lg p-2 py-1 h-full">
            <div className="flex flex-col justify-between h-full p-4 py-8">
              {tabOptions.map((tab) => (
                <TabButton
                  key={tab.id}
                  isSelected={selectedTab === tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  icon={tab.icon}
                  label={tab.label}
                />
              ))}
            </div>
          </fieldset>
          <fieldset className="border border-primary/75 rounded-lg p-4 h-full flex-1">
            {selectedTab === "user" ? (
              renderUserContent()
            ) : (
              <div className="flex items-center justify-center h-full text-xl">
                Content for {selectedTab} will be implemented soon
              </div>
            )}
          </fieldset>
        </div>
        {/* Edit User Modal */}
        {userSignals.showEditModal.value && (
          <Modal onClose={() => (userSignals.showEditModal.value = false)}>
            <h2 className="text-xl font-semibold text-primary mb-4">
              Edit User
            </h2>
            {userSignals.error.value && (
              <p className="text-red-500 mb-4">{userSignals.error.value}</p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                userSignals.handleEditSubmit();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-text/70 mb-2">Username</label>
                <input
                  type="text"
                  value={userSignals.editForm.value.UserName}
                  onChange={(e) =>
                    (userSignals.editForm.value = {
                      ...userSignals.editForm.value,
                      UserName: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                />
              </div>
              <div>
                <label className="block text-text/70 mb-2">Email</label>
                <input
                  type="email"
                  value={userSignals.editForm.value.Email}
                  onChange={(e) =>
                    (userSignals.editForm.value = {
                      ...userSignals.editForm.value,
                      Email: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                />
              </div>
              <div>
                <label className="block text-text/70 mb-2">Role</label>
                <select
                  value={userSignals.editForm.value.Role}
                  onChange={(e) =>
                    (userSignals.editForm.value = {
                      ...userSignals.editForm.value,
                      Role: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-text/70 mb-2">Phone Number</label>
                <input
                  type="text"
                  value={userSignals.editForm.value.phoneNumber}
                  onChange={(e) =>
                    (userSignals.editForm.value = {
                      ...userSignals.editForm.value,
                      phoneNumber: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-text py-2 rounded hover:bg-primary/80"
              >
                Save Changes
              </button>
            </form>
          </Modal>
        )}
        {/* Change Password Modal */}
        {userSignals.showPasswordModal.value && (
          <Modal onClose={() => (userSignals.showPasswordModal.value = false)}>
            <h2 className="text-xl font-semibold text-primary mb-4">
              Change Password
            </h2>
            {userSignals.error.value && (
              <p className="text-red-500 mb-4">{userSignals.error.value}</p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                userSignals.handlePasswordSubmit(isSuperAdmin);
              }}
              className="space-y-4"
            >
              {!isSuperAdmin && (
                <div>
                  <label className="block text-text/70 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={userSignals.passwordForm.value.currentPassword}
                    onChange={(e) =>
                      (userSignals.passwordForm.value = {
                        ...userSignals.passwordForm.value,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-secondary rounded bg-background text-text"
                  />
                </div>
              )}
              <div>
                <label className="block text-text mb-2">New Password</label>
                <input
                  type="password"
                  value={userSignals.passwordForm.value.newPassword}
                  onChange={(e) =>
                    (userSignals.passwordForm.value = {
                      ...userSignals.passwordForm.value,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                />
              </div>
              <div>
                <label className="block text-text mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={userSignals.passwordForm.value.confirmPassword}
                  onChange={(e) =>
                    (userSignals.passwordForm.value = {
                      ...userSignals.passwordForm.value,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-text py-2 rounded hover:bg-primary/80"
              >
                Change Password
              </button>
            </form>
          </Modal>
        )}
        {/* Add User Modal */}
        {userSignals.showAddModal.value && (
          <Modal onClose={() => (userSignals.showAddModal.value = false)}>
            <h2 className="text-xl font-semibold text-primary mb-4">
              Add New User
            </h2>
            {userSignals.error.value && (
              <p className="text-red-500 mb-4">{userSignals.error.value}</p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                userSignals.handleAddSubmit();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-text/70 mb-2">Username</label>
                <input
                  type="text"
                  value={userSignals.addForm.value.UserName}
                  onChange={(e) =>
                    (userSignals.addForm.value = {
                      ...userSignals.addForm.value,
                      UserName: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                  required
                />
              </div>
              <div>
                <label className="block text-text/70 mb-2">Email</label>
                <input
                  type="email"
                  value={userSignals.addForm.value.Email}
                  onChange={(e) =>
                    (userSignals.addForm.value = {
                      ...userSignals.addForm.value,
                      Email: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                  required
                />
              </div>
              <div>
                <label className="block text-text/70 mb-2">Password</label>
                <input
                  type="password"
                  value={userSignals.addForm.value.Password}
                  onChange={(e) =>
                    (userSignals.addForm.value = {
                      ...userSignals.addForm.value,
                      Password: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                  required
                />
              </div>
              <div>
                <label className="block text-text/70 mb-2">Role</label>
                <select
                  value={userSignals.addForm.value.Role}
                  onChange={(e) =>
                    (userSignals.addForm.value = {
                      ...userSignals.addForm.value,
                      Role: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-text/70 mb-2">Phone Number</label>
                <input
                  type="text"
                  value={userSignals.addForm.value.phoneNumber}
                  onChange={(e) =>
                    (userSignals.addForm.value = {
                      ...userSignals.addForm.value,
                      phoneNumber: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-text py-2 rounded hover:bg-primary/80"
              >
                Add User
              </button>
            </form>
          </Modal>
        )}
      </div>
    </section>
  );
};

export default Settings;
