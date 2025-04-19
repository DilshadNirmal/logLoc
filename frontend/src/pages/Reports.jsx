import React, { useState, useEffect } from "react";
import { CiCalendar, CiHashtag } from "react-icons/ci";
import { TbClockCode } from "react-icons/tb";
import { LuSigma } from "react-icons/lu";
import { MdOutlineFileDownload } from "react-icons/md";
import ReportAmico from "../assets/images/report_amico.png";

const TabButton = ({ isSelected, onClick, icon: Icon, label }) => (
  <button
    className={`flex items-center justify-center gap-3 p-4 rounded-lg transition-all ${
      isSelected
        ? "bg-primary text-white"
        : "bg-secondary text-text hover:bg-secondary/70"
    }`}
    onClick={onClick}
  >
    <Icon className="w-8 h-8" />
    <span className="text-lg font-medium tracking-wide">{label}</span>
  </button>
);

const Reports = () => {
  const [navHeight, setNavHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [selectedTab, setSelectedTab] = useState("average");
  const [configuration, setConfiguration] = useState("");
  const [dateRange, setDateRange] = useState({
    from: "",
    to: "",
  });
  const [averageBy, setAverageBy] = useState("hour");

  const tabOptions = [
    { id: "average", label: "Average Data", icon: LuSigma },
    { id: "interval", label: "Interval Data", icon: TbClockCode },
    { id: "date", label: "Date Picker", icon: CiCalendar },
    { id: "count", label: "Count-wise Data", icon: CiHashtag },
  ];

  useEffect(() => {
    const updateNavHeight = () => {
      const header = document.querySelector("header");
      if (header) {
        setNavHeight(header.offsetHeight);
      }
    };

    const updateContentHeight = () => {
      const windowHeight = window.innerHeight;
      const margin = 20;
      if (window.innerWidth >= 1024) {
        // lg breakpoint
        setContentHeight(windowHeight - 100 - margin);
      }
    };

    updateNavHeight();
    updateContentHeight();
    window.addEventListener("resize", updateNavHeight);
    window.addEventListener("resize", updateContentHeight);
    return () => {
      window.removeEventListener("resize", updateNavHeight);
      window.removeEventListener("resize", updateContentHeight);
    };
  }, []);

  const handleDownload = () => {
    // TODO: Implement Excel download logic
  };

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
          {/* Tab Navigation */}
          <div className="grid grid-cols-4 gap-4 mt-4 m-8">
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
          {/* Main Content */}
          <div
            className="bg-primary/25 rounded-lg p-8 m-8"
            style={{ height: `${contentHeight - navHeight - 132}px` }}
          >
            <div className="grid grid-cols-2 gap-8 h-full">
              {/* Left Column - Illustration */}
              <div className=" flex items-center justify-start">
                <img src={ReportAmico} alt="" className="w-8/12 ml-4" />
              </div>
              {/* Right Column - Form */}
              {/* Right Column - Form */}
              <div className="flex flex-col h-full pl-0 pr-16 pt-16">
                <div className="space-y-10 w-10/12">
                  <h2 className="text-2xl text-center font-bold text-text">
                    Select Data Range
                  </h2>

                  {/* Configuration Dropdown */}
                  <div className="flex items-center justify-center gap-20">
                    <label className="text-text w-32">Configuration</label>
                    <div className="w-7/12 bg-[#1d4873] border border-secondary rounded-lg px-2">
                      <select
                        value={configuration}
                        onChange={(e) => setConfiguration(e.target.value)}
                        className="w-full p-2 bg-transparent text-text outline-none"
                      >
                        <option value="">Select configuration</option>
                      </select>
                    </div>
                  </div>

                  {/* Date Range Inputs */}
                  <div className="space-y-8">
                    <div className="flex items-center justify-center gap-20">
                      <label className="text-text w-32">From</label>
                      <div className="w-7/12 bg-[#1d4873] border border-secondary rounded-lg px-2">
                        <input
                          type="date"
                          value={dateRange.from}
                          onChange={(e) =>
                            setDateRange({ ...dateRange, from: e.target.value })
                          }
                          className="w-full p-2 bg-transparent text-text outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-20">
                      <label className="text-text w-32">To</label>
                      <div className="w-7/12 bg-[#1d4873] border border-secondary rounded-lg px-2">
                        <input
                          type="date"
                          value={dateRange.to}
                          onChange={(e) =>
                            setDateRange({ ...dateRange, to: e.target.value })
                          }
                          className="w-full p-2 bg-transparent text-text outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Average By Radio Buttons */}
                  <div className="flex items-center justify-center gap-20">
                    <label className="text-text w-32 font-bold">
                      Average By:
                    </label>
                    <div className="w-7/12 flex items-center gap-8">
                      <label className="flex items-center gap-3 cursor-pointer text-text">
                        <div className="relative">
                          <input
                            type="radio"
                            name="averageBy"
                            value="hour"
                            checked={averageBy === "hour"}
                            onChange={(e) => setAverageBy(e.target.value)}
                            className="sr-only"
                          />
                          <div
                            className={`w-5 h-5 border-2 ${
                              averageBy === "hour"
                                ? "border-primary bg-primary/20"
                                : "border-primary"
                            } rounded-full flex items-center justify-center`}
                          >
                            {averageBy === "hour" && (
                              <div className="w-3 h-3 rounded-full bg-primary"></div>
                            )}
                          </div>
                        </div>
                        <span>Hour</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer text-text">
                        <div className="relative">
                          <input
                            type="radio"
                            name="averageBy"
                            value="day"
                            checked={averageBy === "day"}
                            onChange={(e) => setAverageBy(e.target.value)}
                            className="sr-only"
                          />
                          <div
                            className={`w-5 h-5 border-2 ${
                              averageBy === "day"
                                ? "border-primary bg-primary/20"
                                : "border-primary"
                            } rounded-full flex items-center justify-center`}
                          >
                            {averageBy === "day" && (
                              <div className="w-3 h-3 rounded-full bg-primary"></div>
                            )}
                          </div>
                        </div>
                        <span>Day</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Download Button */}
                <div className="flex justify-center items-center mt-8 pb-8 w-10/12">
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 p-3 px-6 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <MdOutlineFileDownload className="w-5 h-5" />
                    Download Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </fieldset>
      </div>
    </section>
  );
};

export default Reports;
