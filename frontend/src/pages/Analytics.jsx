import { useState, useEffect } from "react";
import { CiCalendar, CiHashtag } from "react-icons/ci";
import { TbClockCode } from "react-icons/tb";
import { LuSigma } from "react-icons/lu";

import axiosInstance from "../lib/axios";
import {
  averageBy,
  chartData,
  dateRange,
  fetchChart,
  fetchVoltages,
  selectedSensors,
  timeRange,
} from "../signals/voltage";
import ChartContainer from "../components/Chart";

const Analytics = () => {
  const [navHeight, setNavHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [selectedSide, setSelectedSide] = useState("A");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [selectedTab, setSelectedTab] = useState("average");

  const handleSensorClick = (sensor) => {
    if (selectedSensors.value.includes(sensor)) {
      selectedSensors.value = selectedSensors.value.filter((s) => s !== sensor);
    } else {
      selectedSensors.value = [...selectedSensors.value, sensor];
    }
  };

  const handleSideChange = (side) => {
    if (selectedSide === side) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      setSelectedSide(side);
      setIsDropdownOpen(true);
    }
  };

  useEffect(() => {
    fetchVoltages();
  }, []);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      fetchChart();
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [
    selectedSensors.value,
    timeRange.value,
    averageBy.value,
    dateRange,
    selectedTab,
  ]);

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 m-4 2xl:m-6 2xl:mb-0">
            {tabOptions.map((tab) => (
              <TabButton
                key={tab.id}
                isSelected={selectedTab === tab.id}
                onClick={() => setSelectedTab(tab.id)}
                icon={tab.icon}
                label={tab.label}
              />
            ))}
          </div>
          {/* main content */}
          <div className="grid grid-cols-4 gap-4 text-text m-4 2xl:m-6 2xl:mt-4">
            {/* Left Panel */}
            <div className="flex flex-col gap-4">
              {/* Sensor Selection */}
              <div className="bg-secondary text-white p-4 px-6 rounded-lg flex items-center justify-between">
                <p className="text-sm font-semibold tracking-widest leading-5">
                  Select <br /> Sensor
                </p>

                <div className="flex gap-2">
                  <div
                    className={`dropdown-container relative bg-background rounded-lg px-4 py-2 cursor-pointer ${
                      selectedSide === "A" ? "bg-primary" : "bg-background"
                    }`}
                    onClick={() => handleSideChange("A")}
                  >
                    <div className="flex items-center justify-between gap-2 w-24">
                      <span>Side A</span>
                      <span
                        className={`transform transition-transform duration-200 ${
                          selectedSide === "A" && isDropdownOpen
                            ? "rotate-180"
                            : ""
                        }`}
                      >
                        ▼
                      </span>
                    </div>
                    {selectedSide === "A" && isDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 w-full bg-background/95 backdrop-blur-sm rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 border border-primary/30">
                        {Array.from({ length: 20 }, (_, i) => i + 1).map(
                          (sensor) => (
                            <div
                              key={sensor}
                              className={`px-4 py-2 cursor-pointer text-sm border-b border-primary/10 last:border-b-0 ${
                                selectedSensors.value.includes(sensor)
                                  ? "bg-primary/40 text-white"
                                  : "hover:bg-primary/25 text-white"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSensorClick(sensor);
                              }}
                            >
                              Sensor {sensor}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    className={`dropdown-container relative bg-background rounded-lg px-4 py-2 cursor-pointer ${
                      selectedSide === "B" ? "bg-primary" : "bg-background"
                    }`}
                    onClick={() => handleSideChange("B")}
                  >
                    <div className="flex items-center justify-between gap-2 w-24">
                      <span>Side B</span>
                      <span
                        className={`transform transition-transform duration-200 ${
                          selectedSide === "B" && isDropdownOpen
                            ? "rotate-180"
                            : ""
                        }`}
                      >
                        ▼
                      </span>
                    </div>
                    {selectedSide === "B" && isDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 w-full bg-background/95 backdrop-blur-sm rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 border border-primary/30">
                        {Array.from({ length: 20 }, (_, i) => i + 21).map(
                          (sensor) => (
                            <div
                              key={sensor}
                              className={`px-4 py-2 cursor-pointer text-sm border-b border-primary/10 last:border-b-0 ${
                                selectedSensors.includes(sensor)
                                  ? "bg-primary/40 text-white"
                                  : "hover:bg-primary/25 text-white"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSensorClick(sensor);
                              }}
                            >
                              Sensor {sensor}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Time Range Selection */}
              <div className="bg-secondary text-white flex-1 p-4 rounded-lg">
                <h3 className="text-lg text-center font-semibold tracking-wider mt-4 mb-4">
                  Select Time Range
                </h3>
                <div className="mt-16 flex flex-col items-center gap-8">
                  <div className="w-full flex justify-center items-center gap-4">
                    <label htmlFor="from" className="w-16 capitalize">
                      from
                    </label>
                    <input
                      type="date"
                      id="from"
                      value={dateRange.from}
                      onChange={(e) =>
                        (dateRange.value = {
                          ...dateRange,
                          from: e.target.value,
                        })
                      }
                      className="flex-1 max-w-[200px] bg-background/80 text-text/75 py-2 px-3 outline-none rounded"
                    />
                  </div>
                  <div className="w-full flex justify-center items-center gap-4">
                    <label htmlFor="to" className="w-16 capitalize">
                      to
                    </label>
                    <input
                      type="date"
                      id="to"
                      value={dateRange.to}
                      onChange={(e) =>
                        (dateRange.value = { ...dateRange, to: e.target.value })
                      }
                      className="flex-1 max-w-[200px] bg-background/80 text-text/75 py-2 px-3 outline-none rounded"
                    />
                  </div>
                </div>

                {/* Average By Radio Buttons */}
                <div className="mt-12 flex items-start justify-center">
                  <div className="w-4/5">
                    <h3 className="font-semibold tracking-wider text-base mb-4">
                      Average by
                    </h3>
                    <div className="flex justify-center items-center gap-12">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="average"
                          value="minute"
                          className="hidden"
                          checked={averageBy.value === "minute"}
                          onChange={(e) => (averageBy.value = e.target.value)}
                        />
                        <div className="w-5 h-5 border-2 border-primary rounded-full flex items-center justify-center">
                          {averageBy.value === "minute" && (
                            <div className="w-3 h-3 bg-primary rounded-full" />
                          )}
                        </div>
                        <span>Minute</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="average"
                          value="hour"
                          className="hidden"
                          checked={averageBy.value === "hour"}
                          onChange={(e) => (averageBy.value = e.target.value)}
                        />
                        <div className="w-5 h-5 border-2 border-primary rounded-full flex items-center justify-center">
                          {averageBy.value === "hour" && (
                            <div className="w-3 h-3 bg-primary rounded-full" />
                          )}
                        </div>
                        <span>Hour</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="average"
                          value="day"
                          className="hidden"
                          checked={averageBy.value === "day"}
                          onChange={(e) => (averageBy.value = e.target.value)}
                        />
                        <div className="w-5 h-5 border-2 border-primary rounded-full flex items-center justify-center">
                          {averageBy.value === "day" && (
                            <div className="w-3 h-3 bg-primary rounded-full" />
                          )}
                        </div>
                        <span>Day</span>
                      </label>
                    </div>
                  </div>
                </div>
                <button
                  onClick={fetchChart}
                  className="mt-4 bg-primary hover:bg-primary/8 text-white px-8 py-2 rounded-lg transition-colors"
                >
                  Plot Graph
                </button>
              </div>
            </div>

            {/* Right Panel - Chart */}
            <div
              className="col-span-3 bg-secondary rounded-lg p-4"
              style={{ height: `${contentHeight - navHeight - 132}px` }}
            >
              <div className="h-full border border-primary/30 rounded-lg p-4">
                <ChartContainer data={chartData} />
              </div>
            </div>
          </div>
        </fieldset>
      </div>
    </section>
  );
};

const TabButton = ({ isSelected, onClick, icon: Icon, label }) => (
  <button
    className={`flex items-center justify-center gap-3 p-3 md:p-2 md:py-5 lg:p-3 lg:py-5 rounded-lg transition-all ${
      isSelected
        ? "bg-primary text-white"
        : "bg-secondary text-text hover:bg-secondary/70"
    }`}
    onClick={onClick}
  >
    <Icon className="w-5 h-5 lg:w-6 lg:h-6 2xl:w-8 2xl:h-8" />
    <span className="text-base 2xl:text-lg font-medium tracking-wide">
      {label}
    </span>
  </button>
);

export default Analytics;
