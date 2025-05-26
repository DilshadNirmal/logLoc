import { useSignals } from "@preact/signals-react/runtime";
import { getVoltageStatus, selectedSensors } from "../../signals/voltage";

const SensorButton = ({ sensorId, voltage }) => {
  useSignals();

  const getVoltageClass = (value) => {
    if (value === undefined) return "bg-secondary/20 text-text/50";
    if (value >= 7) return "bg-secondary text-red-400";
    if (value <= 3) return "bg-secondary text-green-400";
    return "bg-secondary text-text";
  };

  const handleClick = () => {
    if (selectedSensors.value.includes(sensorId)) {
      selectedSensors.value = selectedSensors.value.filter(
        (id) => id !== sensorId
      );
    } else {
      selectedSensors.value = [...selectedSensors.value, sensorId];
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`${getVoltageStatus(voltage.value.voltages[`v${sensorId}`])}
            p-1 rounded-lg transition-all hover:scale-105
            ${
              selectedSensors.value.includes(sensorId)
                ? "ring-1 ring-primary"
                : ""
            }`}
    >
      <div className="text-xs md:text-[8px] xl:text-xs font-medium tracking-wider opacity-55 mb-0.5">
        S{sensorId}
      </div>
      <div className="text-sm md:text-[10px] xl:text-lg font-semibold tracking-wider mb-1 md:mb-0.5 xl:mb-1">
        {voltage.value.voltages[`v${sensorId}`]?.toFixed(2) || "--"}
      </div>
      <div className="text-[10px] md:text-[8px] xl:text-[10px] opacity-75">
        mV
      </div>
    </button>
  );
};

export default SensorButton;
