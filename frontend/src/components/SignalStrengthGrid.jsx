const SignalStrengthGrid = ({ value }) => {
  const strengthLevels = ["Low", "Weak", "Medium", "Strong"];
  const colors = {
    Low: "#ff4d4d",
    Weak: "#ffa64d",
    Medium: "#ffff4d",
    Strong: "#4dff4d",
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-8">
        <div className="flex items-end gap-1">
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className={`w-3 rounded-sm transition-all duration-300`}
              style={{
                height: `${bar * 8}px`,
                backgroundColor: value >= 25 * bar ? "#409fff" : "#133044",
              }}
            />
          ))}
        </div>
        <span className="text-4xl font-bold">{value}%</span>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-4">
        {strengthLevels.map((level) => (
          <div key={level} className="text-center">
            <div className="text-xs mb-1">{level}</div>
            <div className="grid grid-cols-3 gap-1">
              {[1, 2, 3].map((bar) => (
                <div
                  key={`${level}-${bar}`}
                  className="w-full h-4 rounded-sm"
                  style={{ backgroundColor: colors[level] }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SignalStrengthGrid;
