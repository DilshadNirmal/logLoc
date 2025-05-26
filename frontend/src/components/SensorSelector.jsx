import { useSignal } from "@preact/signals-react";
import { IoIosArrowUp } from "react-icons/io";

import { selectedSensors, selectedSide } from "../signals/voltage";
import { useSignals, useSignalEffect } from "@preact/signals-react/runtime";
import { useEffect } from "react";

const SensorSelector = () => {
  useSignals();
  const isDropdownOpen = useSignal(false);

  const handleSideChange = (side) => {
    if (selectedSide.value === side) {
      isDropdownOpen.value = !isDropdownOpen.value;
    } else {
      selectedSide.value = side;
      isDropdownOpen.value = true;
    }
  };

  const handleSensorClick = (sensor) => {
    if (selectedSensors.value.includes(sensor)) {
      selectedSensors.value = selectedSensors.value.filter((s) => s !== sensor);
    } else {
      selectedSensors.value = [...selectedSensors.value, sensor];
    }
  };

  //   TODO:
  useSignalEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-container")) {
        isDropdownOpen.value = false;
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  return (
    <div className="bg-secondary text-white p-4 md:p-2.5 2xl:p-4 px-6 md:px-3 2xl:px-6 rounded-lg flex items-center justify-between">
      <p className="text-sm md:text-[10px] 2xl:text-sm font-semibold md:font-medium 2xl:font-semibold tracking-widest md:tracking-wider 2xl:tracking-wider leading-5 md:leading-3 2xl:leading-5">
        Select <br /> Sensor
      </p>

      <div className="flex gap-1.5 md:gap-1.5 2xl:gap-2">
        <div
          className={`dropdown-container relative bg-background rounded-lg md:rounded-md 2xl:rounded-lg px-4 md:px-2 2xl:px-4 py-2 md:py-1 2xl:py-2 cursor-pointer ${
            selectedSide.value === "A" ? "bg-primary" : "bg-background"
          }`}
          onClick={() => handleSideChange("A")}
        >
          <div className="flex items-center justify-between gap-1.5 w-24 md:w-13 2xl:w-24">
            <span className="text-sm md:text-[10px] 2xl:text-sm">Side A</span>
            <span
              className={`transform transition-transform duration-200 ${
                selectedSide.value === "A" && isDropdownOpen.value
                  ? "rotate-180"
                  : ""
              }`}
            >
              <IoIosArrowUp className="w-4 h-4 lg:w-3 lg:h-3 2xl:w-5 2xl:h-5" />
            </span>
          </div>
          {selectedSide.value === "A" && isDropdownOpen.value && (
            <div className="absolute left-0 top-full mt-1 w-full bg-background/95 backdrop-blur-sm rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 border border-primary/30">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((sensor) => (
                <div
                  key={sensor}
                  className={`px-4 md:px-2 2xl:px-4 py-2 md:py-1 2xl:py-2 cursor-pointer text-[9px] border-b border-primary/10 last:border-b-0 ${
                    selectedSensors.value.includes(sensor)
                      ? "bg-primary/40 text-white"
                      : "hover:bg-primary/25 text-white"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSensorClick(sensor);
                  }}
                >
                  Sensor {sensor}
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className={`dropdown-container relative bg-background rounded-lg md:rounded-md 2xl:rounded-lg px-4  md:px-2 2xl:px-4 py-2 md:py-1 2xl:py-2 cursor-pointer ${
            selectedSide.value === "B" ? "bg-primary" : "bg-background"
          }`}
          onClick={() => handleSideChange("B")}
        >
          <div className="flex items-center justify-between gap-1.5 w-24 md:w-13 2xl:w-24">
            <span className="text-sm md:text-[10px] 2xl:text-sm">Side B</span>
            <span
              className={`transform transition-transform duration-200 ${
                selectedSide.value === "B" && isDropdownOpen.value
                  ? "rotate-180"
                  : ""
              }`}
            >
              <IoIosArrowUp className="w-4 h-4 lg:w-3 lg:h-3 2xl:w-5 2xl:h-5" />
            </span>
          </div>
          {selectedSide.value === "B" && isDropdownOpen.value && (
            <div className="absolute left-0 top-full mt-1 w-full bg-background/95 backdrop-blur-sm rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 border border-primary/30">
              {Array.from({ length: 20 }, (_, i) => i + 21).map((sensor) => (
                <div
                  key={sensor}
                  className={`px-4 md:px-2 2xl:px-4 py-2 md:py-1 2xl:py-2 cursor-pointer text-[9px] border-b border-primary/10 last:border-b-0 ${
                    selectedSensors.value.includes(sensor)
                      ? "bg-primary/40 text-white"
                      : "hover:bg-primary/25 text-white"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSensorClick(sensor);
                  }}
                >
                  Sensor {sensor}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SensorSelector;
