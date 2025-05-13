import { useSignals } from "@preact/signals-react/runtime";
import { selectedSide, selectedSensors } from "../../signals/voltage";

const SideSelector = () => {
  useSignals();

  return (
    <div className="flex items-center gap-2 md:gap-1.5 2xl:gap-2">
      {[
        {
          value: "A",
          label: "A Side",
          action: () => {
            selectedSide.value = "A";
            selectedSensors.value = [];
          },
        },
        {
          value: "B",
          label: "B Side",
          action: () => {
            selectedSide.value = "B";
            selectedSensors.value = [];
          },
        },
        {
          value: "clear",
          label: "Clear",
          action: () => {
            selectedSide.value = "";
            selectedSensors.value = [];
          },
        },
      ].map((button) => (
        <button
          key={button.value}
          onClick={button.action}
          className={`px-4 md:px-2 py-2 rounded-lg text-sm md:text-[10px] 2xl:text-sm outline-none ${
            (button.value === "A" && selectedSide.value === "A") ||
            (button.value === "A" &&
              selectedSensors.value.some((id) => id <= 20)) ||
            (button.value === "B" && selectedSide.value === "B") ||
            (button.value === "B" &&
              selectedSensors.value.some((id) => id > 20))
              ? "bg-primary text-white"
              : "bg-background/20 hover:bg-background/30 text-text"
          }`}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
};

export default SideSelector;
