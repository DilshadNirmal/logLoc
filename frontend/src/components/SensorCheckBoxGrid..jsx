import { useSignals } from "@preact/signals-react/runtime";
import InputCheck from "./form/InputCheck";
import { selectedSensors, selectedSide } from "../signals/voltage";

const SensorCheckboxGrid = () => {
  useSignals();

  const handleSensorClick = (sensorId) => {
    console.log("[SensorCheckboxGrid] Clicked sensor:", sensorId);
    console.log(
      "[SensorCheckboxGrid] selectedSensors.value BEFORE:",
      JSON.stringify(selectedSensors.value)
    );
    if (selectedSensors.value.includes(sensorId)) {
      selectedSensors.value = selectedSensors.value.filter(
        (id) => id !== sensorId
      );
    } else {
      selectedSensors.value = [...selectedSensors.value, sensorId];
    }
    console.log(
      "[SensorCheckboxGrid] selectedSensors.value AFTER:",
      JSON.stringify(selectedSensors.value)
    );
  };

  // Determine which set of sensors to display based on selectedSide
  const sensorRange =
    selectedSide.value === "B"
      ? Array.from({ length: 20 }, (_, i) => i + 21) // Sensors 21-40 for Side B
      : Array.from({ length: 20 }, (_, i) => i + 1); // Sensors 1-20 for Side A

  return (
    <div className="bg-secondary rounded-lg p-4 md:p-2 2xl:p-4 mt-4 md:mt-2 2xl:mt-3">
      <h3 className="text-text font-medium md:text-xs md:font-normal 2xl:text-sm 2xl:font-medium mb-3 md:mb-1.5 2xl:mb-2.5 tracking-wider">
        Select Individual Sensors
      </h3>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 md:gap-1.5 2xl:gap-2">
        {sensorRange.map((sensorId) => (
          <InputCheck
            key={sensorId}
            type="checkbox"
            name={`sensor-${sensorId}`}
            id={`sensor-${sensorId}`}
            value={sensorId}
            checked={selectedSensors.value.includes(sensorId)}
            onChange={() => handleSensorClick(sensorId)}
            checkBoxValue={`S${sensorId}`}
            className="w-4 h-4"
            labelClassName="text-sm"
          />
        ))}
      </div>
    </div>
  );
};

export default SensorCheckboxGrid;
