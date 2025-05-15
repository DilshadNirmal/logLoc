import { useSignals } from "@preact/signals-react/runtime";

const SignalStrength = ({ data, signalHistoryData }) => {
  useSignals();

  return (
    <div className="h-9/12 px-3 flex flex-col md:flex-row justify-center items-center gap-10 md:gap-1">
      <div className="flex flex-col justify-center items-center gap-4 h-[100%] w-[35%]">
        <div className="flex items-end justify-center gap-1">
          {[1, 2, 3].map((bar) => {
            let barColor;
            const signalStrength = data.value.signalStrength;

            if (signalStrength <= 33) {
              barColor = bar === 1 ? "#ff4d4d" : "#3f3f3f";
            } else if (signalStrength <= 66) {
              barColor = bar <= 2 ? "#ffa64d" : "#3f3f3f";
            } else {
              barColor = "#4dff4d";
            }

            return (
              <div
                key={bar}
                className="w-3.5 md:w-3 2xl:w-3.5 transition-all duration-300"
                style={{
                  height: `${bar * 14}px`,
                  backgroundColor: barColor,
                  opacity: barColor === "#3f3f3f" ? 0.3 : 1,
                }}
              />
            );
          })}
        </div>
        <span className="text-3xl font-bold text-center">
          {data.value.signalStrength}%
        </span>
      </div>
      <div className="w-[80%] md:w-[60%] h-[90%]">
        <h5 className="text-base md:text-[10px] 2xl:text-sm text-text/85 font-normal tracking-wide mb-2 md:mb-1 2xl:mb-1">
          Signal strength - 12 Hrs
        </h5>
        <div className="grid grid-cols-4 2xl:grid-rows-3 gap-1">
          {signalHistoryData.value.map((item, index) => (
            <div
              key={index}
              className="bg-background/20 rounded-lg p-1.5 lg:p-1 lg:py-1.5 2xl:p-2 flex flex-col items-center justify-end"
            >
              <div className="flex items-end mb-2 lg:mb-1 2xl:mb-2">
                {Array.from({ length: item.strength || 0 }, (_, i) => (
                  <div
                    key={i}
                    className="w-0.5 2xl:w-1 mx-[1px]"
                    style={{
                      height: `${(i + 1) * 4}px`,
                      backgroundColor:
                        item.strength === 1
                          ? "#ff4d4d"
                          : item.strength === 2
                          ? "#ffa64d"
                          : item.strength === 3
                          ? "#ffff4d"
                          : "#4dff4d",
                    }}
                  />
                ))}
              </div>
              <span className="text-xs lg:text-[7px] 2xl:text-[8px] text-text/75">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SignalStrength;
