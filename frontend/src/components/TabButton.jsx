import { useSignals } from "@preact/signals-react/runtime";

const TabButton = ({
  isSelected,
  onClick,
  icon: Icon,
  label,
  variant = "horizontal",
}) => {
  useSignals();
  const selected = Boolean(isSelected);
  return (
    <button
      className={`flex ${
        variant === "vertical"
          ? "flex-col items-center justify-center gap-6 md:gap-3 2xl:gap-6"
          : "items-center justify-center gap-3 md:gap-2 2xl:gap-3"
      } p-3 md:p-1.5  ${
        variant === "horizontal" ? "lg:py-3 xl:py-5" : "md:p-2 2xl:p-2.5"
      } rounded-lg transition-all ${
        selected
          ? "bg-primary text-white"
          : variant === "vertical"
          ? "bg-secondary text-primary hover:bg-secondary/70"
          : "bg-secondary text-text hover:bg-secondary/70"
      }`}
      onClick={onClick}
      data-selected={selected}
      id={label.toLowerCase().replace(/\s+/g, "-")}
    >
      <Icon
        className={` ${
          variant === "vertical"
            ? "w-6 h-6 md:w-6 md:h-6  2xl:w-14 2xl:h-14"
            : "2xl:w-8 2xl:h-8"
        }`}
      />
      <span
        className={` ${
          variant === "vertical"
            ? "md:text-[10px] 2xl:text-base text-text"
            : "2xl:text-lg"
        } font-medium tracking-wide`}
      >
        {label}
      </span>
    </button>
  );
};

export default TabButton;
