import { signal, computed } from "@preact/signals-react";
import axiosInstance from "../lib/axios";

export const voltageDataA = signal({
  voltages: {},
  batteryStatus: 0,
  signalStrength: 0,
  timestamp: null,
});

export const voltageDataB = signal({
  voltages: {},
  batteryStatus: 0,
  signalStrength: 0,
  timestamp: null,
});

// ui signals
export const selectedSensors = signal([1]);
export const selectedSide = signal("A");
export const timeRange = signal("1h");
export const chartData = signal([]);
export const signalHistory = signal([]);
export const averageBy = signal("minute");
export const dateRange = signal({ from: new Date(), to: new Date() });
export const countOptions = signal("last100");
export const customCount = signal(100);
export const currentPage = signal("dashboard");
export const selectedTabSignal = signal("average");

// computed signals
const calculateVoltage = (voltages, operation) => {
  if (!voltages || Object.keys(voltages).length === 0) return 0;
  const values = Object.values(voltages).filter(
    (v) => v !== undefined && v !== null
  );
  return values.length === 0 ? 0 : operation(values);
};

// Computed signals with parameters
export const getMinVoltage = (voltageData) =>
  computed(() => {
    const voltages = voltageData.value.voltages;
    return calculateVoltage(voltages, (values) => Math.min(...values));
  });

export const getMaxVoltage = (voltageData) =>
  computed(() => {
    const voltages = voltageData.value.voltages;
    return calculateVoltage(voltages, (values) => Math.max(...values));
  });

// API Functions
export const fetchVoltages = async () => {
  try {
    const response = await axiosInstance("/voltage-history");
    if (response.data && response.data.length > 0) {
      const group1Data = response.data.find((d) => d.sensorGroup === "1-20");
      const group2Data = response.data.find((d) => d.sensorGroup === "21-40");

      if (group1Data) {
        voltageDataA.value = {
          voltages: group1Data.voltages || {},
          batteryStatus: group1Data.batteryStatus || 0,
          signalStrength: group1Data.signalStrength || -100,
          timestamp: new Date(group1Data.timestamp || 0),
        };
      }

      if (group2Data) {
        voltageDataB.value = {
          voltages: group2Data.voltages || {},
          batteryStatus: group2Data.batteryStatus || 0,
          signalStrength: group2Data.signalStrength || -100,
          timestamp: new Date(group2Data.timestamp || 0),
        };
      }
    }
  } catch (error) {
    console.error("Error fetching voltages:", error);
  }
};

export const fetchChart = async (sourcePage) => {
  try {
    if (selectedSensors.value.length === 0) {
      chartData.value = [];
      return;
    }

    const params = {
      sensorId: selectedSensors.value,
    };

    // Determine which page is calling this function
    const page = sourcePage || currentPage.value;

    if (page === "dashboard") {
      // For Dashboard page, use timeRange
      if (timeRange.value) {
        params.timeRange = parseInt(timeRange.value); // Convert "1h" to 1
      }
    } else if (page === "analytics") {
      // For Analytics page, use dateRange
      if (dateRange.value.from && dateRange.value.to) {
        params.from = new Date(dateRange.value.from).toISOString();
        params.to = new Date(dateRange.value.to).toISOString();

        const selectedTab =
          document.querySelector('[data-selected="true"]')?.id || "average";
        params.mode = selectedTab;

        if (selectedTab === "average" && averageBy.value) {
          params.averageBy = averageBy.value;
        } else if (selectedTab === "interval") {
          params.interval = "hour"; // Default to hour, can be customized
        } else if (selectedTab === "count") {
          params.selectedCounts = JSON.stringify({
            last100: countOptions.value === "last100",
            last500: countOptions.value === "last500",
            last1000: countOptions.value === "last1000",
            custom: countOptions.value === "custom",
          });
          params.customCount = customCount.value;
        }
      }
    }

    const response = await axiosInstance.get("/voltage-data", { params });

    if (response.data && Array.isArray(response.data)) {
      // Filter out any sensors with empty data
      const validData = response.data.filter(
        (sensor) => sensor.data && sensor.data.length > 0
      );
      console.log("validData:", validData); // Log the validData array
      chartData.value = [...validData];
    } else {
      chartData.value = [];
    }
  } catch (error) {
    console.error("Error loading chart:", error);
    chartData.value = [];
  }
};

export const fetchSignalHistory = async () => {
  try {
    const response = await axiosInstance.get("/voltage-history/signal", {
      params: {
        hours: 12,
      },
    });

    if (response.data && Array.isArray(response.data)) {
      signalHistory.value = response.data.map((entry) => ({
        time: new Date(entry.timestamp).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        strength: Math.ceil(entry.signalStrength / 25),
      }));
    }
  } catch (error) {
    console.error("Error fetching signal history:", error);
  }
};
