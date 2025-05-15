import { useState, useEffect } from "react";
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
  fetchVoltages,
  selectedSensors,
  selectedSide,
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

  const handleSensorClick = (sensor) => {
    if (selectedSensors.value.includes(sensor)) {
      selectedSensors.value = selectedSensors.value.filter((s) => s !== sensor);
    } else {
      selectedSensors.value = [...selectedSensors.value, sensor];
    }
  };

  useEffect(() => {
    fetchVoltages();
  }, []);

  // useEffect(() => {
  //   const debounceTimeout = setTimeout(() => {
  //     fetchChart();
  //   }, 500);

  //   return () => clearTimeout(debounceTimeout);
  // }, [
  //   selectedSensors.value,
  //   timeRange.value,
  //   averageBy.value,
  //   dateRange,
  //   selectedTab,
  // ]);

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

  return (
    <section
      className="bg-background min-h-screen w-full overflow-x-hidden"
      style={{ marginTop: `${navHeight}px` }}
    >
      <div
        className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-8"
        style={{
          height: window.innerWidth >= 1024 ? `${contentHeight}px` : "auto",
        }}
      >
        <fieldset className="border border-primary/75 rounded-lg p-2 py-1 h-full">
          <TabGroup tabOptions={tabOptions} />
          {/* main content */}
          <div className="grid grid-cols-4 gap-4 text-text m-4 2xl:m-6 2xl:mt-4">
            {/* Left Panel */}
            <div className="flex flex-col gap-4">
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
                  fetchChart("analytics");
                }}
              />
            </div>

            {/* Right Panel - Chart */}
            <div
              className="col-span-3 flex flex-col bg-secondary rounded-lg p-4"
              style={{ height: `${contentHeight - 200}px` }}
            >
              <div className="h-full flex-1 border border-primary/30 rounded-lg p-4">
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
