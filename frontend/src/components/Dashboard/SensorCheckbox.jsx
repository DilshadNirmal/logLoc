import { useSignals } from "@preact/signals-react/runtime";
import { selectedSensors, selectedSide } from "../../signals/voltage";

const SensorCheckbox = () => {
  useSignals();

  const handleChange = (e, sensorId) => {
    if (e.target.checked) {
      selectedSensors.value = [...selectedSensors.value, sensorId];
    } else {
      selectedSensors.value = selectedSensors.value.filter(
        (id) => id !== sensorId
      );
    }
  };

  return (
    <div className="grid grid-cols-10 place-items-center gap-1 md:gap-0.5 2xl:gap-1 p-2 md:p-1 2xl:p-2 rounded-lg">
      {[...Array(20)].map((_, index) => {
        const sensorId = selectedSide.value === "A" ? index + 1 : index + 21;
        return (
          <label key={sensorId} className="container relative flex items-center gap-1 md:gap-0.5 2xl:gap-1 cursor-pointer select-none text-text text-[10px] md:text-[8px] 2xl:text-[10px] pl-4 md:pl-2 2xl:pl-4">
            <input
              type="checkbox"
              checked={selectedSensors.value.includes(sensorId)}
              onChange={(e) => handleChange(e, sensorId)}
              className="absolute opacity-0 cursor-pointer h-0 w-0"
            />
            <span className="checkmark absolute left-0 top-1/2 -translate-y-1/2 h-3 w-3 md:h-1.5 md:w-1.5 bg-text/20 rounded transition-colors duration-200 hover:bg-text/30"></span>
            <span>S{sensorId}</span>
          </label>
        );
      })}
    </div>
  );
};

export default SensorCheckbox;