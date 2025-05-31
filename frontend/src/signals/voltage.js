import { signal, computed } from "@preact/signals-react";
import axiosInstance from "../lib/axios";
import { selectedTabSignal, currentPage } from "./commonSignals";

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
export const isLoading = signal(false);

// Re-export common signals for backward compatibility
export { selectedTabSignal, currentPage };

// Add new signals for sensor selection
export const selectedSidesSignal = signal({
  A: false,
  B: false,
  ALL: false,
});
export const isOpenSignal = signal(false);

// new signals for threshold configuration
export const thresholdValues = signal({
  max: 7.0,
  min: 3.0,
});

// computed signals
const calculateVoltage = (voltages, operation) => {
  if (!voltages || Object.keys(voltages).length === 0) return 0;
  const values = Object.values(voltages).filter(
    (v) => v !== undefined && v !== null
  );
  return values.length === 0 ? 0 : operation(values);
};

// Computed signals with parameters
export const getMinVoltage = (voltages) =>
  computed(() => {
    // const voltages = voltageData.value.voltages;
    return calculateVoltage(voltages, (values) => Math.min(...values));
  });

export const getMaxVoltage = (voltageData) =>
  computed(() => {
    const voltages = voltageData.value.voltages;
    return calculateVoltage(voltages, (values) => Math.max(...values));
  });

// Computed signal to get sensors for the selected side
export const getSelectedSensors = computed(() => {
  const side = selectedSide.value;
  const sensors = selectedSensors.value;

  if (side === "A") {
    return sensors.filter((s) => s <= 20);
  } else if (side === "B") {
    return sensors.filter((s) => s >= 21 && s <= 40);
  } else {
    return sensors;
  }
});

// computed signals for voltage status
export const getVoltageStatus = (value) => {
  if (value === undefined || value === null)
    return "bg-secondary/20 text-text/50";
  if (value >= thresholdValues.value.max) return "bg-secondary text-red-400";
  if (value <= thresholdValues.value.min) return "bg-secondary text-blue-400";

  return "bg-secondary text-text";
};

export const getStatusColor = (status) => {
  switch (status) {
    case "high":
      return "bg-secondary text-red-400";
    case "low":
      return "bg-secondary text-green-200";
    case "normal":
      return "bg-secondary text-text";
    default:
      return "bg-secondary/20 text-text/50";
  }
};

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

export const fetchChart = async () => {
  try {
    if (selectedSensors.value.length === 0) {
      chartData.value = [];
      return;
    }

    console.log(selectedSensors.value);
    isLoading.value = true;

    const params = {
      reportType: selectedTabSignal.value,
      configuration: selectedSide.value,
      sensorIds: getSelectedSensors.value,
    };

    // Add date range if available
    if (dateRange.value.from && dateRange.value.to) {
      params.dateRange = {
        from: new Date(dateRange.value.from).toISOString(),
        to: new Date(dateRange.value.to).toISOString(),
      };
    }

    // Add specific parameters based on report type
    switch (selectedTabSignal.value) {
      case "average":
        params.averageBy = averageBy.value;
        break;
      case "interval":
        params.interval = "hour";
        break;
      case "count":
        params.selectedCounts = JSON.stringify({
          last100: countOptions.value === "last100",
          last500: countOptions.value === "last500",
          last1000: countOptions.value === "last1000",
          custom: countOptions.value === "custom",
        });
        params.customCount = customCount.value;
        break;
    }

    const response = await axiosInstance.post("/reports/fetch-data", params);
    
    console.log('Raw API Response:', response.data);
    console.log('Response type:', typeof response.data);
    
    let dataToProcess = [];
    
    // Handle different response formats
    if (Array.isArray(response.data)) {
      // If response is already an array
      dataToProcess = response.data;
    } else if (response.data && typeof response.data === 'object') {
      // If response is an object, check for common data properties
      if (response.data.data && Array.isArray(response.data.data)) {
        dataToProcess = response.data.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        dataToProcess = response.data.results;
      } else {
        // If it's an object but we can't find an array, try to use its values
        dataToProcess = Object.values(response.data);
      }
    }
    
    console.log('Data to process:', dataToProcess);
    
    if (Array.isArray(dataToProcess) && dataToProcess.length > 0) {
      console.log('Starting data processing...');
      
      const processedData = dataToProcess
        .map((sensor, index) => {
          if (!sensor) return null;
          
          const sensorId = sensor.sensorId || sensor.id || index;
          console.log(`Processing sensor ${index + 1}/${dataToProcess.length}:`, sensorId);
          
          let sensorData = sensor.data || sensor.values || sensor.readings || [];
          if (!Array.isArray(sensorData)) {
            console.warn(`Sensor ${sensorId} has invalid data:`, sensor);
            return null;
          }
          
          console.log(`Sensor ${sensorId} has ${sensorData.length} data points`);
          
          const processedSensor = {
            sensorId,
            data: sensorData
              .map((item, itemIndex) => {
                try {
                  if (!item || item.value === undefined) {
                    console.warn(`Invalid item at index ${itemIndex} for sensor ${sensorId}:`, item);
                    return null;
                  }
                  
                  const timestamp = item.timestamp || item.time || item.date;
                  const value = Number(item.value);
                  
                  if (isNaN(value)) {
                    console.warn(`Invalid value at index ${itemIndex} for sensor ${sensorId}:`, item.value);
                    return null;
                  }
                  
                  return {
                    ...item,
                    timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
                    value: value,
                    label: item.label || new Date(timestamp).toLocaleTimeString()
                  };
                } catch (error) {
                  console.error(`Error processing item ${itemIndex} for sensor ${sensorId}:`, error);
                  return null;
                }
              })
              .filter(item => item !== null)
          };
          
          return processedSensor.data.length > 0 ? processedSensor : null;
        })
        .filter(sensor => sensor !== null);
    
      console.log('Final processed data:', processedData);
      chartData.value = processedData;
    } else {
      chartData.value = [];
    }
  } catch (error) {
    console.error("Error loading chart:", error);
    chartData.value = [];
  } finally {
    isLoading.value = false; // Set loading to false when done
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
