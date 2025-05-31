import React, { useState, useEffect } from "react";
import Table from "../Table";
import Modal from "../Modal";
import { useSignals } from "@preact/signals-react/runtime";
import { effect } from "@preact/signals-react";
import * as signals from "../../signals/settings";
import { fetchVoltages } from "../../signals/voltage";
import GaugeComponent from "react-gauge-component";
import InputCheck from "../form/InputCheck";
import axiosInstance from "../../lib/axios";

const AlertSettings = () => {
  useSignals();

  const [localThresholds, setLocalThresholds] = useState({
    low: "",
    high: "",
  });

  const handleLocalThresholdChange = (type, value) => {
    setLocalThresholds((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleThresholdSave = (type, value) => {
    if (value !== "") {
      signals.handleThresholdChange(type, value);
    }
  };

  useEffect(() => {
    const sensorId =
      signals.selectedSensor.value.group === "A"
        ? signals.selectedSensor.value.number
        : signals.selectedSensor.value.number + 20;

    const currentThresholds = signals.thresholds.value[sensorId];
    setLocalThresholds({
      low: currentThresholds?.low ?? 3,
      high: currentThresholds?.high ?? 7,
    });
  }, [signals.selectedSensor.value, signals.thresholds.value]);

  const handleSaveAllChanges = () => {
    // Save any pending threshold changes
    if (localThresholds.low !== "") {
      signals.handleThresholdChange("low", localThresholds.low);
    }
    if (localThresholds.high !== "") {
      signals.handleThresholdChange("high", localThresholds.high);
    }

    // Then save the configuration
    signals.handleSaveConfiguration();
  };

  useEffect(() => {
    try {
      signals.fetchAllUsers();
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, []);

  const getConfigurationTableData = () => {
    // Get selected users' information
    const selectedUserData = signals.allUsers.value
      .filter((user) => signals.selectedUsers.value.includes(user._id))
      .map((user) => ({
        type: "User",
        name: user.UserName,
        email: user.Email,
        alertDelay:
          signals.alertDelay.value === "custom"
            ? signals.customAlertDelay.value
            : signals.alertDelay.value,
      }));

    // Get direct email information
    const emailData = signals.emails.value.map((email) => ({
      type: "Email",
      name: "-",
      email: email,
      alertDelay:
        signals.alertDelay.value === "custom"
          ? signals.customAlertDelay.value
          : signals.alertDelay.value,
    }));

    return [...selectedUserData, ...emailData];
  };

  useEffect(() => {
    // Fetch voltage data periodically
    fetchVoltages();
    const interval = setInterval(fetchVoltages, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    signals.fetchAlertConfiguration();
  }, []);

  const saveSelectedUsers = async () => {
    try {
      const finalAlertDelay =
        signals.alertDelay.value === "custom"
          ? signals.customAlertDelay.value
          : signals.alertDelay.value;

      // Add loading state
      signals.alertConfigStatus.value = {
        ...signals.alertConfigStatus.value,
        loading: true,
        error: null,
      };

      const response = await axiosInstance.post("/global-email-config", {
        emails: signals.emails.value,
        users: signals.selectedUsers.value,
        alertDelay: parseInt(finalAlertDelay),
      });

      if (response.data.success) {
        signals.alertConfigStatus.value = {
          loading: false,
          error: null,
          success: true,
        };
        alert("Alert configuration saved successfully");
      } else {
        throw new Error("Server returned unsuccessful response");
      }
    } catch (error) {
      console.error("Error saving user selection:", error);
      signals.alertConfigStatus.value = {
        loading: false,
        error: error.message,
        success: false,
      };
      alert(
        "Failed to save user selection: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  return (
    <div className="p-4 md:p-2 2xl:p-4 h-full flex gap-4 md:gap-2 2xl:gap-4">
      <div className="p-4 md:p-4 2xl:p-4 bg-primary/25 rounded-lg shadow-lg h-full w-[70%] md:w-[65%] 2xl:w-[70%]">
        <div className="flex justify-between mx-4 md:mx-2 mt-8 md:mt-4 2xl:mt-4 mb-4 md:mb-4 2xl:mb-4">
          <h3 className="text-xl md:text-lg 2xl:text-xl font-medium tracking-wider text-text/85">
            Select People
          </h3>
          {/* {signals.alertConfigStatus.value.error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>{signals.alertConfigStatus.value.error}</p>
            </div>
          )}
          
          {signals.alertConfigStatus.value.success && (
            <div className="border border-primary/65 text-primary px-2 py-2 rounded">
              <p>Configuration saved successfully!</p>
            </div>
          )} */}
          <button
            onClick={() => (signals.showUserSelectionModal.value = true)}
            className="px-6 md:px-3 2xl:px-6 py-2 md:py-1 2xl:py-2 bg-primary text-text text-sm md:text-xs 2xl:text-base tracking-wider rounded hover:bg-primary/80"
          >
            Select Users
          </button>
        </div>
        <div className="bg-secondary/10 shadow rounded-lg overflow-hidden mb-6 md:mb-3 2xl:mb-6">
          <Table
            data={getConfigurationTableData()}
            columns={[
              { key: "type", header: "Type" },
              { key: "name", header: "Name" },
              { key: "email", header: "Email" },
              {
                key: "alertDelay",
                header: "Alert Delay (min)",
                render: (delay) => `${delay} min`,
              },
            ]}
          />
        </div>
        <div className="mt-6 bg-secondary/5 p-4 rounded-lg">
          <h4 className="text-lg md:text-base 2xl:text-lg font-medium tracking-wider text-text/85 mb-4">
            Alert Delay
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InputCheck
              type="radio"
              name="alertDelay"
              id="delay-1"
              value="1"
              signal={signals.alertDelay}
              checkBoxValue="1 min"
            />
            <InputCheck
              type="radio"
              name="alertDelay"
              id="delay-5"
              value="5"
              signal={signals.alertDelay}
              checkBoxValue="5 min"
            />
            <InputCheck
              type="radio"
              name="alertDelay"
              id="delay-10"
              value="10"
              signal={signals.alertDelay}
              checkBoxValue="10 min"
            />
            <InputCheck
              type="radio"
              name="alertDelay"
              id="delay-custom"
              value="custom"
              signal={signals.alertDelay}
              checkBoxValue="Custom"
            />
          </div>

          {signals.alertDelay.value === "custom" && (
            <div className="mt-4">
              <input
                type="number"
                min="1"
                value={signals.customAlertDelay.value}
                onChange={(e) =>
                  (signals.customAlertDelay.value = e.target.value)
                }
                className="w-full p-2 border border-secondary rounded bg-background text-text"
                placeholder="Enter minutes"
              />
            </div>
          )}
        </div>
        <button
          onClick={saveSelectedUsers}
          disabled={signals.alertConfigStatus.value.loading}
          className={`mt-6 px-6 py-2 bg-primary text-text text-sm md:text-sm 2xl:text-base rounded hover:bg-primary/80 ${
            signals.alertConfigStatus.value.loading
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          {signals.alertConfigStatus.value.loading
            ? "Saving..."
            : "Save Configuration"}
        </button>
      </div>
      <div className="p-4 bg-primary/25 rounded-lg shadow-lg h-full w-[30%] md:w-[35%] 2xl:w-[30%] flex flex-col gap-6 md:gap-4 2xl:gap-6">
        <h3 className="text-xl md:text-lg 2xl:text-xl font-medium tracking-wider text-text/85">
          Set Frequency
        </h3>
        <div className="grid grid-cols-2 gap-4 bg-secondary/5 rounded-lg">
          <div>
            <label className="block text-text/70 text-base md:text-sm 2xl:text-lg mb-2">
              Group A (1-20)
            </label>
            <select
              value={
                signals.selectedSensor.value.group === "A"
                  ? signals.selectedSensor.value.number
                  : ""
              }
              onChange={(e) =>
                (signals.selectedSensor.value = {
                  group: "A",
                  number: Number(e.target.value),
                })
              }
              className="w-full p-2 md:p-1.5 2xl:p-2 border border-secondary rounded bg-background text-text text-sm"
            >
              {[...Array(20)].map((_, i) => (
                <option key={i + 1} value={i + 1} className="text-xs">
                  Sensor {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-text/70 text-base md:text-sm 2xl:text-lg mb-2">
              Group B (21-40)
            </label>
            <select
              value={
                signals.selectedSensor.value.group === "B"
                  ? signals.selectedSensor.value.number
                  : ""
              }
              onChange={(e) =>
                (signals.selectedSensor.value = {
                  group: "B",
                  number: Number(e.target.value),
                })
              }
              className="w-full p-2 md:p-1.5 2xl:p-2 border border-secondary rounded bg-background text-text text-sm"
            >
              {[...Array(20)].map((_, i) => (
                <option key={i + 1} value={i + 1} className="text-xs">
                  Sensor {i + 21}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* gauge here */}
        <div className="bg-background/35 inset-shadow-2xs inset-shadow-primary p-4 rounded-lg mt-2 md:mt-2 2xl:mt-4">
          <div className="text-center mb-4">
            <span className="text-xl md:text-lg 2xl:text-xl font-semibold tracking-widest text-text">
              Current:{" "}
              {signals.voltageData.value.voltages[
                `v${
                  signals.selectedSensor.value.group === "A"
                    ? signals.selectedSensor.value.number
                    : signals.selectedSensor.value.number + 20
                }`
              ]?.toFixed(2) || "0.00"}
              &nbsp; mV
            </span>
          </div>
          <div className="h-64 md:h-54 2xl:h-64 relative">
            <GaugeComponent
              value={signals.gaugeValue.value}
              type="semicircle"
              arc={{
                width: 0.3,
                padding: 0.005,
                cornerRadius: 1,
                gradient: false,
                subArcs: [
                  {
                    limit:
                      signals.thresholds.value[
                        signals.selectedSensor.value.group === "A"
                          ? signals.selectedSensor.value.number
                          : signals.selectedSensor.value.number + 20
                      ]?.low ?? 3,
                    color: "#133044",
                    showTick: true,
                  },
                  {
                    limit:
                      signals.thresholds.value[
                        signals.selectedSensor.value.group === "A"
                          ? signals.selectedSensor.value.number
                          : signals.selectedSensor.value.number + 20
                      ]?.high ?? 7,
                    color: "#409fff",
                    showTick: true,
                  },
                  {
                    limit: 10,
                    color: "#5c5c5c99",
                    showTick: true,
                  },
                ],
              }}
              pointer={{
                type: "arrow",
                color: "#409fff",
                length: 0.6,
                width: 10,
                elastic: true,
              }}
              labels={{
                valueLabel: {
                  formatTextValue: (value) => value.toFixed(2) + " mV",
                  style: { fontSize: 5, fill: "#e9ebed", display: "none" },
                },
                tickLabels: {
                  type: "outer",
                  ticks: [
                    { value: 0 },
                    { value: 2 },
                    { value: 4 },
                    { value: 6 },
                    { value: 8 },
                    { value: 10 },
                  ],
                  defaultTickValueConfig: {
                    formatTextValue: (value) => value,
                    style: { fill: "#e9ebed" },
                  },
                },
              }}
              maxValue={10}
              minValue={0}
            />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-[-25%] text-center mt-2">
              <div className="text-sm font-medium text-text/65">Threshold</div>
              <div className="text-lg font-bold text-text">
                {signals.thresholds.value[
                  signals.selectedSensor.value.group === "A"
                    ? signals.selectedSensor.value.number
                    : signals.selectedSensor.value.number + 20
                ]?.low || 3}
                &nbsp;-&nbsp;
                {signals.thresholds.value[
                  signals.selectedSensor.value.group === "A"
                    ? signals.selectedSensor.value.number
                    : signals.selectedSensor.value.number + 20
                ]?.high || 7}
                &nbsp;mV
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-secondary/5 rounded-lg">
          <div>
            <label className="block text-text/70 text-base md:text-sm 2xl:text-lg mb-1.5">
              Low Threshold
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.01"
              value={localThresholds.low}
              onChange={(e) =>
                handleLocalThresholdChange("low", e.target.value)
              }
              onBlur={(e) => handleThresholdSave("low", e.target.value)}
              className="w-full p-2 md:p-1.5 2xl:p-2 border border-secondary rounded bg-background text-text text-sm"
            />
          </div>
          <div>
            <label className="block text-text/70 text-base md:text-sm 2xl:text-lg mb-1.5">
              High Threshold
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.01"
              value={localThresholds.high}
              onChange={(e) =>
                handleLocalThresholdChange("high", e.target.value)
              }
              onBlur={(e) => handleThresholdSave("high", e.target.value)}
              className="w-full p-2 md:p-1.5 2xl:p-2 border border-secondary rounded bg-background text-text text-sm"
            />
          </div>
        </div>

        {/* for alert delay */}

        <button
          onClick={handleSaveAllChanges}
          className="mt-auto px-6 py-2 bg-primary text-text text-sm 2xl:text-base rounded hover:bg-primary/80"
        >
          Save Changes
        </button>
      </div>

      {/* User Selection Modal */}
      {signals.showUserSelectionModal.value && (
        <Modal onClose={() => (signals.showUserSelectionModal.value = false)}>
          <h2 className="text-lg tracking-wider font-semibold text-primary/90 mb-3">
            Select Users for Alerts
          </h2>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-secondary/20">
                  <th className="p-2 text-left font-normal tracking-wide">
                    Select
                  </th>
                  <th className="p-2 text-left font-normal tracking-wide">
                    Username
                  </th>
                  <th className="p-2 text-left font-normal tracking-wide">
                    Email
                  </th>
                  <th className="p-2 text-left font-normal tracking-wide">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody>
                {signals.allUsers.value.map((user) => (
                  <tr key={user._id} className="border-b border-secondary/10">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={signals.selectedUsers.value.includes(user._id)}
                        onChange={() => signals.toggleUserSelection(user._id)}
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
                signals.showUserSelectionModal.value = false;
                saveSelectedUsers();
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

export default AlertSettings;
