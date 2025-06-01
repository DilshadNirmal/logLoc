import React, { useEffect } from "react";
import { FormInput, RadioOption, DownloadButton } from "./FormElements";
import ReportAmico from "../../assets/images/report_amico.png";
import SensorSelectionComp from "./SensorSelectionComp";
import { useSignals } from "@preact/signals-react/runtime";
import {
  dateRange,
  averageBy,
  countOptions,
  customCount,
  selectedTabSignal,
} from "../../signals/voltage";
import { signal } from "@preact/signals-react";

// Create a signal for interval since it doesn't exist in voltage.js
const interval = signal("hour");

const ReportForm = ({ onDownload, type }) => {
  useSignals();

  const handleCheckboxChange = (option) => {
    countOptions.value = option;
  };

  useEffect(() => {}, [selectedTabSignal]);

  const renderFormContent = () => {
    switch (type.value) {
      case "average":
        return (
          <>
            <div className="px-2 pb-4 flex items-center justify-center gap-10 md:gap-20">
              <label className="text-text text-xs md:text-sm 2xl:text-base w-full md:w-32 font-semibold tracking-widest md:tracking-wider">
                Average By :
              </label>
              <div className="w-9/12 md:w-7/12 flex flex-row items-center justify-center gap-2 md:gap-8">
                <RadioOption
                  value="hour"
                  checked={averageBy.value === "hour"}
                  onChange={(e) => (averageBy.value = e.target.value)}
                  label="Hour"
                  name="averageBy"
                />
                <RadioOption
                  value="day"
                  checked={averageBy.value === "day"}
                  onChange={(e) => (averageBy.value = e.target.value)}
                  label="Day"
                  name="averageBy"
                />
              </div>
            </div>
          </>
        );

      case "interval":
        return (
          <div className="flex items-center justify-center gap-12 md:gap-20">
            <label className="text-text text-xs md:text-sm 2xl:text-base w-full md:w-32 font-semibold tracking-widest md:tracking-wider">
              Get 1 data for every
            </label>
            <div className="w-9/12 md:w-7/12 flex flex-row items-center justify-center gap-2 md:gap-8">
              <RadioOption
                value="hour"
                checked={interval.value === "hour"}
                onChange={(e) => (interval.value = e.target.value)}
                label="Hour"
                name="intervalBy"
              />
              <RadioOption
                value="day"
                checked={interval.value === "day"}
                onChange={(e) => (interval.value = e.target.value)}
                label="Day"
                name="intervalBy"
              />
            </div>
          </div>
        );

      case "count":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 place-items-center md:gap-8 mt-8">
              <CheckboxOption
                label="Last 100 Data"
                checked={countOptions.value === "last100"}
                onChange={() => handleCheckboxChange("last100")}
              />
              <CheckboxOption
                label="Last 500 Data"
                checked={countOptions.value === "last500"}
                onChange={() => handleCheckboxChange("last500")}
              />
              <CheckboxOption
                label="Last 1000 Data"
                checked={countOptions.value === "last1000"}
                onChange={() => handleCheckboxChange("last1000")}
              />
              <CheckboxOption
                label="Custom Count"
                checked={countOptions.value === "custom"}
                onChange={() => handleCheckboxChange("custom")}
              />
            </div>
            {countOptions.value === "custom" && (
              <div className="mt-6">
                <FormInput label="Count Value">
                  <input
                    type="number"
                    value={customCount.value}
                    onChange={(e) =>
                      (customCount.value = parseInt(e.target.value) || 0)
                    }
                    placeholder="Enter custom count"
                    className="w-full p-2 md:p-1.5 2xl:p-2 bg-transparent text-text text-base md:text-sm 2xl:text-base outline-none"
                    min="1"
                  />
                </FormInput>
              </div>
            )}
          </>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type.value) {
      case "average":
        return "Select Data Range";
      case "interval":
        return "Select Time Interval";
      case "date":
        return "Select Date Range";
      case "count":
        return "Select Count";
      default:
        return "";
    }
  };

  return (
    <div className="grid sm:grid-cols-2 gap-8 p-4 h-full">
      <div className="sm:flex items-center justify-center hidden">
        <img src={ReportAmico} alt="" className="xl:w-9/12" />
      </div>
      <div className="flex flex-col items-center justify-around h-full">
        <div className="space-y-3 md:space-y-4 xl:space-y-6 w-full sm:w-10/12">
          <h2 className="text-base xl:text-lg text-center font-semibold tracking-widest bg-primary text-transparent bg-clip-text">
            {getTitle()}
          </h2>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-center gap-2 md:gap-20">
            <label className="text-text/85 text-sm w-fit md:w-32">
              Configuration
            </label>
            <div className="w-full md:w-7/12 border border-secondary rounded-lg px-2">
              <SensorSelectionComp />
            </div>
          </div>

          {type.value !== "count" && (
            <div className="space-y-8 px-2 not-odd:flex flex-col justify-between items-center">
              <div className="w-full">
                <FormInput label="From">
                  <input
                    type="date"
                    value={dateRange.value.from}
                    onChange={(e) =>
                      (dateRange.value = {
                        ...dateRange.value,
                        from: e.target.value,
                      })
                    }
                    className="w-full p-1.5 md:p-1.5 2xl:p-2 mb-2 bg-transparent text-text text-sm md:text-sm 2xl:text-base outline-none"
                  />
                </FormInput>
                <FormInput label="To">
                  <input
                    type="date"
                    value={dateRange.value.to}
                    onChange={(e) =>
                      (dateRange.value = {
                        ...dateRange.value,
                        to: e.target.value,
                      })
                    }
                    className="w-full p-1.5 md:p-1.5 2xl:p-2 mb-2 bg-transparent text-text text-sm md:text-sm 2xl:text-base outline-none"
                  />
                </FormInput>
              </div>
            </div>
          )}

          {renderFormContent()}
        </div>

        <div className="flex justify-center items-center w-10/12 my-4">
          <DownloadButton onClick={onDownload} />
        </div>
      </div>
    </div>
  );
};

const CheckboxOption = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between md:gap-3 cursor-pointer text-text w-10/12 md:w-8/12 mt-8">
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div
        className={`w-5 h-5 md:w-4 md:h-4 2xl:w-5 2xl:h-5 border-2 ${
          checked ? "border-primary bg-primary/20" : "border-primary"
        } rounded flex items-center justify-center`}
      >
        {checked && (
          <div className="w-3 h-3 md:w-2 md:h-2 2xl:w-3 2xl:h-3 bg-primary rounded"></div>
        )}
      </div>
    </div>
    <span className="text-center text-base md:text-sm 2xl:text-base w-9/12 md:w-full">
      {label}
    </span>
  </label>
);

export default ReportForm;
