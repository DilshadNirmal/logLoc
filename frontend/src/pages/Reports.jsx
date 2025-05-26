import { useState, useEffect } from "react";
import { CiCalendar, CiHashtag } from "react-icons/ci";
import { TbClockCode } from "react-icons/tb";
import { LuSigma } from "react-icons/lu";
import AverageDataForm from "../components/form/AverageDataForm";
import IntervalDataForm from "../components/form/IntervalDataForm";
import DatePickerForm from "../components/form/DatePickerForm";
import CountWiseForm from "../components/form/countWiseForm";
import axiosInstance from "../lib/axios";
import TabGroup from "../components/TabGroup";
import { selectedTabSignal } from "../signals/commonSignals";
import { useSignals } from "@preact/signals-react/runtime";
import { selectedSensors } from "../signals/voltage";

const Reports = () => {
  useSignals();
  const [navHeight, setNavHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
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
        reportType: selectedTabSignal.value,
        configuration,
        dateRange,
        selectedSensors: selectedSensors.value,
      };

      if (selectedTabSignal.value === "average") {
        payload.averageBy = averageBy;
      } else if (selectedTabSignal.value === "interval") {
        payload.interval = interval;
      } else if (selectedTabSignal.value === "count") {
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

      switch (selectedTabSignal.value) {
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
    switch (selectedTabSignal.value) {
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
          <TabGroup tabOptions={tabOptions} />
          <div
            className="bg-primary/25 rounded-lg p-4 2xl:p-4 m-4 2xl:m-6"
            style={{ height: `${contentHeight - navHeight - 132}px` }}
          >
            {renderForm()}
          </div>
        </fieldset>
      </div>

      {/* Loading Modal */}
    {isLoading && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="p-6 rounded-lg shadow-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text/75">Generating Excel file...</p>
        </div>
      </div>
    )}
    </section>
  );
};

export default Reports;
