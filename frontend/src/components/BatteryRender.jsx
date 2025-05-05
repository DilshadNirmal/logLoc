import React from "react";

const BatteryRender = ({ orient, value }) => {
  return (
    <div className="px-5">
      {/* battery container */}
      <div
        className={`${
          orient === "height" ? "flex" : "flex  flex-col"
        } items-center h-full`}
      >
        {/* batttery cap */}
        <div
          className={`${
            orient === "height"
              ? "h-10 md:h-8 lg:h-6 2xl:h-10 w-1 md:w-0.5 lg:w-[1px] 2xl:w-1"
              : "h-1 w-10"
          } bg-text/75 rounded-lg sm:order-2`}
        ></div>
        {/* batttery body */}
        <div
          className={`${
            orient === "height"
              ? "w-full h-20 md:h-15 lg:h-12 2xl:h-20"
              : "w-20 h-9/12"
          } relative border border-text/75 rounded-lg`}
        >
          <div
            className={`absolute bottom-0 left-0 w-full h-full rounded-lg transition-all duration-300 ${
              value > 50
                ? "bg-gradient-to-t md:bg-gradient-to-l 2xl:bg-gradient-to-l from-primary to-primary/90"
                : value > 20
                ? "bg-gradient-to-t md:bg-gradient-to-l 2xl:bg-gradient-to-l from-primary/50 to-primary/30"
                : "bg-gradient-to-t md:bg-gradient-to-l 2xl:bg-gradient-to-l from-primary/30 to-primary/10"
            }`}
            style={{
              width: orient === "height" ? `${value}%` : "100%",
              height: orient === "height" ? "100%" : `${value}%`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-text z-60">{value}&nbsp;%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatteryRender;
