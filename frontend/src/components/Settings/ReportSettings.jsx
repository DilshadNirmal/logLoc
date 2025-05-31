import React, { useEffect } from "react";
import {
  reportConfig,
  reportSelectedUsers,
  allUsers,
  toggleReportUserSelection,
  showUserSelectionModal,
  fetchReportConfig,
} from "../../signals/settings";
import { useSignals } from "@preact/signals-react/runtime";
import Table from "../Table";
import InputCheck from "../form/InputCheck";
import Modal from "../Modal";
import { FaPlus } from "react-icons/fa";
import { ImUserPlus } from "react-icons/im";
import axiosInstance from "../../lib/axios";

const ReportSettings = () => {
  useSignals();

  useEffect(() => {
    // Fetch all users when component mounts
    fetchAllUsers();
    fetchReportConfig();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const response = await axiosInstance.get("/users");
      allUsers.value = response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSaveReportConfig = async () => {
    try {
      // Save report configuration to backend with selected users
      await axiosInstance.post("/report-config", {
        ...reportConfig.value,
        users: reportSelectedUsers.value,
      });
      alert("Report configuration saved successfully");
    } catch (error) {
      console.error("Error saving report configuration:", error);
      alert("Error saving configuration. Please try again.");
    }
  };

  // Function to get data for the selected people table
  const getReportSelectedUserData = () => {
    return allUsers.value
      .filter((user) => reportSelectedUsers.value.includes(user._id))
      .map((user) => ({
        id: user._id,
        name: user.UserName,
        email: user.Email,
        role: user.Role,
      }));
  };

  // Function to get data for the selection table
  const getAvailableUserData = () => {
    return allUsers.value
      .filter((user) => !reportSelectedUsers.value.includes(user._id))
      .map((user) => ({
        id: user._id,
        name: user.UserName,
        email: user.Email,
      }));
  };

  // Function to add a user to report recipients
  const addUserToReport = (userId) => {
    toggleReportUserSelection(userId);
  };

  // Function to remove a user from report recipients
  const removeUserFromReport = (userId) => {
    toggleReportUserSelection(userId);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-2 xl:gap-4 h-full">
      <div className="p-4 bg-primary/25 rounded-lg shadow-lg h-[50%]">
        <h3 className="text-xl md:text-lg 2xl:text-xl font-medium tracking-wider text-text/85">
          Selected People
        </h3>
        <Table
          data={getReportSelectedUserData()}
          columns={[
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "role", header: "Role" },
          ]}
          actions={(user) => (
            <button
              onClick={() => removeUserFromReport(user.id)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          )}
        />
      </div>
      <div className="flex gap-4 md:gap-2 xl:gap-4 w-full h-[50%]">
        <div className="p-4 bg-primary/25 rounded-lg shadow-lg h-full w-6/8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl md:text-lg 2xl:text-xl font-medium tracking-wider text-text/85">
              Select People
            </h3>
            <button
              onClick={() => (showUserSelectionModal.value = true)}
              className="p-2 bg-primary/65 text-text rounded-full hover:bg-primary/80"
            >
              <ImUserPlus className="md:w-3 md:h-3 2xl:w-4 2xl:h-4" />
            </button>
          </div>
          <div className="bg-background rounded-lg">
            <Table
              data={getAvailableUserData()}
              columns={[
                { key: "name", header: "Name" },
                { key: "email", header: "Email" },
              ]}
              actions={(user) => (
                <button
                  onClick={() => addUserToReport(user.id)}
                  className="text-green-500 hover:text-green-700"
                >
                  Add
                </button>
              )}
            />
          </div>
        </div>
        <div className="p-4 md:py-2 bg-primary/25 rounded-lg shadow-lg h-full w-2/8">
          <h4 className="text-xl md:text-lg 2xl:text-xl font-medium tracking-wider text-text/85 mb-2">
            Set Frequency
          </h4>
          <div className="bg-background p-4 rounded-lg h-[60%] grid place-content-center">
            <div className="grid grid-rows-3 place-items-center gap-4">
              <InputCheck
                type="radio"
                name="frequency"
                id="daily"
                value="daily"
                signalObject={reportConfig}
                signalProperty="frequency"
                checkBoxValue="Daily"
                labelClassName={`w-30 gap-6`}
              />
              <InputCheck
                type="radio"
                name="frequency"
                id="weekly"
                value="weekly"
                signalObject={reportConfig}
                signalProperty="frequency"
                checkBoxValue="Weekly"
                labelClassName={`w-30 gap-6`}
              />
              <InputCheck
                type="radio"
                name="frequency"
                id="monthly"
                value="monthly"
                signalObject={reportConfig}
                signalProperty="frequency"
                checkBoxValue="Monthly"
                labelClassName={`w-30 gap-6`}
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handleSaveReportConfig}
              className="px-6 py-2 bg-primary text-text rounded hover:bg-primary/80 w-full"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* User Selection Modal */}
      {showUserSelectionModal.value && (
        <Modal onClose={() => (showUserSelectionModal.value = false)}>
          <h2 className="text-xl font-semibold text-primary mb-4">
            Select Users for Reports
          </h2>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-secondary/20">
                  <th className="p-2 text-left">Select</th>
                  <th className="p-2 text-left">Username</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Role</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.value.map((user) => (
                  <tr key={user._id} className="border-b border-secondary/10">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={reportSelectedUsers.value.includes(user._id)}
                        onChange={() => toggleReportUserSelection(user._id)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="p-2">{user.UserName}</td>
                    <td className="p-2">{user.Email}</td>
                    <td className="p-2">{user.Role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                showUserSelectionModal.value = false;
              }}
              className="px-4 py-2 bg-primary text-text rounded hover:bg-primary/80"
            >
              Save & Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ReportSettings;
