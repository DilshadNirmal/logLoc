import { useAuth } from "../contexts/AuthContext";
import { useEffect, useRef, useState } from "react";
import axiosInstance from "../lib/axios";
import GaugeComponent from "react-gauge-component";

import ThreedModel from "../canvas/ThreedModel";
import Chart from "../components/Chart";
const Dashboard = () => {
  const { user } = useAuth();
  const [voltageData, setVoltageData] = useState({
    voltages: {},
    batteryStatus: 0,
    signalStrength: 0,
    timestamp: null,
  });
  // const [selectedSensor, setSelectedSensor] = useState(1);
  const [selectedSensors, setSelectedSensors] = useState([]);
  const [selectedSide, setSelectedSide] = useState("A");
  const [timeRange, setTimeRange] = useState("1h");
  const [chartData, setChartData] = useState("");
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const chartRef = useRef();
  const chartContainerRef = useRef(null);

  const [navHeight, setNavHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  const fetchVoltages = async () => {
    try {
      const response = await axiosInstance("/voltage-history");
      if (response.data && response.data.length > 0) {
        const group1Data = response.data.find((d) => d.sensorGroup === "1-20");
        const group2Data = response.data.find((d) => d.sensorGroup === "21-40");

        const latestVoltages = {
          ...(group1Data?.voltages || {}),
          ...(group2Data?.voltages || {}),
        };

        setVoltageData({
          voltages: latestVoltages,
          batteryStatus: Math.max(
            group1Data?.batteryStatus || 0,
            group2Data?.batteryStatus || 0
          ),
          signalStrength: Math.max(
            group1Data?.signalStrength || -100,
            group2Data?.signalStrength || -100
          ),
          timestamp: new Date(
            Math.max(
              new Date(group1Data?.timestamp || 0),
              new Date(group2Data?.timestamp || 0)
            )
          ),
        });
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
    const interval = setInterval(fetchVoltages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchChart();
  }, [selectedSensors, timeRange]);

  useEffect(() => {
    const updateDimensions = () => {
      if (chartContainerRef.current) {
        const newWidth = chartContainerRef.current.clientWidth;
        const newHeight = chartContainerRef.current.clientHeight;

        // Only update if dimensions actually changed
        if (newWidth !== width || newHeight !== height) {
          setWidth(newWidth);
          setHeight(newHeight);
        }
      }
    };

    updateDimensions();
    let timeoutId;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDimensions, 100);
    };

    const resizeObserver = new ResizeObserver(debouncedUpdate);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const updateNavHeight = () => {
      const header = document.querySelector("header");
      if (header) {
        setNavHeight(header.offsetHeight);
      }
    };

    const updateContentHeight = () => {
      const windowHeight = window.innerHeight;
      const margin = 20;
      const gridGaps = 48;
      if (window.innerWidth >= 1024) {
        const newHeight = windowHeight - navHeight - gridGaps;
        setContentHeight(newHeight);
      }
    };

    setTimeout(() => {
      updateNavHeight();
      updateContentHeight();
    }, 100);

    // Add resize listener
    window.addEventListener("resize", () => {
      updateNavHeight();
      updateContentHeight();
    });
    return () => {
      window.removeEventListener("resize", updateNavHeight);
      window.removeEventListener("resize", updateContentHeight);
    };
  }, [navHeight]);

  return (
    <section
      className="bg-background min-h-[100dvh] w-full overflow-x-hidden pb-4 sm:pb-1"
      style={{ marginTop: `${navHeight}px` }}
    >
      {/* content grid */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-3 mx-4 mt-4 sm:mt-5 sm:mb-2"
        style={{
          height: window.innerWidth >= 1024 ? `${contentHeight}px` : "auto",
        }}
      >
        {/* left column */}
        <div className="flex flex-col justify-between">
          {/* status bar */}
          <div
            className="bg-secondary text-text rounded-lg p-2"
            style={{
              height:
                window.innerWidth >= 1024
                  ? `${contentHeight * 0.08}px`
                  : "auto",
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:gap-2 sm:gap-2 gap-4">
              <fieldset className="border border-primary/75 rounded-lg p-2 py-1">
                <legend className="px-2 text-primary lg:text-xs text-xs xl:text-sm font-semibold tracking-wider">
                  A Side
                </legend>
                <div className="flex justify-between text-sm lg:text-xs sm:text-xs">
                  <div className="flex items-center gap-1">
                    Active:
                    <span className="text-primary font-medium">
                      {
                        Object.entries(voltageData.voltages).filter(
                          ([key, value]) =>
                            parseInt(key.slice(1)) <= 20 && value !== undefined
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    Inactive:
                    <span className="text-primary font-medium">
                      {
                        Object.entries(voltageData.voltages).filter(
                          ([key, value]) =>
                            parseInt(key.slice(1)) <= 20 && value === undefined
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    Lt.Upd:
                    <span className="text-primary font-medium">
                      {voltageData.timestamp?.toLocaleString() || "--:--:--"}
                    </span>
                  </div>
                </div>
              </fieldset>

              <fieldset className="border border-primary rounded-lg p-2 py-1">
                <legend className="px-2 text-primary text-sm lg:text-xs sm:text-xs font-semibold tracking-wider">
                  B Side
                </legend>
                <div className="flex justify-between text-sm lg:text-xs sm:text-xs">
                  <div className="flex items-center gap-1">
                    Active:
                    <span className="text-primary font-medium">
                      {
                        Object.entries(voltageData.voltages).filter(
                          ([key, value]) =>
                            parseInt(key.slice(1)) > 20 && value !== undefined
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    Inactive:
                    <span className="text-primary font-medium">
                      {
                        Object.entries(voltageData.voltages).filter(
                          ([key, value]) =>
                            parseInt(key.slice(1)) > 20 && value === undefined
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    Lt.Upd:
                    <span className="text-primary font-medium">
                      {voltageData.timestamp?.toLocaleString() || "--:--:--"}
                    </span>
                  </div>
                </div>
              </fieldset>
            </div>
          </div>

          {/* 3d model */}
          <div
            className=" bg-secondary text-text rounded-lg p-2 md:h-3/5 w-full"
            style={{
              height:
                window.innerWidth >= 1024
                  ? `${contentHeight * 0.35}px`
                  : "225px",
            }}
          >
            <ThreedModel />
          </div>

          {/* split column 1 */}
          <div
            className=" bg-secondary rounded-lg p-4 text-text grid lg:grid-cols-2 sm:grid-cols-2 gap-2 overflow-hidden"
            style={{
              height:
                window.innerWidth >= 1024
                  ? `${contentHeight * 0.25}px`
                  : "auto",
            }}
          >
            <fieldset className="border border-primary/75 rounded-lg p-1">
              <legend className="px-2 text-primary text-sm lg:text-xs sm:text-xs font-semibold">
                A side
              </legend>

              {/* chart for max and min */}
              <div className="flex sm:flex-row flex-col items-center justify-center w-full h-full gap-2">
                <div className="w-[90%] lg:w-[45%] sm:w-[48%] h-[100%]">
                  <h3 className="text-xs font-semibold tracking-wider text-text/75 text-center mb-2">
                    Maximum Value
                  </h3>
                  <GaugeComponent
                    value={Math.max(
                      ...Object.entries(voltageData.voltages)
                        .filter(([key]) => parseInt(key.slice(1)) <= 20)
                        .map(([_, value]) => value || 0)
                    )}
                    arc={{
                      width: 0.3,
                      padding: 0.005,
                      cornerRadius: 1,
                      gradient: false,
                      subArcs: [
                        {
                          length:
                            (Math.max(
                              ...Object.entries(voltageData.voltages)
                                .filter(([key]) => parseInt(key.slice(1)) <= 20)
                                .map(([_, value]) => value || 0)
                            ) /
                              10) *
                            100,
                          color: "#409fff",
                        },
                        {
                          length:
                            100 -
                            (Math.max(
                              ...Object.entries(voltageData.voltages)
                                .filter(([key]) => parseInt(key.slice(1)) <= 20)
                                .map(([_, value]) => value || 0)
                            ) /
                              10) *
                              100,
                          color: "#5c5c5c99",
                        },
                      ],
                    }}
                    labels={{
                      valueLabel: {
                        formatTextValue: (value) => value.toFixed(2) + " mV",
                        style: { fontSize: 15, fill: "#e9ebed" },
                      },
                      tickLabels: {
                        type: "outer",
                        ticks: [
                          { value: 0 },
                          { value: 2 },
                          { value: 4 },
                          { value: 6 },
                          { value: 8 },
                          { value: 10 },
                        ],
                        defaultTickValueConfig: {
                          formatTextValue: (value) => value,
                          style: { fill: "#e9ebed", fontSize: 7 },
                        },
                      },
                    }}
                    maxValue={10}
                  />
                </div>
                <div className="w-[90%] lg:w-[45%] sm:w-[48%] h-[100%]">
                  <h3 className="text-xs font-semibold tracking-wider text-text/75 text-center mb-2">
                    Minimum Value
                  </h3>
                  <GaugeComponent
                    value={Math.min(
                      ...Object.entries(voltageData.voltages)
                        .filter(([key]) => parseInt(key.slice(1)) <= 20)
                        .map(([_, value]) => value || 0)
                    )}
                    arc={{
                      width: 0.3,
                      padding: 0.005,
                      cornerRadius: 1,
                      gradient: false,
                      subArcs: [
                        {
                          length:
                            (Math.max(
                              ...Object.entries(voltageData.voltages)
                                .filter(([key]) => parseInt(key.slice(1)) <= 20)
                                .map(([_, value]) => value || 0)
                            ) /
                              10) *
                            100,
                          color: "#409fff",
                        },
                        {
                          length:
                            100 -
                            (Math.max(
                              ...Object.entries(voltageData.voltages)
                                .filter(([key]) => parseInt(key.slice(1)) <= 20)
                                .map(([_, value]) => value || 0)
                            ) /
                              10) *
                              100,
                          color: "#5c5c5c99",
                        },
                      ],
                    }}
                    labels={{
                      valueLabel: {
                        formatTextValue: (value) => value.toFixed(2) + " mV",
                        style: { fontSize: 15, fill: "#e9ebed" },
                      },
                      tickLabels: {
                        type: "outer",
                        ticks: [
                          { value: 0 },
                          { value: 2 },
                          { value: 4 },
                          { value: 6 },
                          { value: 8 },
                          { value: 10 },
                        ],
                        defaultTickValueConfig: {
                          formatTextValue: (value) => value,
                          style: { fill: "#e9ebed", fontSize: 7 },
                        },
                      },
                    }}
                    maxValue={10}
                  />
                </div>
              </div>
            </fieldset>
            <fieldset className="border border-primary/75 rounded-lg p-1">
              <legend className="px-2 text-primary text-sm lg:text-xs sm:text-xs font-semibold">
                B side
              </legend>

              {/* chart for max and min */}
              <div className="flex sm:flex-row flex-col items-center justify-center w-full h-full gap-2">
                <div className="w-[90%] lg:w-[45%] sm:w-[48%] h-[100%]">
                  <h3 className="text-xs font-semibold tracking-wider text-text/75 text-center mb-2">
                    Maximum Value
                  </h3>
                  <GaugeComponent
                    value={Math.max(
                      ...Object.entries(voltageData.voltages)
                        .filter(([key]) => parseInt(key.slice(1)) > 20)
                        .map(([_, value]) => value || 0)
                    )}
                    arc={{
                      width: 0.3,
                      padding: 0.005,
                      cornerRadius: 1,
                      gradient: false,
                      subArcs: [
                        {
                          length:
                            (Math.max(
                              ...Object.entries(voltageData.voltages)
                                .filter(([key]) => parseInt(key.slice(1)) > 20)
                                .map(([_, value]) => value || 0)
                            ) /
                              10) *
                            100,
                          color: "#409fff",
                        },
                        {
                          length:
                            100 -
                            (Math.max(
                              ...Object.entries(voltageData.voltages)
                                .filter(([key]) => parseInt(key.slice(1)) > 20)
                                .map(([_, value]) => value || 0)
                            ) /
                              10) *
                              100,
                          color: "#5c5c5c99",
                        },
                      ],
                    }}
                    labels={{
                      valueLabel: {
                        formatTextValue: (value) => value.toFixed(2) + " mV",
                        style: { fontSize: 15, fill: "#e9ebed" },
                      },
                      tickLabels: {
                        type: "outer",
                        ticks: [
                          { value: 0 },
                          { value: 2 },
                          { value: 4 },
                          { value: 6 },
                          { value: 8 },
                          { value: 10 },
                        ],
                        defaultTickValueConfig: {
                          formatTextValue: (value) => value,
                          style: { fill: "#e9ebed", fontSize: 7 },
                        },
                      },
                    }}
                    maxValue={10}
                  />
                </div>
                <div className="w-[90%] lg:w-[45%] sm:w-[48%] h-[100%]">
                  <h3 className="text-xs font-semibold tracking-wider text-text/75 text-center mb-2">
                    Minimum Value
                  </h3>
                  <GaugeComponent
                    value={Math.min(
                      ...Object.entries(voltageData.voltages)
                        .filter(([key]) => parseInt(key.slice(1)) > 20)
                        .map(([_, value]) => value || 0)
                    )}
                    arc={{
                      width: 0.3,
                      padding: 0.005,
                      cornerRadius: 1,
                      gradient: false,
                      subArcs: [
                        {
                          length:
                            (Math.max(
                              ...Object.entries(voltageData.voltages)
                                .filter(([key]) => parseInt(key.slice(1)) > 20)
                                .map(([_, value]) => value || 0)
                            ) /
                              10) *
                            100,
                          color: "#409fff",
                        },
                        {
                          length:
                            100 -
                            (Math.max(
                              ...Object.entries(voltageData.voltages)
                                .filter(([key]) => parseInt(key.slice(1)) > 20)
                                .map(([_, value]) => value || 0)
                            ) /
                              10) *
                              100,
                          color: "#5c5c5c99",
                        },
                      ],
                    }}
                    labels={{
                      valueLabel: {
                        formatTextValue: (value) => value.toFixed(2) + " mV",
                        style: { fontSize: 15, fill: "#e9ebed" },
                      },
                      tickLabels: {
                        type: "outer",
                        ticks: [
                          { value: 0 },
                          { value: 2 },
                          { value: 4 },
                          { value: 6 },
                          { value: 8 },
                          { value: 10 },
                        ],
                        defaultTickValueConfig: {
                          formatTextValue: (value) => value,
                          style: { fill: "#e9ebed", fontSize: 7 },
                        },
                      },
                    }}
                    maxValue={10}
                  />
                </div>
              </div>
            </fieldset>
          </div>

          {/* split column 2 */}
          <div
            className="grid grid-cols-1 md:grid-cols-8 gap-4 text-text"
            style={{
              height:
                window.innerWidth >= 1024
                  ? `${contentHeight * 0.275}px`
                  : "auto",
            }}
          >
            <div className="sm:col-span-3 w-full bg-secondary rounded-lg p-5 overflow-hidden">
              <h3 className="text-sm font-medium text-text mb-4">
                Minimum Value
              </h3>

              {/* react gauge component here */}
              <GaugeComponent
                value={Math.min(
                  ...Object.values(voltageData.voltages).filter(
                    (v) => v !== undefined
                  ),
                  10
                )}
                type="semicircle"
                arc={{
                  width: 0.3,
                  padding: 0.005,
                  cornerRadius: 1,
                  gradient: false,
                  subArcs: [
                    {
                      length:
                        (Math.min(
                          ...Object.values(voltageData.voltages).filter(
                            (v) => v !== undefined
                          ),
                          10
                        ) /
                          10) *
                        100,
                      color: "#409fff",
                    },
                    {
                      length:
                        100 -
                        (Math.min(
                          ...Object.values(voltageData.voltages).filter(
                            (v) => v !== undefined
                          ),
                          10
                        ) /
                          10) *
                          100,
                      color: "#5c5c5c99",
                    },
                  ],
                }}
                pointer={{
                  type: "arrow",
                  color: "#409fff",
                  length: 0.8,
                  width: 15,
                  elastic: true,
                }}
                labels={{
                  valueLabel: {
                    formatTextValue: (value) => value + " mV",
                    style: { fontSize: 25, fill: "#e9ebed" },
                  },
                  tickLabels: {
                    type: "outer",
                    ticks: [
                      { value: 0 },
                      { value: 2 },
                      { value: 4 },
                      { value: 6 },
                      { value: 8 },
                      { value: 10 },
                    ],
                  },
                }}
                maxValue={10}
                minValue={0}
              />
            </div>
            <div className="relative sm:col-span-5 bg-secondary rounded-lg p-5 lg:p-4 overflow-hidden ">
              <h3 className="text-sm font-medium text-text/80">
                Signal Strength
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="h-full">
                  <div className="flex flex-col gap-4 justify-center items-center mt-8">
                    <div className="flex items-end justify-center gap-1">
                      {[1, 2, 3].map((bar) => (
                        <div
                          key={bar}
                          className="w-4 transition-all duration-300"
                          style={{
                            height: `${bar * 14}px`,
                            backgroundColor:
                              voltageData.signalStrength >= 25 * bar
                                ? "#ffdd00"
                                : "#3ff45f",
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-4xl font-bold text-center">
                      {voltageData.signalStrength}%
                    </span>
                  </div>
                </div>
                {/* <hr className="absolute h-[75%] sm:h-[80%] w-px bg-text/70 -top-[7%] sm:top-[15%] left-1/2 transform -translate-x-5 rotate-90 sm:rotate-0" /> */}
                <div className="relative">
                  <h4 className="absolute bottom-5/7 sm:bottom-4/7 right-6/7 sm:right-4/5 -rotate-90 w-[25ch] text-xs font-normal tracking-wide">
                    Signal strength - 12 Hrs
                  </h4>
                  <div className="grid grid-cols-4 sm:grid-rows-3 gap-1">
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
                        className="bg-background/20 rounded-lg p-2 lg:p-1 lg:py-2 flex flex-col items-center justify-end"
                      >
                        <div className="flex items-end mb-2">
                          {[...Array(item.strength)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 mx-[1px]"
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
                        <span className="text-xs lg:text-[7px] text-text/75">
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

        {/* right column */}
        <div className="flex flex-col gap-3">
          {/* voltage grid */}
          <div className="bg-secondary/50 rounded-lg p-2 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-2 lg:gap-2">
            <div className="space-y-2">
              <fieldset className="border border-primary/75 rounded-lg p-2">
                <legend className="px-2 text-primary text-sm sm:text-xs lg:text-xs tracking-wider font-semibold">
                  A Side
                </legend>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-2 lg:gap-1.5">
                  {[...Array(20)].map((_, index) => {
                    const sensorId = index + 1;
                    const voltage = voltageData.voltages[`v${sensorId}`];
                    return (
                      <button
                        key={sensorId}
                        onClick={() => {
                          if (selectedSensors.includes(sensorId)) {
                            setSelectedSensors(
                              selectedSensors.filter((id) => id !== sensorId)
                            );
                          } else {
                            setSelectedSensors([...selectedSensors, sensorId]);
                            setSelectedSide(sensorId <= 20 ? "A" : "B");
                          }
                        }}
                        className={`${getVoltageClass(voltage)}
                          p-2 sm:p-3 rounded-lg transition-all hover:scale-105
                          ${
                            selectedSensors.includes(sensorId)
                              ? "ring-2 ring-primary"
                              : ""
                          }`}
                      >
                        <div className="text-xs font-medium opacity-70">
                          S{sensorId}
                        </div>
                        <div className="text-lg sm:text-sm lg:text-sm font-semibold">
                          {voltage?.toFixed(2) || "--"}
                        </div>
                        <div className="text-xs opacity-70">mV</div>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
            <div className="space-y-2">
              <fieldset className="border border-primary rounded-lg p-2">
                <legend className="px-2 text-primary text-sm sm:text-xs lg:text-xs tracking-wider font-semibold">
                  B Side
                </legend>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-2 lg:gap-1.5">
                  {[...Array(20)].map((_, index) => {
                    const sensorId = index + 21;
                    const voltage = voltageData.voltages[`v${sensorId}`];
                    return (
                      <button
                        key={sensorId}
                        onClick={() => {
                          if (selectedSensors.includes(sensorId)) {
                            setSelectedSensors(
                              selectedSensors.filter((id) => id !== sensorId)
                            );
                          } else {
                            setSelectedSensors([...selectedSensors, sensorId]);
                            setSelectedSide(sensorId <= 20 ? "A" : "B");
                          }
                        }}
                        className={`${getVoltageClass(voltage)}
                          p-2 sm:p-3 rounded-lg transition-all hover:scale-105
                          ${
                            selectedSensors.includes(sensorId)
                              ? "ring-2 ring-primary"
                              : ""
                          }`}
                      >
                        <div className="text-xs font-medium opacity-70">
                          S{sensorId}
                        </div>
                        <div className="text-lg sm:text-sm lg:text-sm font-semibold">
                          {voltage?.toFixed(2) || "--"}
                        </div>
                        <div className="text-xs opacity-70">mV</div>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          </div>

          {/* chart area */}
          <div className="bg-secondary text-text rounded-lg p-3 h-full overflow-hidden">
            <div className="flex justify-between gap-4 mb-2">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedSide("A");
                      setSelectedSensors([]);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      selectedSide === "A" ||
                      selectedSensors.some((id) => id <= 20)
                        ? "bg-primary text-white"
                        : "bg-background/20 hover:bg-background/30 text-text"
                    }`}
                  >
                    A Side
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSide("B");
                      setSelectedSensors([]);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      selectedSide === "B" ||
                      selectedSensors.some((id) => id > 20)
                        ? "bg-primary text-white"
                        : "bg-background/20 hover:bg-background/30 text-text"
                    }`}
                  >
                    B Side
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSensors([]); // Only clear selected sensors
                    }}
                    className="px-4 py-2 rounded-lg text-sm bg-background/20 hover:bg-background/30 text-text"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {selectedSide && (
                <div className="grid grid-cols-10 gap-1 bg-background/20 p-1 px-2 rounded-lg">
                  {[...Array(20)].map((_, index) => {
                    const sensorId =
                      selectedSide === "A" ? index + 1 : index + 21;
                    return (
                      <label
                        key={sensorId}
                        className="flex items-center gap-1 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSensors.includes(sensorId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSensors([
                                ...selectedSensors,
                                sensorId,
                              ]);
                            } else {
                              setSelectedSensors(
                                selectedSensors.filter((id) => id !== sensorId)
                              );
                            }
                          }}
                          className="w-2 h-2 accent-primary checked:bg-primary checked:hover:bg-primary/80 focus:ring-primary"
                        />
                        <span className="text-[10px]">S{sensorId}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2">
                {["1h", "6h", "12h", "24h"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      timeRange === range
                        ? "bg-primary text-white"
                        : "bg-background/20 hover:bg-background/30 text-text"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div
              ref={chartContainerRef}
              className={`w-full ${
                window.innerWidth >= 1024 ? "h-[calc(100%-4rem)]" : "h-[400px]"
              } overflow-hidden`}
            >
              {chartData.length > 0 ? (
                <>
                  <Chart
                    ref={chartRef}
                    data={chartData}
                    width={
                      width || chartContainerRef.current?.clientWidth || 400
                    }
                    height={
                      height || chartContainerRef.current?.clientHeight || 300
                    }
                  />
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-text">
                  no voltage data to display chart...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
