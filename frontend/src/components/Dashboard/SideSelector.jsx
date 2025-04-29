const SideSelector = ({
  selectedSide,
  selectedSensors,
  setSelectedSide,
  setSelectedSensors,
}) => (
  <div className="flex items-center gap-2 md:gap-1.5 2xl:gap-2">
    {[
      {
        value: "A",
        label: "A Side",
        action: () => {
          setSelectedSide("A");
          setSelectedSensors([]);
        },
      },
      {
        value: "B",
        label: "B Side",
        action: () => {
          setSelectedSide("B");
          setSelectedSensors([]);
        },
      },
      {
        value: "clear",
        label: "Clear",
        action: () => setSelectedSensors([]),
      },
    ].map((button) => (
      <button
        key={button.value}
        onClick={button.action}
        className={`px-4 md:px-2 py-2 rounded-lg text-sm md:text-[10px] 2xl:text-sm ${
          (button.value === "A" && selectedSide === "A") ||
          (button.value === "A" && selectedSensors.some((id) => id <= 20)) ||
          (button.value === "B" && selectedSide === "B") ||
          (button.value === "B" && selectedSensors.some((id) => id > 20))
            ? "bg-primary text-white"
            : "bg-background/20 hover:bg-background/30 text-text"
        }`}
      >
        {button.label}
      </button>
    ))}
  </div>
);

export default SideSelector;
