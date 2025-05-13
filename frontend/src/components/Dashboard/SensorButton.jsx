import { useSignals } from "@preact/signals-react/runtime";
import { selectedSensors } from "../../signals/voltage";

const SensorButton = ({ sensorId, voltage }) => {
  useSignals();

  const getVoltageClass = (value) => {
    if (value === undefined) return "bg-secondary/20 text-text/50";
    if (value >= 7) return "bg-secondary text-red-400";
    if (value <= 3) return "bg-secondary text-blue-400";
    return "bg-secondary text-text";
  };

  const handleClick = () => {
    if (selectedSensors.value.includes(sensorId)) {
      selectedSensors.value = selectedSensors.value.filter(id => id !== sensorId);
    } else {
      selectedSensors.value = [...selectedSensors.value, sensorId];
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`${getVoltageClass(voltage)}
            p-1 rounded-lg transition-all hover:scale-105
            ${selectedSensors.value.includes(sensorId) ? "ring-1 ring-primary" : ""}`}
    >
      <div className="text-xs md:text-xs font-medium tracking-wider opacity-55 mb-0.5">
        S{sensorId}
      </div>
      <div className="text-sm md:text-xs 2xl:text-lg font-semibold tracking-wider mb-1">
        {voltage?.toFixed(2) || "--"}
      </div>
      <div className="text-[10px] opacity-75">mV</div>
    </button>
  );
};

export default SensorButton;