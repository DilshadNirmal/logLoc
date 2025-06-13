import { signal } from "@preact/signals-react";
import axiosInstance from "../lib/axios";

export const dashboardSelectedSide = signal("A");
export const dashboardSelectedSensors = signal([]);
export const dashboardTimeRange = signal("1h");

export const dashboardChartData = signal([]);
export const isDashboardChartLoading = signal(false);
export const dashboardChartError = signal(null);

export const fetchDashboardChartData = async () => {
  isDashboardChartLoading.value = true;
  dashboardChartError.value = null;

  try {
    const params = {
      side: dashboardSelectedSide.value,
      timeRange: dashboardTimeRange.value,
    };

    // Handle selected sensors: send 'all' if array is empty or specific IDs
    if (dashboardSelectedSensors.value.length === 0) {
      // If no specific sensors are selected, we might imply 'all' for the selected side.
      // The backend endpoint handles 'all' if sensorIds is not explicitly 'all' but side is given.
      // For clarity, we can explicitly set it, or let the backend infer from the side param if sensorIds is omitted.
      // Let's ensure sensorIds is passed, either as 'all' or a list.
      params.sensorIds = "all";
    } else {
      params.sensorIds = dashboardSelectedSensors.value.join(",");
    }

    const response = await axiosInstance.get(
      "/voltage-history/dashboard-chart",
      { params }
    );

    if (response.data && Array.isArray(response.data)) {
      const transformedData = response.data.map((sensor) => ({
        ...sensor,
        data: (sensor.data || []).map((item) => ({
          ...item,
          timestamp: item.timestamp
            ? new Date(item.timestamp).toISOString()
            : new Date().toISOString(),
          value: Number(item.value) || 0,
        })),
      }));
      dashboardChartData.value = transformedData;
    } else {
      console.warn(
        "[DashboardChart] No data or unexpected format received:",
        response.data
      );
      dashboardChartData.value = [];
    }
  } catch (error) {
    console.error("[DashboardChart] Error fetching chart data:", error);
    dashboardChartError.value =
      error.response?.data?.message || "Error fetching chart data";
    dashboardChartData.value = []; // Clear data on error
  } finally {
    isDashboardChartLoading.value = false;
  }
};
