import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { effect } from "@preact/signals-react";
import ReactSpeedometer from "react-d3-speedometer";
import { getMaxVoltage, getMinVoltage } from "../../signals/voltage";

const GaugeDisplay = ({ data, getGaugeSize }) => {
  // Use signals to ensure reactivity
  useSignals();
  return (
    <div className="flex flex-col md:flex-row items-center justify-evenly h-full">
      <div className="h-[65%] md:h-[45%] w-[40%] md:w-[30%] xl:w-[40%] flex items-center justify-center">
        <ReactSpeedometer
          value={getMinVoltage(data.value.voltages)}
          minValue={0}
          maxValue={10}
          width={getGaugeSize().width}
          height={getGaugeSize().height}
          needleHeightRatio={0.5}
          needleColor="#1e88e5"
          startColor="#3f51b5"
          endColor="#ff4081"
          segments={5}
          ringWidth={13}
          textColor="#ffffff"
          valueFormat=".1f"
          currentValueText="Min: ${value} mV"
          fluidWidth={false}
          valueTextFontSize="10"
          valueTextFontWeight="semibold"
          labelFontSize="8"
        />
      </div>
      <div className="h-[65%] md:h-[45%] w-[40%] md:w-[30%] xl:w-[40%] flex items-center justify-center">
        <ReactSpeedometer
          value={getMaxVoltage(data)}
          minValue={0}
          maxValue={10}
          width={getGaugeSize().width}
          height={getGaugeSize().height}
          needleHeightRatio={0.5}
          needleColor="#1e88e5"
          startColor="#3f51b5"
          endColor="#ff4081"
          segments={5}
          ringWidth={13}
          textColor="#ffffff"
          valueFormat=".1f"
          currentValueText="Max: ${value} mV"
          valueTextFontSize="10"
          labelFontSize="8"
          valueTextFontWeight="semibold"
          fluidWidth={false}
        />
      </div>
    </div>
  );
};

export default GaugeDisplay;
