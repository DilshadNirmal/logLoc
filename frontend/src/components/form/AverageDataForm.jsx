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
  <div className="grid grid-cols-2 gap-8 h-full">
    <div className="flex items-center justify-start">
      <img src={ReportAmico} alt="" className="w-8/12 ml-4" />
    </div>
    <div className="flex flex-col h-full pl-0 pr-16 pt-16">
      <div className="space-y-10 w-10/12">
        <h2 className="text-2xl text-center font-bold text-text">
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

        <div className="space-y-8">
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
