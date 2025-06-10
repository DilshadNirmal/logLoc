import { useSignals } from "@preact/signals-react/runtime";
import {
  dashboardSelectedSensors,
  dashboardSelectedSide,
} from "../../signals/dashboardSignals";

const SideSelector = () => {
  useSignals();

  return (
    <div className="flex items-center gap-2 md:gap-1.5 2xl:gap-2">
      {[
        {
          value: "A",
          label: "A Side",
          action: () => {
            dashboardSelectedSide.value = "A";
            dashboardSelectedSensors.value = [];
          },
        },
        {
          value: "B",
          label: "B Side",
          action: () => {
            dashboardSelectedSide.value = "B";
            dashboardSelectedSensors.value = [];
          },
        },
        {
          value: "clear",
          label: "Clear",
          action: () => {
            dashboardSelectedSide.value = "A"; // Default to A or handle as 'no specific side'
            dashboardSelectedSensors.value = [];
          },
        },
      ].map((button) => (
        <button
          key={button.value}
          onClick={button.action}
          className={`px-4 md:px-2 py-2 md:py-1 rounded-lg text-sm md:text-[8px] 2xl:text-sm outline-none ${
            // Update active state logic based on new signals
            (button.value === "A" && dashboardSelectedSide.value === "A") ||
            (button.value === "B" && dashboardSelectedSide.value === "B")
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
