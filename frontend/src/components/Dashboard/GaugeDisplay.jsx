import { useSignals } from "@preact/signals-react/runtime";

import ReactSpeedometer from "react-d3-speedometer";
import { getMaxVoltage, getMinVoltage } from "../../signals/voltage";
import { useEffect, useState } from "react";

const GaugeDisplay = ({ data, getGaugeSize }) => {
  // Use signals to ensure reactivity
  useSignals();

  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getResponsiveValues = () => {
    if (screenSize.width >= 1536) { // 2xl
      return {
        ringWidth: 16,
        valueTextFontSize: "14",
        valueTextFontWeight: "semibold",
        labelFontSize: "12"
      };
    } else if (screenSize.width >= 768) { // md
      return {
        ringWidth: 10,
        valueTextFontSize: "12",
        valueTextFontWeight: "semibold",
        labelFontSize: "8"
      };
    } else { // sm
      return {
        ringWidth: 12,
        valueTextFontSize: "10",
        valueTextFontWeight: "semibold",
        labelFontSize: "8"
      };
    }
  };

  const commonProps = {
    ...getResponsiveValues(),
    minValue: 0,
    maxValue: 10,
    needleHeightRatio: 0.5,
    needleColor: "#1e88e5",
    startColor: "#3f51b5",
    endColor: "#ff4081",
    segments: 5,
    textColor: "#ffffff",
    valueFormat: ".1f",
    width: getGaugeSize().width,
    height: getGaugeSize().height,
    fluidWidth: false
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-evenly h-full">
      <div className="h-[65%] md:h-[45%] w-[40%] md:w-[30%] xl:w-[40%] flex items-center justify-center">
        <ReactSpeedometer
          {...commonProps}
          value={getMinVoltage(data.value.voltages)}
          currentValueText="Min: ${value} mV"
        />
      </div>
      <div className="h-[65%] md:h-[45%] w-[40%] md:w-[30%] xl:w-[40%] flex items-center justify-center">
        <ReactSpeedometer
          {...commonProps}
          value={getMaxVoltage(data)}
          currentValueText="Max: ${value} mV"
        />
      </div>
    </div>
  );
};

export default GaugeDisplay;
