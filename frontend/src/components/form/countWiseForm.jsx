import React from "react";
import { DownloadButton } from "./FormElements";
import ReportAmico from "../../assets/images/report_amico.png";

const CheckboxOption = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-3 cursor-pointer text-text mt-8">
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div
        className={`w-5 h-5 border-2 ${
          checked ? "border-primary bg-primary/20" : "border-primary"
        } rounded flex items-center justify-center`}
      >
        {checked && <div className="w-3 h-3 bg-primary rounded"></div>}
      </div>
    </div>
    <span>{label}</span>
  </label>
);

const CountWiseForm = ({ onDownload }) => {
  const [selectedCounts, setSelectedCounts] = React.useState({
    last100: true,
    last500: false,
    last1000: false,
    custom: false,
  });

  const handleCheckboxChange = (key) => {
    setSelectedCounts((prev) => ({
      ...Object.fromEntries(Object.entries(prev).map(([k]) => [k, false])),
      [key]: true,
    }));
  };

  return (
    <div className="grid grid-cols-2 gap-8 h-full">
      <div className="flex items-center justify-start">
        <img src={ReportAmico} alt="" className="w-8/12 ml-4" />
      </div>
      <div className="flex flex-col h-full pl-0 pr-16 pt-16">
        <div className="space-y-10 w-10/12">
          <h2 className="text-2xl text-center font-bold text-text">
            Select Count
          </h2>

          <div className="grid grid-cols-2 gap-8 mt-8">
            <CheckboxOption
              label="Last 100 Data"
              checked={selectedCounts.last100}
              onChange={() => handleCheckboxChange("last100")}
            />
            <CheckboxOption
              label="Last 500 Data"
              checked={selectedCounts.last500}
              onChange={() => handleCheckboxChange("last500")}
            />
            <CheckboxOption
              label="Last 1000 Data"
              checked={selectedCounts.last1000}
              onChange={() => handleCheckboxChange("last1000")}
            />
            <CheckboxOption
              label="Custom Count"
              checked={selectedCounts.custom}
              onChange={() => handleCheckboxChange("custom")}
            />
          </div>
        </div>

        <div className="flex justify-center items-center mt-22 pb-8 w-10/12">
          <DownloadButton onClick={onDownload} />
        </div>
      </div>
    </div>
  );
};

export default CountWiseForm;
