import React from "react";
import { FormInput, RadioOption, DownloadButton } from "./FormElements";
import ReportAmico from "../../assets/images/report_amico.png";
import SensorSelectionComp from "./SensorSelectionComp";

const AverageDataForm = ({
  configuration,
  setConfiguration,
  dateRange,
  setDateRange,
  averageBy,
  setAverageBy,
  onDownload,
}) => (
  <div className="grid sm:grid-cols-2 gap-8 h-full">
    <div className="sm:flex items-center justify-start hidden">
      <img src={ReportAmico} alt="" className="md:w-9/12 md:ml-8" />
    </div>
    <div className="flex flex-col items-center justify-center h-full">
      <div className="space-y-6 md:space-y-8 lg:space-y-6 xl:space-y-10 w-full sm:w-10/12">
        <h2 className="text-lg lg:text-xl text-center font-semibold tracking-wider text-text">
          Select Data Range
        </h2>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-center md:gap-20">
          <label className="text-text w-fit md:w-32">Configuration</label>
          <div className="w-full md:w-7/12 border border-secondary rounded-lg px-2">
            <SensorSelectionComp />
          </div>
        </div>

        <div className="xl:space-y-8 lg:space-y-6 space-y-5">
          <FormInput label="From">
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) =>
                setDateRange({ ...dateRange, from: e.target.value })
              }
              className="w-full p-2 bg-transparent text-text outline-none"
            />
          </FormInput>
          <FormInput label="To">
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) =>
                setDateRange({ ...dateRange, to: e.target.value })
              }
              className="w-full p-2 bg-transparent text-text outline-none"
            />
          </FormInput>
        </div>

        <div className="flex items-center justify-center gap-12 md:gap-20">
          <label className="text-text w-fit md:w-32 font-semibold tracking-wider">
            Average By:
          </label>
          <div className="w-9/12 md:w-7/12 flex flex-row items-center justify-center gap-2 md:gap-8">
            <RadioOption
              value="hour"
              checked={averageBy === "hour"}
              onChange={(e) => setAverageBy(e.target.value)}
              label="Hour"
              name="averageBy"
            />
            <RadioOption
              value="day"
              checked={averageBy === "day"}
              onChange={(e) => setAverageBy(e.target.value)}
              label="Day"
              name="averageBy"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center mt-8 pb-8 w-10/12">
        <DownloadButton onClick={onDownload} />
      </div>
    </div>
  </div>
);

export default AverageDataForm;
