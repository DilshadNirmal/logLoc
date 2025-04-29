import React from "react";
import { FormInput, RadioOption, DownloadButton } from "./FormElements";
import ReportAmico from "../../assets/images/report_amico.png";

const IntervalDataForm = ({
  configuration,
  setConfiguration,
  dateRange,
  setDateRange,
  interval,
  setInterval,
  onDownload,
}) => (
  <div className="grid sm:grid-cols-2 sm:gap-8 items-center justify-center h-full">
    <div className="sm:flex items-center justify-start hidden">
      <img src={ReportAmico} alt="" className="md:w-9/12 md:ml-8" />
    </div>
    <div className="flex flex-col items-center justify-center h-full">
      <div className="space-y-6 md:space-y-8 w-full sm:w-10/12">
        <h2 className="text-lg lg:text-xl text-center font-semibold tracking-wider text-text">
          Select Time Interval
        </h2>

        {/* Same form inputs as AverageDataForm */}
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
          <label className="text-text w-fit md:w-32 font-semibold">
            Get 1 data for every-
          </label>
          <div className="w-7/12 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-8">
            <RadioOption
              value="hour"
              checked={interval === "hour"}
              onChange={(e) => setInterval(e.target.value)}
              label="Hour"
              name="intervalBy"
            />
            <RadioOption
              value="day"
              checked={interval === "day"}
              onChange={(e) => setInterval(e.target.value)}
              label="Day"
              name="intervalBy"
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

export default IntervalDataForm;
