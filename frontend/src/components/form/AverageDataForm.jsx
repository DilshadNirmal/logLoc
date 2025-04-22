import React from "react";
import { FormInput, RadioOption, DownloadButton } from "./FormElements";
import ReportAmico from "../../assets/images/report_amico.png";

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
      <img src={ReportAmico} alt="" className="w-8/12  ml-4" />
    </div>
    <div className="flex flex-col items-center justify-center h-full py-5 px-4 sm:pl-0 xl:pr-16 xl:pt-16 lg:pr-8 lg:pt-8">
      <div
        className="space-y-6 lg:space-y-6 xl:space-y-10
      w-full sm:w-10/12"
      >
        <h2 className="text-2xl lg:text-xl text-center font-semibold tracking-wider text-text">
          Select Data Range
        </h2>

        <FormInput label="Configuration">
          <select
            value={configuration}
            onChange={(e) => setConfiguration(e.target.value)}
            className="w-full p-2 bg-transparent text-text outline-none"
          >
            <option value="">Select configuration</option>
          </select>
        </FormInput>

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

        <div className="flex items-center justify-center gap-20">
          <label className="text-text w-32 font-bold">Average By:</label>
          <div className="w-7/12 flex items-center gap-8">
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
