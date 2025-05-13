import { useSignals } from "@preact/signals-react/runtime";
import { IoCalendarOutline } from "react-icons/io5";

const InputBox = ({
  htmlFor,
  type,
  name,
  id,
  labelName,
  value,
  onChange,
  signal,
  signalProperty,
  signalObject,
  className,
  labelClassName,
  inputClassName,
  ...props
}) => {
  useSignals();
  const handleChange = (e) => {
    if (signal) {
      // Direct signal update
      signal.value =
        type === "date" && e.target.value
          ? new Date(e.target.value)
          : e.target.value;
    } else if (signalObject && signalProperty) {
      // Update a property of a signal object
      signalObject.value = {
        ...signalObject.value,
        [signalProperty]:
          type === "date" && e.target.value
            ? new Date(e.target.value)
            : e.target.value,
      };
    } else if (onChange) {
      // Regular onChange handler
      onChange(e);
    }
  };

  const getDisplayValue = () => {
    // Handle signal object property
    if (signalObject && signalProperty) {
      const propertyValue = signalObject.value[signalProperty];

      if (type === "date" && propertyValue instanceof Date) {
        return propertyValue.toISOString().split("T")[0];
      }

      return propertyValue ?? "";
    }

    // Handle direct signal or value
    if (!signal && value === undefined) return "";

    const rawValue = signal ? signal.value : value;

    if (type === "date" && rawValue instanceof Date) {
      return rawValue.toISOString().split("T")[0];
    }

    return rawValue ?? "";
  };

  return (
    <div className={className || "mb-4"}>
      <label
        htmlFor={htmlFor}
        className={labelClassName || "block text-text/70 mb-2"}
      >
        {labelName}
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          id={id}
          value={getDisplayValue()}
          onChange={handleChange}
          className={
            inputClassName ||
            `w-full p-2 ${
              type === "date" ? "pr-10" : ""
            } bg-background text-text outline-none border border-secondary rounded`
          }
          {...props}
        />
        {type === "date" && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-text/70">
            <IoCalendarOutline size={18} />
          </div>
        )}
      </div>
    </div>
  );
};

export default InputBox;
