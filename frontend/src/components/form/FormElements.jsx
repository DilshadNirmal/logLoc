import React from "react";
import { MdOutlineFileDownload } from "react-icons/md";

export const FormInput = ({ label, children }) => (
  <div className="flex flex-col md:flex-row items-start md:items-center justify-center md:gap-20">
    <label className="text-text w-fit md:w-32">{label}</label>
    <div className="w-full md:w-7/12 bg-[#1d4873] border border-secondary rounded-lg px-2">
      {children}
    </div>
  </div>
);

export const RadioOption = ({
  value,
  checked,
  onChange,
  label,
  name = "option",
}) => (
  <label className="flex items-center gap-3 cursor-pointer text-text">
    <div className="relative">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div
        className={`w-5 h-5 border-2 ${
          checked ? "border-primary bg-primary/20" : "border-primary"
        } rounded-full flex items-center justify-center`}
      >
        {checked && <div className="w-3 h-3 rounded-full bg-primary"></div>}
      </div>
    </div>
    <span>{label}</span>
  </label>
);

export const DownloadButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center gap-2 p-3 px-6 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
  >
    <MdOutlineFileDownload className="w-5 h-5" />
    Download Excel
  </button>
);
