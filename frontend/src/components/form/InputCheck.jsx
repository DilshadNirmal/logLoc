import { useSignals } from "@preact/signals-react/runtime";

const InputCheck = ({
  htmlFor,
  type = "radio",
  name,
  id,
  value,
  checked,
  onChange,
  signal,
  signalProperty,
  signalObject,
  checkBoxValue,
  className,
  labelClassName,
  ...props
}) => {
  useSignals();

  const handleChange = (e) => {
    if (signal) {
      // Direct signal update
      signal.value = e.target.value;
    } else if (signalObject && signalProperty) {
      // Update a property of a signal object
      signalObject.value = {
        ...signalObject.value,
        [signalProperty]: e.target.value,
      };
    } else if (onChange) {
      // Regular onChange handler
      onChange(e);
    }
  };

  const isChecked = () => {
    // Handle signal object property
    if (signalObject && signalProperty) {
      return signalObject.value[signalProperty] === value;
    }

    // Handle direct signal
    if (signal) {
      return signal.value === value;
    }

    // Handle regular checked prop
    return checked;
  };

  return (
    <label
      htmlFor={htmlFor}
      className={`flex items-center gap-2 cursor-pointer ${
        labelClassName || ""
      }`}
    >
      <input
        type={type}
        name={name}
        id={id}
        value={value}
        checked={isChecked()}
        onChange={handleChange}
        className="hidden"
        {...props}
      />
      <div
        className={`w-4 h-4 md:w-2.5 md:h-2.5 2xl:w-4 2xl:h-4 border-2 md:border-1 border-primary bg-primary/20 ${
          type === "radio" ? "rounded-full" : "rounded"
        } flex items-center justify-center ${className || ""}`}
      >
        {isChecked() && (
          <div
            className={`w-2.5 h-2.5 md:w-1.5 md:h-1.5 2xl:w-2.5 2xl:h-2.5 bg-primary ${
              type === "radio" ? "rounded-full" : "rounded"
            }`}
          />
        )}
      </div>
      <span className="md:text-xs 2xl:text-base">{checkBoxValue}</span>
    </label>
  );
};

export default InputCheck;
