import { useSignals } from "@preact/signals-react/runtime";

const TimeRangeSelector = ({ timeRange }) => {
  useSignals();
  return (
    <div className="flex items-center gap-2 md:gap-1 xl:gap-2">
      {["1h", "6h", "12h", "24h"].map((range) => (
        <button
          key={range}
          onClick={() => (timeRange.value = range)}
          className={`px-3 md:px-1.5 xl:px-3 py-1.5 md:py-0.5 xl:py-1.5 rounded-lg md:rounded xl:rounded-lg text-sm md:text-[8px] xl:text-sm ${
            timeRange.value === range
              ? "bg-primary text-white"
              : "bg-background/20 hover:bg-background/30 text-text"
          }`}
        >
          {range}
        </button>
      ))}
    </div>
  );
};

export default TimeRangeSelector;
