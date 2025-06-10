import { signal } from "@preact/signals-react";
import axiosInstance from "../lib/axios";
import { alertConfigSignal } from "./commonSignals";

// for change password ui
export const showChangePasswordModal = signal(false);

// alert setting signals
export const emails = signal([]);
export const selectedUsers = signal([]);
export const allUsers = signal([]);
export const showUserSelectionModal = signal(false);
export const selectedSensor = signal({
  group: "A",
  number: 1,
});
export const thresholds = signal({});
export const gaugeValue = signal(5);
export const voltageData = signal({
  voltages: {},
  timestamp: null,
});
export const newEmail = signal("");
export const alertDelay = signal("5");
export const alertConfigStatus = signal({
  loading: false,
  error: null,
  success: false
});

// for report
export const reportSelectedUsers = signal([]);
export const reportConfig = signal({
    defaultFormat: "excel",
    autoExport: false,
    includeCharts: true,
  });

  export const toggleReportUserSelection = (userId) => {
    if (reportSelectedUsers.value.includes(userId)) {
      reportSelectedUsers.value = reportSelectedUsers.value.filter((id) => id !== userId);
    } else {
      reportSelectedUsers.value = [...reportSelectedUsers.value, userId];
    }
  };

  export const fetchReportConfig = async () => {
    try {
      const response = await axiosInstance.get("/report-config");
      if (response.data) {
        // Update report configuration signal
        reportConfig.value = {
          defaultFormat: response.data.defaultFormat || "excel",
          autoExport: response.data.autoExport || false,
          includeCharts: response.data.includeCharts || true,
          frequency: response.data.frequency || "daily"
        };
        
        // Update selected users
        if (response.data.users && Array.isArray(response.data.users)) {
          reportSelectedUsers.value = response.data.users.map(user => 
            typeof user === 'object' ? user._id : user
          );
        }
      }
    } catch (error) {
      console.error("Error fetching report configuration:", error);
    }
  };

// for users
export const activeUserView = signal("profile");
export const sortOpen = signal(false);
export const sortBy = signal("Sort By");
export const sortOrder = signal("asc");
export const customAlertDelay = signal(15);

// Re-export alertConfigSignal for backward compatibility
export { alertConfigSignal };

// Fetch global email configuration
export const fetchGlobalEmailConfig = async () => {
  try {
    const response = await axiosInstance.get("/global-email-config");
    if (response.data) {
      emails.value = response.data.emails || [];
      selectedUsers.value = response.data.users || [];
    }
  } catch (error) {
    console.error("Error fetching global email config:", error);
  }
};

export const fetchAlertConfiguration = async () => {
  try {
    alertConfigStatus.value = { ...alertConfigStatus.value, loading: true, error: null };
    const response = await axiosInstance.get("/global-email-config");
    if (response.data) {
      emails.value = response.data.emails || [];
      selectedUsers.value = response.data.users?.map(user => user._id) || [];

      // Set alert delay
      const delay = response.data.alertDelay?.toString() || "5";
      if (["1", "5", "10"].includes(delay)) {
        alertDelay.value = delay;
      } else {
        alertDelay.value = "custom";
        customAlertDelay.value = delay;
      }
      alertConfigStatus.value = { loading: false, error: null, success: true };
    }
  } catch (error) {
    console.error("Error fetching alert configuration:", error);
    alertConfigStatus.value = { loading: false, error: error.message, success: false };
  }
};

// Fetch all users for selection
export const fetchAllUsers = async () => {
  try {
    const response = await axiosInstance.get("/users");
    allUsers.value = response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
  }
};

// Handle adding a new email
export const handleAddEmail = () => {
  if (newEmail.value && !emails.value.includes(newEmail.value)) {
    emails.value = [...emails.value, newEmail.value];
    newEmail.value = "";
  }
};

// Handle removing an email
export const handleRemoveEmail = (emailToRemove) => {
  emails.value = emails.value.filter((email) => email !== emailToRemove);
};

// Handle threshold change
export const handleThresholdChange = (type, value) => {
  const sensorId =
    selectedSensor.value.group === "A"
      ? selectedSensor.value.number
      : selectedSensor.value.number + 20;
  
  // Get current thresholds for this sensor
  const currentThresholds = thresholds.value[sensorId] || { low: 3, high: 7 };
  
  // Parse the new value
  const newValue = value === "" ? "" : parseFloat(parseFloat(value).toFixed(2));
  
  // Validate thresholds
  if (type === "low") {
    // If setting low threshold, ensure it's less than high
    if (newValue !== "" && currentThresholds.high !== "" && newValue >= currentThresholds.high) {
      alert("Low threshold must be less than high threshold");
      return; // Don't update the value
    }
  } else if (type === "high") {
    // If setting high threshold, ensure it's greater than low
    if (newValue !== "" && currentThresholds.low !== "" && newValue <= currentThresholds.low) {
      alert("High threshold must be greater than low threshold");
      return; // Don't update the value
    }
  }

  // Update the threshold if validation passes
  thresholds.value = {
    ...thresholds.value,
    [sensorId]: {
      ...thresholds.value[sensorId],
      [type]: newValue,
    },
  };

  // Update gauge value if changing high threshold
  if (type === "high") {
    gaugeValue.value = newValue;
  }
};

// Save alert configuration
export const handleSaveConfiguration = async () => {
  try {
    const sensorId =
      selectedSensor.value.group === "A"
        ? selectedSensor.value.number
        : selectedSensor.value.number + 20;

    // Prepare alert delay value
    let delayValue = parseInt(alertDelay.value);
    if (alertDelay.value === "custom") {
      delayValue = parseInt(customAlertDelay.value);
    }

    // Update alert config with threshold values
    await axiosInstance.post("/alert-config", {
      sensorId,
      high: thresholds.value[sensorId]?.high || 7,
      low: thresholds.value[sensorId]?.low || 3,
      users: selectedUsers.value,
      alertDelay: delayValue,
    });

    // Update global email config
    await axiosInstance.post("/global-email-config", {
      emails: emails.value,
      users: selectedUsers.value,
      alertDelay: delayValue
    });

    alert("Configuration saved successfully");
  } catch (error) {
    console.error("Error saving configuration:", error);
    alert("Error saving configuration. Please try again.");
  }
};

// Toggle user selection for alerts
export const toggleUserSelection = (userId) => {
  if (selectedUsers.value.includes(userId)) {
    selectedUsers.value = selectedUsers.value.filter((id) => id !== userId);
  } else {
    selectedUsers.value = [...selectedUsers.value, userId];
  }
};