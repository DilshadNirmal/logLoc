import { useAuth } from "../contexts/AuthContext";
import { useEffect, useRef, useState } from "react";
import axiosInstance from "../lib/axios";

import ThreedModel from "../canvas/ThreedModel";
import Chart from "../components/Chart";
import BatteryRender from "../components/BatteryRender";
import StatusBarThings from "../components/Dashboard/StatusBarThings";
import SensorButton from "../components/Dashboard/SensorButton";
import SideSelector from "../components/Dashboard/SideSelector";
import SensorCheckbox from "../components/Dashboard/SensorCheckbox";
import TimeRangeSelector from "../components/Dashboard/TimeRangeSelector";
import Gauge from "../components/Gauge";

const Dashboard = () => {
  const { user } = useAuth();
  const [voltageDataA, setVoltageDataA] = useState({
    voltages: {},
    batteryStatus: 0,
    signalStrength: 0,
    timestamp: null,
  });

  const [voltageDataB, setVoltageDataB] = useState({
    voltages: {},
    batteryStatus: 0,
    signalStrength: 0,
    timestamp: null,
  });
  // const [selectedSensor, setSelectedSensor] = useState(1);
  const [selectedSensors, setSelectedSensors] = useState([1]);
  const [selectedSide, setSelectedSide] = useState("A");
  const [timeRange, setTimeRange] = useState("1h");
  const [chartData, setChartData] = useState("");
  const [navHeight, setNavHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [windowWidth, setWindowWidth] = useState(0);
  const chartRef = useRef();

  const fetchVoltages = async () => {
    try {
      const response = await axiosInstance("/voltage-history");
      if (response.data && response.data.length > 0) {
        const group1Data = response.data.find((d) => d.sensorGroup === "1-20");
        const group2Data = response.data.find((d) => d.sensorGroup === "21-40");

        if (group1Data) {
          setVoltageDataA({
            voltages: group1Data.voltages || {},
            batteryStatus: group1Data.batteryStatus || 0,
            signalStrength: group1Data.signalStrength || -100,
            timestamp: new Date(group1Data.timestamp || 0),
          });
        }

        if (group2Data) {
          setVoltageDataB({
            voltages: group2Data.voltages || {},
            batteryStatus: group2Data.batteryStatus || 0,
            signalStrength: group2Data.signalStrength || -100,
            timestamp: new Date(group2Data.timestamp || 0),
          });
        }
      }
    } catch (error) {
      console.error("Error fetching voltages:", error);
    }
  };

  const fetchChart = async () => {
    try {
      if (selectedSensors.length === 0) {
        setChartData([]);
        return;
      }

      const response = await axiosInstance.get("/voltage-data", {
        params: {
          sensorId: selectedSensors,
          timeRange: parseInt(timeRange), // Convert "1h" to 1
        },
      });

      if (response.data && Array.isArray(response.data)) {
        // Filter out any sensors with empty data
        const validData = response.data.filter(
          (sensor) => sensor.data && sensor.data.length > 0
        );
        setChartData(validData);
      } else {
        setChartData([]);
      }
    } catch (error) {
      console.error("Error loading chart:", error);
      setChartData([]);
    }
  };

  const getVoltageClass = (value) => {
    if (value === undefined) return "bg-secondary/20 text-text/50";
    if (value >= 7) return "bg-secondary text-red-400";
    if (value <= 3) return "bg-secondary text-blue-400";
    return "bg-secondary text-text";
  };

  useEffect(() => {
    fetchVoltages();
    const interval = setInterval(fetchVoltages, 500);
    return () => clearInterval(interval);
  }, [selectedSensors, timeRange, voltageDataA, voltageDataB]);

  useEffect(() => {
    fetchChart();
  }, [selectedSensors, timeRange]);

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
            <StatusBarThings data={voltageDataA} />
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
        <div className="bg-secondary rounded-lg flex flex-col md:flex-row xl:flex-row gap-2">
          {/* A side */}
          <fieldset className="border border-primary/75 rounded-lg p-1 w-full h-full">
            <legend className="px-2 text-primary text-sm md:text-xs 2xl:text-sm">
              A side
            </legend>

            <div className="flex items-center justify-around h-full">
              <div className="h-[85%] w-[45%]">
                <Gauge
                  // value={getMinVoltage(voltageDataA.voltages)}
                  value={10}
                  min={-10}
                  max={10}
                  label="Min"
                  units="mV"
                  // colorScheme={["#133044", "#ff4d4d"]}
                />
              </div>
              <div className="h-[85%] w-[45%]">
                <Gauge value={6} min={-10} max={10} label="Max" units="mV" />
              </div>
            </div>
          </fieldset>

          {/* B side */}
          <fieldset className="border border-primary/75 rounded-lg p-1 w-full h-full">
            <legend className="px-2 text-primary text-sm md:text-xs 2xl:text-sm">
              B side
            </legend>

            <div className=" flex items-center justify-center gap-2 h-full">
              <div className="h-[85%] w-[45%]">
                <Gauge
                  // value={getMinVoltage(voltageDataA.voltages)}
                  value={-10}
                  min={-10}
                  max={10}
                  label="Min"
                  units="mV"
                  // colorScheme={["#133044", "#ff4d4d"]}
                />
              </div>
              <div className="h-[85%] w-[45%]">
                <Gauge value={6} min={-10} max={10} label="Max" units="mV" />
              </div>
            </div>
          </fieldset>
        </div>

        {/* battery and Signal */}
        <div className="flex flex-col md:flex-row lg:flex-row gap-2">
          <div className="w-full h-full sm:w-4/12 bg-secondary text-text rounded-lg p-1">
            <h4 className=" mt-2 mb-3 sm:mb-2 ml-4 text-sm">battery Status</h4>

            {/* battery will be down here */}
            <div className="w-full h-8/12 sm:h-9/12 flex sm:flex-col justify-around">
              <BatteryRender
                orient={windowWidth >= 1024 ? "height" : "width"}
                value={voltageDataA.batteryStatus}
              />
              <BatteryRender
                orient={windowWidth >= 1024 ? "height" : "width"}
                value={voltageDataB.batteryStatus}
              />
            </div>
          </div>
          <div className="bg-secondary text-text rounded-lg p-1 md:p-0.5 flex-1">
            <h4 className=" mt-2 mb-3 md:mt-1.5 md:mb-2.5 2xl:mt-2 2xl:mb-3 ml-4 text-sm md:text-xs 2xl:text-sm">
              Signal Strength
            </h4>
            <div className="h-9/12 px-3 flex">
              <div className="flex flex-col justify-center items-center h-[100%] w-[35%]">
                <div className="flex items-end justify-center gap-1">
                  {[1, 2, 3].map((bar) => (
                    <div
                      key={bar}
                      className="w-3.5 md:w-3 2xl:w-3.5 transition-all duration-300"
                      style={{
                        height: `${bar * 14}px`,
                        backgroundColor:
                          voltageDataA.signalStrength >= 25 * bar
                            ? "#ffdd00"
                            : "#3ff45f",
                      }}
                    />
                  ))}
                </div>
                <span className="text-3xl font-bold text-center">
                  {voltageDataA.signalStrength}%
                </span>
              </div>
              <div className="w-[60%]">
                <h5 className="text-base md:text-[10px] 2xl:text-sm text-text/85 font-normal tracking-wide mb-2 md:mb-1 2xl:mb-1">
                  Signal strength - 12 Hrs
                </h5>
                <div className="grid grid-cols-4 2xl:grid-rows-3 gap-1">
                  {[
                    { time: "09:00 AM", strength: 2 },
                    { time: "10:00 AM", strength: 4 },
                    { time: "11:00 AM", strength: 2 },
                    { time: "12:00 PM", strength: 4 },
                    { time: "01:00 PM", strength: 1 },
                    { time: "02:00 PM", strength: 2 },
                    { time: "03:00 PM", strength: 3 },
                    { time: "04:00 PM", strength: 4 },
                    { time: "05:00 PM", strength: 4 },
                    { time: "06:00 PM", strength: 3 },
                    { time: "07:00 PM", strength: 1 },
                    { time: "08:00 PM", strength: 2 },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="bg-background/20 rounded-lg p-2 lg:p-1 lg:py-1.5 2xl:py-2 flex flex-col items-center justify-end"
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
                const voltage = voltageDataA.voltages[`v${sensorId}`];
                return (
                  <SensorButton
                    key={sensorId}
                    sensorId={sensorId}
                    voltage={voltage}
                    isSelected={selectedSensors.includes(sensorId)}
                    onClick={() => handleSensorSelection(sensorId)}
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
                const voltage = voltageDataB.voltages[`v${sensorId}`];
                return (
                  <SensorButton
                    key={sensorId}
                    sensorId={sensorId}
                    voltage={voltage}
                    isSelected={selectedSensors.includes(sensorId)}
                    onClick={() => handleSensorSelection(sensorId)}
                  />
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* chart */}
        <div className="bg-secondary p-2 rounded-lg">
          <div className="flex flex-col md:flex-row md:justify-around items-center gap-3 mb-2">
            <SideSelector
              selectedSide={selectedSide}
              selectedSensors={selectedSensors}
              setSelectedSide={setSelectedSide}
              setSelectedSensors={setSelectedSensors}
            />

            {selectedSide && (
              <div className="grid grid-cols-10 place-items-center gap-1 md:gap-0.5 2xl:gap-1 p-2 md:p-1 2xl:p-2 rounded-lg">
                {[...Array(20)].map((_, index) => {
                  const sensorId =
                    selectedSide === "A" ? index + 1 : index + 21;
                  return (
                    <SensorCheckbox
                      key={sensorId}
                      sensorId={sensorId}
                      isChecked={selectedSensors.includes(sensorId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSensors([...selectedSensors, sensorId]);
                        } else {
                          setSelectedSensors(
                            selectedSensors.filter((id) => id !== sensorId)
                          );
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}

            <TimeRangeSelector
              timeRange={timeRange}
              setTimeRange={setTimeRange}
            />
          </div>
          <div className="chart-container">
            {chartData.length > 0 ? (
              <Chart
                ref={chartRef}
                data={chartData}
                key={`chart-${JSON.stringify(chartData)}`}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-text">
                no voltage data to display chart...
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
