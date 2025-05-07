import { useState, useEffect } from "react";
import { CiCalendar, CiHashtag } from "react-icons/ci";
import { TbClockCode } from "react-icons/tb";
import { LuSigma } from "react-icons/lu";
import AverageDataForm from "../components/form/AverageDataForm";
import IntervalDataForm from "../components/form/IntervalDataForm";
import DatePickerForm from "../components/form/DatePickerForm";
import CountWiseForm from "../components/form/countWiseForm";
import axiosInstance from "../lib/axios";

const TabButton = ({ isSelected, onClick, icon: Icon, label }) => (
  <button
    className={`flex items-center justify-center gap-3 p-3 md:p-2 lg:p-3 rounded-lg transition-all ${
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

const Reports = () => {
  const [navHeight, setNavHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [selectedTab, setSelectedTab] = useState("average");
  const [configuration, setConfiguration] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [averageBy, setAverageBy] = useState("hour");
  const [interval, setInterval] = useState("hour");
  const [selectedCounts, setSelectedCounts] = useState({
    last100: true,
    last500: false,
    last1000: false,
    custom: false,
  });
  const [customCount, setCustomCount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const tabOptions = [
    { id: "average", label: "Average Data", icon: LuSigma },
    { id: "interval", label: "Interval Data", icon: TbClockCode },
    { id: "date", label: "Date Picker", icon: CiCalendar },
    { id: "count", label: "Count-wise Data", icon: CiHashtag },
  ];

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

  const handleDownload = async () => {
    try {
      // Set loading state to true when download starts
      setIsLoading(true);

      const payload = {
        reportType: selectedTab,
        configuration,
        dateRange,
      };

      if (selectedTab === "average") {
        payload.averageBy = averageBy;
      } else if (selectedTab === "interval") {
        payload.interval = interval;
      } else if (selectedTab === "count") {
        payload.selectedCounts = selectedCounts;
        if (selectedCounts.custom) {
          payload.customCount = customCount;
        }
      }

      // requesting api to download excel file
      const response = await axiosInstance.post(
        "reports/export-excel",
        payload,
        {
          responseType: "blob",
          headers: {
            Accept:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      let filename = "";

      switch (selectedTab) {
        case "average":
          filename = `Average_Data_${dateRange.from}_to_${dateRange.to}.xlsx`;
          break;
        case "interval":
          filename = `Interval_Data_${dateRange.from}_to_${dateRange.to}.xlsx`;
          break;
        case "date":
          filename = `Date_Data_${dateRange.from}_to_${dateRange.to}.xlsx`;
          break;
        case "count":
          filename = `Count_Data_${
            new Date().toISOString().split("T")[0]
          }.xlsx`;
          break;
        default:
          filename = "report.xlsx";
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert(`Failed to download report: ${error.message}`);
    } finally {
      // Set loading state to false when download completes or fails
      setIsLoading(false);
    }
  };

  const renderForm = () => {
    switch (selectedTab) {
      case "average":
        return (
          <AverageDataForm
            configuration={configuration}
            setConfiguration={setConfiguration}
            dateRange={dateRange}
            setDateRange={setDateRange}
            averageBy={averageBy}
            setAverageBy={setAverageBy}
            onDownload={handleDownload}
          />
        );
      case "interval":
        return (
          <IntervalDataForm
            configuration={configuration}
            setConfiguration={setConfiguration}
            dateRange={dateRange}
            setDateRange={setDateRange}
            interval={interval}
            setInterval={setInterval}
            onDownload={handleDownload}
          />
        );
      case "date":
        return (
          <DatePickerForm
            configuration={configuration}
            setConfiguration={setConfiguration}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onDownload={handleDownload}
          />
        );
      case "count":
        return (
          <CountWiseForm
            selectedCounts={selectedCounts}
            setSelectedCounts={setSelectedCounts}
            customCount={customCount}
            setCustomCount={setCustomCount}
            onDownload={handleDownload}
          />
        );
      default:
        return null;
    }
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 m-4 2xl:m-8">
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
          <div
            className="bg-primary/25 rounded-lg p-4 2xl:p-4 m-4 2xl:m-8"
            style={{ height: `${contentHeight - navHeight - 132}px` }}
          >
            {renderForm()}
          </div>
        </fieldset>
      </div>
    </section>
  );
};

export default Reports;
