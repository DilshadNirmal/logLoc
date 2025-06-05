import { useSignals } from "@preact/signals-react/runtime";
import {
  selectedSensors,
  selectedSidesSignal,
  isOpenSignal,
} from "../../signals/voltage";
import InputCheck from "./InputCheck";

const SensorSelectionComp = () => {
  useSignals();

  // Generate sensor lists
  const sideASensors = Array.from({ length: 20 }, (_, i) => i + 1);
  const sideBSensors = Array.from({ length: 20 }, (_, i) => i + 21);
  const allSensors = [...sideASensors, ...sideBSensors];

  // Handle side selection
  const handleSideChange = (side) => {
    let newSelectedSides = { ...selectedSidesSignal.value };

    if (side === "ALL") {
      // If ALL is clicked, toggle selection of available sensors only
      const availableSensors = getAvailableSensors();
      const allSelected = availableSensors.every((id) =>
        selectedSensors.value.includes(id)
      );

      if (allSelected) {
        // If all available sensors are selected, deselect them
        selectedSensors.value = selectedSensors.value.filter(
          (id) => !availableSensors.includes(id)
        );
      } else {
        // If not all available sensors are selected, select them all
        const currentSelected = selectedSensors.value.filter(
          (id) => !availableSensors.includes(id)
        );
        selectedSensors.value = [...currentSelected, ...availableSensors];
      }

      // Update ALL state based on current selection
      newSelectedSides.ALL = !allSelected;
    } else {
      // If A or B is clicked, toggle it
      newSelectedSides[side] = !selectedSidesSignal.value[side];

      // Update available sensors list
      let availableSensors = [];
      if (newSelectedSides.A)
        availableSensors = [...availableSensors, ...sideASensors];
      if (newSelectedSides.B)
        availableSensors = [...availableSensors, ...sideBSensors];

      // Keep only the sensors that are still available
      selectedSensors.value = selectedSensors.value.filter((id) =>
        availableSensors.includes(id)
      );

      if (!newSelectedSides.A && !newSelectedSides.B) {
        newSelectedSides.ALL = false;
      } else {
        // Otherwise, check if all available sensors are selected
        const allSelected =
          availableSensors.length > 0 &&
          availableSensors.every((id) => selectedSensors.value.includes(id));
        newSelectedSides.ALL = allSelected;
      }
    }

    selectedSidesSignal.value = newSelectedSides;
  };

  // Handle individual sensor selection
  const handleSensorSelection = (sensorId) => {
    const newSelectedSensors = [...selectedSensors.value];
    const sensorIndex = newSelectedSensors.indexOf(sensorId);

    if (sensorIndex === -1) {
      // Add sensor if not selected
      newSelectedSensors.push(sensorId);
    } else {
      // Remove sensor if already selected
      newSelectedSensors.splice(sensorIndex, 1);
    }

    selectedSensors.value = newSelectedSensors;

    // Update ALL state based on whether all available sensors are selected
    const availableSensors = getAvailableSensors();
    const allSelected =
      availableSensors.length > 0 &&
      availableSensors.every((id) => newSelectedSensors.includes(id));

    selectedSidesSignal.value = {
      ...selectedSidesSignal.value,
      ALL: allSelected,
    };
  };

  // Get available sensors based on selected sides
  const getAvailableSensors = () => {
    if (selectedSidesSignal.value.A && selectedSidesSignal.value.B) {
      return allSensors;
    } else if (selectedSidesSignal.value.A) {
      return sideASensors;
    } else if (selectedSidesSignal.value.B) {
      return sideBSensors;
    }
    return [];
  };

  const handleSelectAllToggle = () => {
    const availableSensorIds = getAvailableSensors(); // This correctly gets an array of sensor IDs
    const currentSelectedIds = new Set(selectedSensors.value);

    const allCurrentlyAvailableSelected =
      availableSensorIds.length > 0 &&
      availableSensorIds.every((id) => currentSelectedIds.has(id));

    if (allCurrentlyAvailableSelected) {
      // If all available are currently selected, deselect them
      availableSensorIds.forEach((id) => currentSelectedIds.delete(id));
    } else {
      // Else (not all available are selected, or none are), select all available ones
      availableSensorIds.forEach((id) => currentSelectedIds.add(id));
    }
    selectedSensors.value = Array.from(currentSelectedIds);

    // Sync the top-level "All" checkbox state
    if (availableSensorIds.length > 0) {
      const allSelectedAfterToggle = availableSensorIds.every((id) =>
        selectedSensors.value.includes(id)
      );
      selectedSidesSignal.value = {
        ...selectedSidesSignal.value,
        ALL: allSelectedAfterToggle,
      };
    } else {
      // No sensors available, so top-level "All" should be false
      selectedSidesSignal.value = { ...selectedSidesSignal.value, ALL: false };
    }
  };

  return (
    <div className="space-y-1 py-2">
      <div className="flex p-2 justify-between">
        <InputCheck
          type="checkbox"
          name={`selectsensors`}
          checkBoxValue="Side A"
          checked={selectedSidesSignal.value.A}
          onChange={() => handleSideChange("A")}
          labelClassName={`text-text text-xs md:text-sm`}
        />
        <InputCheck
          type="checkbox"
          name={`selectsensors`}
          checkBoxValue="Side B"
          checked={selectedSidesSignal.value.B}
          onChange={() => handleSideChange("B")}
          labelClassName={`text-text text-xs md:text-sm`}
        />
      </div>

      <div className="relative">
        <button
          type="button"
          className="w-full p-2 xl:p-1.5 bg-primary/50 text-text outline-none rounded border border-text/20 flex items-center justify-between"
          onClick={() => (isOpenSignal.value = !isOpenSignal.value)}
        >
          <span className="text-sm">
            {selectedSensors.value.length
              ? `${selectedSensors.value.length} sensors selected`
              : "Select sensors"}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${
              isOpenSignal.value ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpenSignal.value && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-text/20 rounded max-h-48 overflow-y-auto z-10">
            {(() => {
              const availableSensors = getAvailableSensors();
              if (
                availableSensors.length === 0 &&
                (selectedSidesSignal.value.A || selectedSidesSignal.value.B)
              ) {
                return (
                  <p className="text-text/70 text-xs p-2 text-center">
                    No sensors available for selected side(s).
                  </p>
                );
              }
              if (
                availableSensors.length === 0 &&
                !selectedSidesSignal.value.A &&
                !selectedSidesSignal.value.B
              ) {
                return (
                  <p className="text-text/70 text-xs p-2 text-center">
                    Please select a side first.
                  </p>
                );
              }

              const allCurrentlyAvailableSelected =
                availableSensors.length > 0 &&
                availableSensors.every((sensorId) =>
                  selectedSensors.value.includes(sensorId)
                );

              return (
                <div className="grid grid-cols-4 gap-2 p-2">
                  {/* Add Select All checkbox here if sensors are available */}
                  {availableSensors.length > 0 && (
                    <div className="col-span-4 p-1 border-b border-text/10 mb-1">
                      {" "}
                      {/* Styling for the Select All checkbox container */}
                      <InputCheck
                        type="checkbox"
                        name="selectAllDropdownSensors"
                        checkBoxValue="Select All"
                        checked={allCurrentlyAvailableSelected}
                        onChange={handleSelectAllToggle}
                        labelClassName={`text-text text-xs md:text-sm w-full font-medium`}
                      />
                    </div>
                  )}
                  {availableSensors.map((sensorId) => (
                    <InputCheck
                      key={sensorId}
                      type="checkbox"
                      checkBoxValue={`S${sensorId}`}
                      value={sensorId.toString()}
                      checked={selectedSensors.value.includes(sensorId)}
                      onChange={() => handleSensorSelection(sensorId)}
                      labelClassName="text-text"
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorSelectionComp;
