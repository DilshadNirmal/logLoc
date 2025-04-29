const TimeRangeSelector = ({ timeRange, setTimeRange }) => (
  <div className="flex items-center gap-2">
    {["1h", "6h", "12h", "24h"].map((range) => (
      <button
        key={range}
        onClick={() => setTimeRange(range)}
        className={`px-3 md:px-2 py-1.5 rounded-lg text-sm md:text-[10px] ${
          timeRange === range
            ? "bg-primary text-white"
            : "bg-background/20 hover:bg-background/30 text-text"
        }`}
      >
        {range}
      </button>
    ))}
  </div>
);

export default TimeRangeSelector;
