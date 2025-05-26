import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
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
  currentPage,
  fetchChart,
  fetchSignalHistory,
  fetchVoltages,
  selectedSensors,
  selectedSide,
  signalHistory,
  timeRange,
  voltageDataA,
  voltageDataB,
} from "../signals/voltage";
import ChartContainer from "../components/Chart";
import SignalStrength from "../components/Dashboard/SignalStrength";
import GaugeDisplay from "../components/Dashboard/GaugeDisplay";

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

  useEffect(() => {
    fetchVoltages();
    fetchSignalHistory();
    fetchChart("dashboard");

    const voltageInterval = setInterval(fetchVoltages, 2000);
    const historyInterval = setInterval(fetchSignalHistory, 60000);
    const debouncedFetchChart = debounce(() => fetchChart("dashboard"), 500);
    const unsubscribeSensors = selectedSensors.subscribe(debouncedFetchChart);
    const unsubscribeSide = selectedSide.subscribe(debouncedFetchChart);
    const unsubscribeTimeRange = timeRange.subscribe(debouncedFetchChart);

    return () => {
      clearInterval(voltageInterval);
      clearInterval(historyInterval);
      debouncedFetchChart.cancel();
      unsubscribeSensors();
      unsubscribeSide();
      unsubscribeTimeRange();
    };
  }, []);

  useEffect(() => {
    if (selectedSensors.value.length > 0) {
    } else {
      chartData.value = [];
    }
  }, [selectedSensors.value]);

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
        <div className="bg-secondary rounded flex flex-col md:flex-row xl:flex-row justify-around gap-2 md:gap-1 2xl:gap-2 text-text md:p-[3px_!important] lg:!p-[5px] 2xl:p-[5px]">
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
        <div className="bg-secondary rounded-lg flex flex-col md:flex-row xl:flex-row gap-1.5 md:gap-1 xl:gap-1.5">
          {/* A side */}
          <fieldset className="border border-primary/75 rounded-lg p-1 w-full h-full">
            <legend className="px-2 md:px-1.5 xl:px-2 text-primary text-sm md:text-[10px] 2xl:text-sm">
              A side
            </legend>

            <GaugeDisplay data={voltageDataA} getGaugeSize={getGaugeSize} />
          </fieldset>

          {/* B side */}
          <fieldset className="border border-primary/75 rounded-lg p-1 w-full h-full">
            <legend className="px-2 md:px-1.5 xl:px-2 text-primary text-sm md:text-[10px] 2xl:text-sm">
              B side
            </legend>

            <GaugeDisplay data={voltageDataB} getGaugeSize={getGaugeSize} />
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
                value={voltageDataA}
              />
              <BatteryRender
                orient={windowWidth >= 1024 ? "height" : "width"}
                value={voltageDataB}
              />
            </div>
          </div>
          <div className="bg-secondary text-text rounded-lg p-1 md:p-0.5 flex-1">
            <h4 className=" mt-2 mb-15 md:mt-1.5 md:mb-2.5 2xl:mt-2 2xl:mb-3 ml-4 text-sm md:text-xs 2xl:text-sm">
              Signal Strength
            </h4>
            <SignalStrength
              data={voltageDataA}
              signalHistoryData={signalHistory}
            />
          </div>
        </div>
      </div>
      <div className="right">
        {/* voltage grid */}
        <div className="bg-secondary/50 text-text rounded-lg p-2 md:p-1 xl:p-2 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-2 gap-4 md:gap-1 2xl:gap-4">
          <fieldset className="border border-primary/75 rounded-lg p-2 md:p-1 xl:p-2 h-fit">
            <legend className="px-2 text-primary text-base md:text-xs font-medium tracking-wider">
              A Side
            </legend>
            <div className="grid grid-cols-5 md:grid-cols-5 2xl:grid-cols-4 gap-1.5 md:gap-1 xl:gap-1.5">
              {Array.from({ length: 20 }, (_, index) => {
                const sensorId = index + 1;
                // const voltage = voltageDataA.value.voltages[`v${sensorId}`];
                return (
                  <SensorButton
                    key={sensorId}
                    sensorId={sensorId}
                    voltage={voltageDataA}
                  />
                );
              })}
            </div>
          </fieldset>
          <fieldset className="border border-primary rounded-lg p-2 md:p-1 xl:p-2 h-fit">
            <legend className="px-2 text-primary text-base md:text-xs font-medium tracking-wider">
              B Side
            </legend>
            <div className="grid grid-cols-5 md:grid-cols-5 2xl:grid-cols-4 gap-1.5 md:gap-1 xl:gap-1.5">
              {Array.from({ length: 20 }, (_, index) => {
                const sensorId = index + 21;
                // const voltage = voltageDataB.value.voltages[`v${sensorId}`];
                return (
                  <SensorButton
                    key={sensorId}
                    sensorId={sensorId}
                    voltage={voltageDataB}
                  />
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* chart */}
        <div className="bg-secondary p-2 md:p-1.5 xl:p-2 rounded-lg">
          <div className="flex flex-col md:flex-row md:justify-around items-center gap-3 md:gap-1 xl:gap-3 mb-2 md:mb-1 xl:mb-2">
            <SideSelector />

            <SensorCheckbox />

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
