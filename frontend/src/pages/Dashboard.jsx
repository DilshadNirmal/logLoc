import { useAuth } from "../contexts/AuthContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { effect } from "@preact/signals-react";
import ReactSpeedometer from "react-d3-speedometer";

import ThreedModel from "../canvas/ThreedModel";
import BatteryRender from "../components/BatteryRender";
import StatusBarThings from "../components/Dashboard/StatusBarThings";
import SensorButton from "../components/Dashboard/SensorButton";
import SideSelector from "../components/Dashboard/SideSelector";
import SensorCheckbox from "../components/Dashboard/SensorCheckbox";
import TimeRangeSelector from "../components/Dashboard/TimeRangeSelector";
import debounce from "lodash/debounce";
import {
  chartData,
  fetchChart,
  fetchSignalHistory,
  fetchVoltages,
  getMaxVoltage,
  getMinVoltage,
  selectedSensors,
  selectedSide,
  signalHistory,
  timeRange,
  voltageDataA,
  voltageDataB,
} from "../signals/voltage";
import ChartContainer from "../components/Chart";

const Dashboard = () => {
  const { user } = useAuth();

  const [navHeight, setNavHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [windowWidth, setWindowWidth] = useState(0);

  const getGaugeSize = () => {
    const currentWidth = window.innerWidth;

    if (currentWidth < 768) {
      return { width: 120, height: 90 };
    } else if (currentWidth < 1024) {
      return { width: 100, height: 90 };
    } else if (currentWidth < 1440) {
      return { width: 120, height: 90 };
    } else {
      return { width: 150, height: 100 };
    }
  };

  effect(() => {
    fetchVoltages();
    fetchSignalHistory();

    const voltageInterval = setInterval(fetchVoltages, 2000);
    const historyInterval = setInterval(fetchSignalHistory, 60000);

    return () => {
      clearInterval(voltageInterval);
      clearInterval(historyInterval);
    };
  });

  effect(() => {
    if (selectedSensors.value.length > 0) {
      fetchChart();
    } else {
      chartData.value = []
    }
  });

  useEffect(() => {
    const updateNavHeight = () => {
      const header = document.querySelector("header");
      if (header) {
        setNavHeight(header.clientHeight);
      }
    };

    const updateContentHeight = () => {
      const windowHeight = window.innerHeight;
      const wWidth = window.innerWidth;
      setWindowWidth(wWidth);
      const margin = 20;
      const gridGaps = 48;
      if (window.innerWidth >= 1024) {
        const newHeight = windowHeight - navHeight - gridGaps;
        setContentHeight(newHeight);
      }
    };

    // Initial update
    updateNavHeight();
    updateContentHeight();

    // Handle resize
    const handleResize = () => {
      updateNavHeight();
      updateContentHeight();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [navHeight]);

  return (
    <section
      className="cont bg-background md:!py-2 2xl:!py-4 md:!px-3 2xl:!px-4"
      style={{ marginTop: `${navHeight}px` }}
    >
      <div className="left">
        <div className="bg-secondary rounded flex flex-col md:flex-row xl:flex-row justify-around gap-2 md:gap-1 2xl:gap-2 text-text md:p-[4px_!important] lg:!p-[5px] 2xl:p-[5px]">
          <fieldset className="border border-primary/75 rounded">
            <legend className="text-xs md:text-[8px] 2xl:text-xs px-2 md:px-1 2xl:px-2 text-primary">
              A Side
            </legend>
            <StatusBarThings data={voltageDataA} side={"A"} />
          </fieldset>

          <fieldset className="border border-primary/75 rounded">
            <legend className="text-xs md:text-[8px] 2xl:text-xs px-2 md:px-1 2xl:px-2 text-primary">
              B Side
            </legend>
            <StatusBarThings data={voltageDataB} />
          </fieldset>
        </div>

        {/* 3d model */}
        <div className="bg-secondary rounded-lg">
          <ThreedModel />
        </div>

        {/* gauge for min and max */}
        <div className="bg-secondary rounded-lg flex flex-col md:flex-row xl:flex-row gap-1.5">
          {/* A side */}
          <fieldset className="border border-primary/75 rounded-lg p-1 w-full h-full">
            <legend className="px-2 text-primary text-sm md:text-[11px] 2xl:text-sm">
              A side
            </legend>

            <div className="flex flex-col md:flex-row items-center justify-evenly h-full">
              <div className="h-[65%] md:h-[55%] w-[40%] flex items-center justify-center">
                {/* <Gauge
                  value={getMinVoltage(voltageDataA.voltages)}
                  min={-10}
                  max={10}
                  label="Min"
                  units="mV"
                  // colorScheme={["#133044", "#ff4d4d"]}
                /> */}
                <ReactSpeedometer
                  value={getMinVoltage(voltageDataA)}
                  minValue={-10}
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
              <div className="h-[65%] md:h-[55%] w-[40%] flex items-center justify-center">
                <ReactSpeedometer
                  value={getMaxVoltage(voltageDataA)}
                  minValue={-10}
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
          </fieldset>

          {/* B side */}
          <fieldset className="border border-primary/75 rounded-lg p-1 w-full h-full">
            <legend className="px-2 text-primary text-sm md:text-[11px] 2xl:text-sm">
              B side
            </legend>

            <div className=" flex flex-col md:flex-row items-center justify-evenly h-full">
              <div className="h-[55%] w-[40%] flex items-center justify-center">
                <ReactSpeedometer
                  value={getMinVoltage(voltageDataB)}
                  minValue={-10}
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
                  valueTextFontSize="10"
                  valueTextFontWeight="semibold"
                  labelFontSize="8"
                  fluidWidth={false}
                />
              </div>
              <div className="h-[55%] w-[40%] flex items-center justify-center">
                <ReactSpeedometer
                  value={getMaxVoltage(voltageDataB)}
                  minValue={-10}
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
                  valueTextFontWeight="semibold"
                  labelFontSize="8"
                  fluidWidth={false}
                />
              </div>
            </div>
          </fieldset>
        </div>

        {/* battery and Signal */}
        <div className="flex flex-col md:flex-row lg:flex-row gap-2">
          <div className="w-full h-[400px] sm:w-4/12 sm:h-full bg-secondary text-text rounded-lg p-1">
            <h4 className="mt-4 md:mt-2 mb-5 sm:mb-2 ml-4 text-lg md:text-sm">
              battery Status
            </h4>

            {/* battery will be down here */}
            <div className="w-full h-10/12 sm:h-9/12 flex sm:flex-col mt-10 md:mt-0 justify-around">
              <BatteryRender
                orient={windowWidth >= 1024 ? "height" : "width"}
                value={voltageDataA.value.batteryStatus}
              />
              <BatteryRender
                orient={windowWidth >= 1024 ? "height" : "width"}
                value={voltageDataB.value.batteryStatus}
              />
            </div>
          </div>
          <div className="bg-secondary text-text rounded-lg p-1 md:p-0.5 flex-1">
            <h4 className=" mt-2 mb-15 md:mt-1.5 md:mb-2.5 2xl:mt-2 2xl:mb-3 ml-4 text-sm md:text-xs 2xl:text-sm">
              Signal Strength
            </h4>
            <div className="h-9/12 px-3 flex flex-col md:flex-row justify-center items-center gap-10 md:gap-1">
              <div className="flex flex-col justify-center items-center gap-4 h-[100%] w-[35%]">
                <div className="flex items-end justify-center gap-1">
                  {[1, 2, 3].map((bar) => {
                    let barColor;
                    const signalStrength = voltageDataA.value.signalStrength;

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
                  {voltageDataA.value.signalStrength}%
                </span>
              </div>
              <div className="w-[80%] md:w-[60%] h-[90%]">
                <h5 className="text-base md:text-[10px] 2xl:text-sm text-text/85 font-normal tracking-wide mb-2 md:mb-1 2xl:mb-1">
                  Signal strength - 12 Hrs
                </h5>
                <div className="grid grid-cols-4 2xl:grid-rows-3 gap-1">
                  {signalHistory.value.map((item, index) => (
                    <div
                      key={index}
                      className="bg-background/20 rounded-lg p-1.5 lg:p-1 lg:py-1.5 2xl:p-2 flex flex-col items-center justify-end"
                    >
                      <div className="flex items-end mb-2 lg:mb-1 2xl:mb-2">
                        {[...Array(item.strength)].map((_, i) => (
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
          </div>
        </div>
      </div>
      <div className="right">
        {/* voltage grid */}
        <div className="bg-secondary/50 text-text rounded-lg p-2 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-2 gap-4">
          <fieldset className="border border-primary/75 rounded-lg p-2 h-fit">
            <legend className="px-2 text-primary text-base md:text-xs font-medium tracking-wider">
              A Side
            </legend>
            <div className="grid grid-cols-5 md:grid-cols-5 lg:grid-cols-4 2xl:grid-cols-4 gap-1.5">
              {[...Array(20)].map((_, index) => {
                const sensorId = index + 1;
                const voltage = voltageDataA.value.voltages[`v${sensorId}`];
                return (
                  <SensorButton
                    key={sensorId}
                    sensorId={sensorId}
                    voltage={voltage}
                  />
                );
              })}
            </div>
          </fieldset>
          <fieldset className="border border-primary rounded-lg p-2 h-fit">
            <legend className="px-2 text-primary text-base md:text-xs font-medium tracking-wider">
              B Side
            </legend>
            <div className="grid grid-cols-5 md:grid-cols-5 lg:grid-cols-4  2xl:grid-cols-4 gap-1.5">
              {[...Array(20)].map((_, index) => {
                const sensorId = index + 21;
                const voltage = voltageDataB.value.voltages[`v${sensorId}`];
                return (
                  <SensorButton
                    key={sensorId}
                    sensorId={sensorId}
                    voltage={voltage}
                  />
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* chart */}
        <div className="bg-secondary p-2 rounded-lg">
          <div className="flex flex-col md:flex-row md:justify-around items-center gap-3 mb-2">
            <SideSelector />

            {selectedSide.value && <SensorCheckbox />}

            <TimeRangeSelector timeRange={timeRange} />
          </div>
          <div className="chart-container">
            <ChartContainer data={chartData} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
