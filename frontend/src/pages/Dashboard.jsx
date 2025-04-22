import { useAuth } from "../contexts/AuthContext";
import { useEffect, useRef, useState } from "react";
import axiosInstance from "../lib/axios";
import GaugeComponent from "react-gauge-component";

import ThreedModel from "../canvas/ThreedModel";
import Gauge from "../components/Gauge";
import Chart from "../components/Chart";
const Dashboard = () => {
  const { user } = useAuth();
  const [voltageData, setVoltageData] = useState({
    voltages: {},
    batteryStatus: 0,
    signalStrength: 0,
    timestamp: null,
  });
  const [selectedSensor, setSelectedSensor] = useState(1);
  const [selectedFrequency, setSelectedFrequency] = useState("1h");
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
      const response = await axiosInstance.get("/voltage-data", {
        params: {
          sensorId: selectedSensor,
          timeRange: timeRange,
          refresh: new Date().getTime(),
        },
      });
      //   {
      //   responseType: "blob",
      //   params: {
      //     sensorId: selectedSensor,
      //     timeRange: timeRange,
      //     refresh: new Date().getTime(),
      //   },
      // });
      // const url = URL.createObjectURL(response.data);
      setChartData(response.data);
    } catch (error) {
      console.error("Error loading chart:", error);
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
  }, [selectedSensor, timeRange]);

  useEffect(() => {
    const updateDimensions = () => {
      if (chartContainerRef.current) {
        setWidth(chartContainerRef.current.clientWidth);
        setHeight(chartContainerRef.current.clientHeight);
      }
    };

    console.log("Chart container ref:", chartContainerRef.current);
    console.log("Chart ref:", chartRef.current);
    console.log("Width:", width);
    console.log("Height:", height);

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, [height, width]);

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
      if (window.innerWidth >= 1024) {
        // lg breakpoint
        setContentHeight(windowHeight - 100 - margin);
      }
    };

    updateNavHeight();
    updateContentHeight();
    window.addEventListener("resize", updateNavHeight);
    window.addEventListener("resize", updateContentHeight);
    return () => {
      window.removeEventListener("resize", updateNavHeight);
      window.removeEventListener("resize", updateContentHeight);
    };
  }, []);

  return (
    <section
      className="bg-background min-h-[100dvh] w-full overflow-x-hidden pb-4 sm:pb-0"
      style={{ marginTop: `${navHeight}px` }}
    >
      {/* content grid */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-3 mx-3 mt-4 sm:mt-5"
        style={{
          height: window.innerWidth >= 1024 ? `${contentHeight}px` : "auto",
        }}
      >
        {/* left column */}
        <div className="flex flex-col gap-4">
          {/* status bar */}
          <div
            className="bg-secondary text-text rounded-lg p-2"
            style={{
              height:
                window.innerWidth > 1024
                  ? `${contentHeight * 0.15 - 16 * 4}px`
                  : "auto",
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <fieldset className="border border-primary/75 rounded-lg p-2 py-1">
                <legend className="px-2 text-primary text-sm font-semibold">
                  A Side
                </legend>
                <div className="flex justify-between text-sm">
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
                <legend className="px-2 text-primary text-sm font-semibold">
                  B Side
                </legend>
                <div className="flex justify-between text-sm">
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
            className=" bg-secondary text-text rounded-lg p-2 w-full"
            style={{ height: `${contentHeight * 0.35 - 16 * 2}px` }}
          >
            <ThreedModel />
          </div>

          {/* split column 1 */}
          <div
            className=" bg-secondary rounded-lg p-4 text-text grid sm:grid-cols-2 gap-2 overflow-hidden"
            style={{
              height:
                window.innerWidth > 1024
                  ? `${contentHeight * 0.31 - 16 * 2}px`
                  : "auto",
            }}
          >
            <fieldset className="border border-primary/75 rounded-lg p-1">
              <legend className="px-2 text-primary text-sm font-semibold">
                A side
              </legend>

              {/* chart for max and min */}
              <div className="flex sm:flex-row flex-col items-center justify-center w-full h-full gap-2">
                <div className="sm:w-[48%] h-[100%]">
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
                        style: { fontSize: 18, fill: "#e9ebed" },
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
                <div className="sm:w-[48%] h-[100%]">
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
                        style: { fontSize: 18, fill: "#e9ebed" },
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
              <legend className="px-2 text-primary text-sm font-semibold">
                B side
              </legend>

              {/* chart for max and min */}
              <div className="flex sm:flex-row flex-col items-center justify-center w-full h-full gap-2">
                <div className="sm:w-[48%] h-[100%]">
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
                        style: { fontSize: 18, fill: "#e9ebed" },
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
                <div className="sm:w-[48%] h-[100%]">
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
                        style: { fontSize: 18, fill: "#e9ebed" },
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
                  ? `${contentHeight * 0.28}px`
                  : "auto",
            }}
          >
            <div className="sm:col-span-3 w-full bg-secondary backdrop-blur-sm rounded-lg p-6 overflow-hidden">
              <h3 className="text-sm font-semibold text-text mb-2">
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
            <div className="relative sm:col-span-5 bg-secondary backdrop-blur-sm rounded-lg p-6 overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr] gap-4">
                <div className="h-full">
                  <h3 className="text-sm font-semibold text-text/70 mb-4">
                    Signal Strength
                  </h3>
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
                <div className="">
                  <h4 className="text-sm font-medium tracking-wide mb-2">
                    Signal strength - 12 Hours
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 sm:grid-rows-3 gap-1">
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
                        className="bg-background/20 rounded-lg p-2 pt-3 flex flex-col items-center justify-end"
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
                        <span className="text-[8px] text-text/70">
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
        <div className="flex flex-col gap-4">
          {/* voltage grid */}
          <div className="bg-secondary/50 rounded-lg p-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <fieldset className="border border-primary/75 rounded-lg p-2">
                <legend className="px-2 text-primary text-sm font-semibold">
                  A Side
                </legend>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-2">
                  {[...Array(20)].map((_, index) => {
                    const sensorId = index + 1;
                    const voltage = voltageData.voltages[`v${sensorId}`];
                    return (
                      <button
                        key={sensorId}
                        onClick={() => setSelectedSensor(sensorId)}
                        className={`${getVoltageClass(voltage)}
                          p-2 sm:p-3 rounded-lg transition-all hover:scale-105
                          ${
                            selectedSensor === sensorId
                              ? "ring-2 ring-primary"
                              : ""
                          }`}
                      >
                        <div className="text-xs font-semibold opacity-70">
                          S{sensorId}
                        </div>
                        <div className="text-lg font-bold">
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
                <legend className="px-2 text-primary text-sm font-semibold">
                  B Side
                </legend>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-2">
                  {[...Array(20)].map((_, index) => {
                    const sensorId = index + 21;
                    const voltage = voltageData.voltages[`v${sensorId}`];
                    return (
                      <button
                        key={sensorId}
                        onClick={() => setSelectedSensor(sensorId)}
                        className={`${getVoltageClass(voltage)}
                          p-2 sm:p-3 rounded-lg transition-all hover:scale-105
                          ${
                            selectedSensor === sensorId
                              ? "ring-2 ring-primary"
                              : ""
                          }`}
                      >
                        <div className="text-xs font-semibold opacity-70">
                          S{sensorId}
                        </div>
                        <div className="text-lg font-bold">
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
          <div className="bg-secondary rounded-lg p-4 h-full">
            <div className="flex sm:flex-row justify-between items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                {/* <span className="text-sm text-text">Sensor:</span> */}
                <select
                  value={selectedSensor}
                  onChange={(e) => setSelectedSensor(parseInt(e.target.value))}
                  className="bg-background/20 rounded-lg px-3 py-1 text-sm text-text"
                >
                  {Array.from({ length: 40 }, (_, i) => i + 1).map((num) => (
                    <option
                      key={num}
                      value={num}
                      className="text-text/75 bg-background"
                    >
                      Sensor {num}
                    </option>
                  ))}
                </select>
              </div>

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

            <div ref={chartContainerRef} className="h-[calc(100%-4rem)] w-full">
              {chartData.length > 0 ? (
                <>
                  <Chart
                    ref={chartRef}
                    data={chartData}
                    width={width || 800}
                    height={height || 250}
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
