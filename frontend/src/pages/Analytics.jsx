import { useState, useEffect, useCallback } from "react";
import { CiCalendar, CiHashtag } from "react-icons/ci";
import { TbClockCode } from "react-icons/tb";
import { LuSigma } from "react-icons/lu";

import {
  averageBy,
  chartData,
  countOptions,
  currentPage,
  customCount,
  dateRange,
  fetchChart,
  isLoading as isLoadingSignal,
  selectedSensors,
  selectedTabSignal,
} from "../signals/voltage";
import ChartContainer from "../components/Chart";
import DateTimeRangePanel from "../components/form/DateTimeRangePanel";
import TabGroup from "../components/TabGroup";
import SensorSelector from "../components/SensorSelector";
import SensorCheckboxGrid from "../components/SensorCheckBoxGrid.";

const Analytics = () => {
  const [navHeight, setNavHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  const fetchData = useCallback(async () => {
    try {
      if (selectedSensors.value.length > 0) {
        console.log('Selected sensors changed, fetching chart data...', selectedSensors.value);
        currentPage.value = "analytics";
        await fetchChart();
      } else {
        console.log('No sensors selected, clearing chart data');
        chartData.value = [];
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
    }
  }, [selectedSensors.value]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-container")) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tabOptions = [
    { id: "average", label: "Average Data", icon: LuSigma },
    { id: "interval", label: "Interval Data", icon: TbClockCode },
    { id: "date", label: "Date Picker", icon: CiCalendar },
    { id: "count", label: "Count-wise Data", icon: CiHashtag },
  ];

  // const isLoading = isLoadingSignal.value;

  // // Show loading overlay when data is being fetched
  // if (isLoading) {
  //   return (
  //     <div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 z-50">
  //       <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
  //         <p className="text-lg font-medium text-gray-800">Loading chart data...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <section
      className="bg-background min-h-screen w-full overflow-x-hidden"
      style={{ marginTop: `${navHeight}px` }}
    >
      <div
        className="max-w-screen mx-auto px-4 md:px-4 xl:px-8 py-4 md:py-3 xl:py-8"
        style={{
          height: window.innerWidth >= 1024 ? `${contentHeight}px` : "auto",
        }}
      >
        <fieldset className="border border-primary/75 rounded-lg p-2 py-1 h-full">
          <TabGroup tabOptions={tabOptions} />
          {/* main content */}
          <div className="grid grid-cols-4 gap-4 md:gap-2 xl:gap-3 text-text m-4 md:m-1.5 md:mt-2 xl:mx-4 2xl:mt-4">
            {/* Left Panel */}
            <div className="flex flex-col gap-4 md:gap-2">
              {/* Sensor Selection */}
              <SensorSelector />

              {/* Time Range Selection */}
              <DateTimeRangePanel
                mode={selectedTabSignal}
                dateRange={dateRange}
                averageBy={averageBy}
                countOptions={countOptions}
                customCount={customCount}
                onPlotGraph={() => {
                  currentPage.value = "analytics";
                  fetchChart();
                }}
              />
            </div>

            {/* Right Panel - Chart */}
            <div
              className="col-span-3 flex flex-col bg-secondary rounded-lg p-4 md:p-2 2xl:p-4"
              style={{
                height: `${
                  window.innerWidth > 1024
                    ? contentHeight - 200
                    : contentHeight - 110
                }px`,
              }}
            >
              <div className="h-full flex-1 border border-primary/30 rounded-lg p-4 md:p-2 2xl:p-4">
                <ChartContainer data={chartData} />
              </div>

              {/* Sensor Checkbox Grid */}
              <SensorCheckboxGrid />
            </div>
          </div>
        </fieldset>
      </div>
    </section>
  );
};

export default Analytics;
