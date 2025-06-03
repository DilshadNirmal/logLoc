import React, { useState, useEffect } from "react";
import { HiOutlineBellAlert } from "react-icons/hi2";
import { FaRegUser } from "react-icons/fa6";
import { IoDocumentTextOutline } from "react-icons/io5";
import { VscGraphLine } from "react-icons/vsc";
import { BsInfoCircle } from "react-icons/bs";
import { useSignals } from "@preact/signals-react/runtime";
import { signal } from "@preact/signals-react";

import { useAuth } from "../contexts/AuthContext";
import Modal from "../components/Modal";
import * as userSignals from "../signals/users";
import * as settingsSignals from "../signals/settings";
import UserSettings from "../components/Settings/UserSettings";
import ReportSettings from "../components/Settings/ReportSettings";
import AlertSettings from "../components/Settings/AlertSettings";
import ThresholdSettings from "../components/Settings/ThresholdSettings";
import { selectedTabSignal } from "../signals/voltage";
import TabGroup from "../components/TabGroup";
import InfoSettings from "../components/Settings/InfoSettings";

const navHeight = signal(0);
const contentHeight = signal(0);

const Settings = () => {
  useSignals();
  const { user } = useAuth();
  const isSuperAdmin = user?.Role === "super_admin";

  const tabOptions = [
    { id: "info", label: "Info", icon: BsInfoCircle },
    { id: "report", label: "Set Report Options", icon: IoDocumentTextOutline },
    { id: "alert", label: "Set Alert", icon: HiOutlineBellAlert },
    { id: "threshold", label: "Set threshold", icon: VscGraphLine },
    { id: "user", label: "Set User Options", icon: FaRegUser },
  ];

  useEffect(() => {
    const updateDimensions = () => {
      const header = document.querySelector("header");
      if (header) navHeight.value = header.offsetHeight;
      if (window.innerWidth >= 1024) {
        contentHeight.value = window.innerHeight - 100;
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (selectedTabSignal.value === "user") {
      userSignals.fetchUsers();
    } else if (selectedTabSignal.value === "alert") {
      settingsSignals.fetchGlobalEmailConfig();
      settingsSignals.fetchAllUsers();
    }
  }, [selectedTabSignal.value]);

  return (
    <section
      className="bg-background text-text min-h-screen w-full overflow-x-hidden"
      style={{ marginTop: `${navHeight.value}px` }}
    >
      <div
        className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-8"
        style={{
          height:
            window.innerWidth >= 1024 ? `${contentHeight.value}px` : "auto",
        }}
      >
        <div className="flex flex-col md:flex-row gap-4 md:gap-2 2xl:gap-2 mx-2 md:mx-4 my-2 md:my-1 h-full">
          <fieldset className="border border-primary/75 rounded-lg p-2 md:p-1.5 2xl:p-2 py-1 h-full">
            <TabGroup tabOptions={tabOptions} variant={"vertical"} />
          </fieldset>
          <fieldset className="border border-primary/75 rounded-lg p-4 md:p-4 2xl:p-4 h-full flex-1">
            {selectedTabSignal.value === "info" && <InfoSettings />}
            {selectedTabSignal.value === "user" && (
              <UserSettings
                userSignals={userSignals}
                isSuperAdmin={isSuperAdmin}
              />
            )}
            {selectedTabSignal.value === "report" && <ReportSettings />}
            {selectedTabSignal.value === "alert" && <AlertSettings />}
            {selectedTabSignal.value === "threshold" && <ThresholdSettings />}
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
