import { signal } from "@preact/signals-react";
import axiosInstance from "../lib/axios";

// Common UI signals
export const selectedTabSignal = signal("date");
export const currentPage = signal("dashboard");

// Common alert configuration signals
export const alertConfigSignal = signal({
  emails: [],
  users: [],
  alertDelay: 5,
});

// Common API functions
export const fetchAlertConfig = async () => {
  try {
    const response = await axiosInstance.get("/global-email-config");
    if (response.data) {
      alertConfigSignal.value = {
        ...alertConfigSignal.value,
        emails: response.data.emails || [],
        users: response.data.users || [],
      };
    }
  } catch (error) {
    console.error("Error fetching alert configuration:", error);
  }
};

export const saveAlertConfig = async () => {
  try {
    const response = await axiosInstance.post("/global-email-config", {
      emails: alertConfigSignal.value.emails,
      users: alertConfigSignal.value.users,
      alertDelay: alertConfigSignal.value.alertDelay,
    });

    return response.data.success;
  } catch (error) {
    console.error("Error saving alert configuration:", error);
    return false;
  }
};
