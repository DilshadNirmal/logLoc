const TabButton = ({ isSelected, onClick, icon: Icon, label }) => (
  <button
    className={`flex items-center justify-center gap-3 p-3 md:p-2 lg:p-3 lg:py-5 rounded-lg transition-all ${
      isSelected
        ? "bg-primary text-white"
        : "bg-secondary text-text hover:bg-secondary/70"
    }`}
    onClick={onClick}
    data-selected={isSelected}
    id={label.toLowerCase().replace(/\s+/g, "-")}
  >
    <Icon className="w-5 h-5 lg:w-6 lg:h-6 2xl:w-8 2xl:h-8" />
    <span className="text-base 2xl:text-lg font-medium tracking-wide">
      {label}
    </span>
  </button>
);

export default TabButton;
