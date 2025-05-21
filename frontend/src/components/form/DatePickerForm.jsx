import { FormInput, DownloadButton } from "./FormElements";
import ReportAmico from "../../assets/images/report_amico.png";
import SensorSelectionComp from "./SensorSelectionComp";

const DatePickerForm = ({
  configuration,
  setConfiguration,
  dateRange,
  setDateRange,
  onDownload,
}) => (
  <div className="grid sm:grid-cols-2 gap-8 h-full">
    <div className="sm:flex items-center justify-start hidden">
      <img src={ReportAmico} alt="" className="md:w-9/12 md:ml-8" />
    </div>
    <div className="flex flex-col items-center justify-center h-full py-5 px-4 sm:pl-0 sm:pr-16 sm:pt-16">
      <div className="space-y-6 md:space-y-8 w-full sm:w-10/12">
        <h2 className="text-2xl text-center font-bold text-text">
          Select Date Range
        </h2>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-center md:gap-20">
          <label className="text-text w-fit md:w-32">Configuration</label>
          <div className="w-full md:w-7/12 border border-secondary rounded-lg px-2">
            <SensorSelectionComp />
          </div>
        </div>

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
      </div>

      <div className="flex justify-center items-center mt-8 pb-8 w-10/12">
        <DownloadButton onClick={onDownload} />
      </div>
    </div>
  </div>
);

export default DatePickerForm;
