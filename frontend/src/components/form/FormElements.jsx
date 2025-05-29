import { MdOutlineFileDownload } from "react-icons/md";

export const FormInput = ({ label, children }) => (
  <div className="flex flex-col md:flex-row items-start md:items-center justify-center md:gap-20">
    <label className="text-text text-sm md:text-sm 2xl:text-sm w-fit md:w-32">
      {label}
    </label>
    <div className="w-full md:w-7/12 bg-primary/50 border border-secondary rounded-lg px-2">
      {" "}
      {/*[#1d4873]*/} {children}
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
        className={`w-5 h-5 md:w-4 md:h-4 2xl:w-5 2xl:h-5 border-2 ${
          checked ? "border-primary bg-primary/20" : "border-primary"
        } rounded-full flex items-center justify-center`}
      >
        {checked && (
          <div className="w-3 h-3 md:w-2 md:h-2 2xl:w-3 2xl:h-3 rounded-full bg-primary"></div>
        )}
      </div>
    </div>
    <span className="text-sm md:text-xs 2xl:text-sm">{label}</span>
  </label>
);

export const DownloadButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center gap-2 p-3 px-6 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
  >
    <MdOutlineFileDownload className="w-6 h-6 md:w-5 md:h-5" />
    Download Excel
  </button>
);
