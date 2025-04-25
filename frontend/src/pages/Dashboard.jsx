import { useAuth } from "../contexts/AuthContext";
import { useEffect, useRef, useState } from "react";
import axiosInstance from "../lib/axios";
import GaugeComponent from "react-gauge-component";

import ThreedModel from "../canvas/ThreedModel";
import Chart from "../components/Chart";
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
    const updateDimensions = () => {
      if (chartContainerRef.current) {
        const container = chartContainerRef.current;
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;

        // Set minimum dimensions to prevent initial stretch
        const minWidth = 400;
        const minHeight = 300;

        // Only update if dimensions are valid and changed
        if (
          newWidth >= minWidth &&
          newHeight >= minHeight &&
          (newWidth !== width || newHeight !== height)
        ) {
          // Add delay to dimension updates
          setTimeout(() => {
            setWidth(newWidth);
            setHeight(newHeight);
          }, 300); // 300ms delay for smoother transition
        }
      }
    };

    // Initial dimension update with longer delay
    const initialTimer = setTimeout(updateDimensions, 400);

    // Debounced resize handler with longer delay
    let resizeTimer;
    const debouncedUpdate = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateDimensions, 150);
    };

    // Set up resize observer
    const resizeObserver = new ResizeObserver(debouncedUpdate);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    // Update dimensions when chart data changes
    if (chartData.length > 0) {
      setTimeout(updateDimensions, 100);
    }

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(resizeTimer);
      resizeObserver.disconnect();
    };
  }, [width, height, chartData]);

  useEffect(() => {
    const updateNavHeight = () => {
      const header = document.querySelector("header");
      if (header) {
        setNavHeight(header.clientHeight);
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
      className="bg-background w-full overflow-x-hidden"
      style={{
        height: `calc(100dvh - ${navHeight}px)`,
        marginTop: `${navHeight}px`,
      }}
    >
      {/* content grid */}
      <div
        className={`h-full grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-4 mx-5 my-2`}
      >
        {/* left column */}
        <div className="flex flex-col justify-between gap-4">
          {/* status bar */}
          <div className="bg-secondary text-text rounded-lg p-4 flex justify-around gap-2">
            <fieldset className="border border-primary/75 rounded-lg py-2 w-1/2">
              <legend className="px-2 sm:px-3 text-sm sm:text-base text-primary tracking-widest font-semibold capitalize">
                A Side
              </legend>
              <div className="flex flex-col justify-center mx-1.5">
                <div className="flex items-center justify-around gap-2">
                  <div className="flex items-center gap-1 text-base font-light tracking-wider">
                    Active:
                    <span className="text-primary font-medium text-xl">
                      {
                        Object.entries(voltageDataA.voltages).filter(
                          ([key, value]) =>
                            parseInt(key.slice(1)) <= 20 && value === undefined
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-base font-light tracking-wider">
                    Inactive:
                    <span className="text-primary font-medium text-xl">
                      {
                        Object.entries(voltageDataA.voltages).filter(
                          ([key, value]) =>
                            parseInt(key.slice(1)) <= 20 &&
                            value === undefined &&
                            NaN(value)
                        ).length
                      }
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1">
                  Lt.Upd:
                  <span className="text-primary font-medium">
                    {voltageDataA.timestamp?.toLocaleString() || "--:--:--"}
                  </span>
                </div>
              </div>
            </fieldset>

            <fieldset className="border border-primary rounded-lg py-2 w-1/2">
              <legend className="px-2 sm:px-3 text-sm sm:text-base text-primary tracking-widest font-semibold capitalize">
                B Side
              </legend>
              <div className="flex flex-col justify-center mx-1.5">
                <div className="flex items-center justify-around gap-2">
                  <div className="flex items-center gap-1 text-base font-light tracking-wider">
                    Active:
                    <span className="text-primary font-medium text-xl">
                      {
                        Object.entries(voltageDataB.voltages).filter(
                          ([key, value]) =>
                            parseInt(key.slice(1)) > 20 && value !== undefined
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-base font-light tracking-wider">
                    Inactive:
                    <span className="text-primary font-medium text-xl">
                      {
                        Object.entries(voltageDataB.voltages).filter(
                          ([key, value]) =>
                            parseInt(key.slice(1)) > 20 && value === undefined
                        ).length
                      }
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1">
                  Lt.Upd:
                  <span className="text-primary font-medium">
                    {voltageDataB.timestamp?.toLocaleString() || "--:--:--"}
                  </span>
                </div>
              </div>
            </fieldset>
          </div>

          {/* 3d model */}
          <div className="bg-secondary text-text rounded-lg p-4 h-[400px]">
            <ThreedModel />
          </div>

          {/* split column 1 */}
          <div className=" bg-secondary rounded-lg p-4 text-text grid lg:grid-cols-2 sm:grid-cols-2 gap-2 overflow-hidden">
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
                      ...Object.entries(voltageDataA.voltages)
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
                              ...Object.entries(voltageDataA.voltages)
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
                              ...Object.entries(voltageDataA.voltages)
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
                        style: { fontSize: 20, fill: "#e9ebed" },
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
                      ...Object.entries(voltageDataA.voltages)
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
                              ...Object.entries(voltageDataA.voltages)
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
                              ...Object.entries(voltageDataA.voltages)
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
                        style: { fontSize: 20, fill: "#e9ebed" },
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
                      ...Object.entries(voltageDataB.voltages)
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
                              ...Object.entries(voltageDataB.voltages)
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
                              ...Object.entries(voltageDataB.voltages)
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
                        style: { fontSize: 20, fill: "#e9ebed" },
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
                      ...Object.entries(voltageDataB.voltages)
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
                              ...Object.entries(voltageDataB.voltages)
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
                              ...Object.entries(voltageDataB.voltages)
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
                        style: { fontSize: 20, fill: "#e9ebed" },
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-text">
            {/* Battery Status */}
            <div className="bg-secondary rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Battery Status</h3>
              <div className="flex justify-around items-center">
                {/* A Side Battery */}
                <div className="flex items-center gap-1">
                  <span className="text-xl font-medium text-text/85 capitalize -rotate-90">
                    A Side
                  </span>
                  <div className="flex flex-col items-center">
                    {/* Battery Cap */}
                    <div className="h-1 w-10 bg-text rounded-t-md"></div>
                    {/* Battery Body */}
                    <div className="relative h-[150px] w-[90px] border border-text rounded-lg overflow-hidden">
                      <div
                        className={`absolute bottom-0 left-0 w-full transition-all duration-500 ease-in-out rounded-b-lg ${
                          voltageDataA.batteryStatus > 50
                            ? "bg-gradient-to-t from-primary to-primary/90"
                            : voltageDataA.batteryStatus > 20
                            ? "bg-gradient-to-t from-primary/50 to-primary/30"
                            : "bg-gradient-to-t from-primary/30 to-primary/10"
                        }`}
                        style={{
                          height: `${voltageDataA.batteryStatus}%`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-semibold text-text rotate-[-90deg]">
                          {voltageDataA.batteryStatus}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* B Side Battery */}
                <div className="flex items-center gap-2">
                  <span className="text-xl font-medium text-text/85 capitalize -rotate-90">
                    B Side
                  </span>
                  <div className="flex flex-col items-center">
                    {/* Battery Cap */}
                    <div className="h-1 w-10 bg-text rounded-t-md"></div>
                    {/* Battery Body */}
                    <div className="relative h-[150px] w-[90px] border border-text rounded-lg overflow-hidden">
                      <div
                        className={`absolute bottom-0 left-0 w-full transition-all duration-500 ease-in-out rounded-b-lg ${
                          voltageDataB.batteryStatus > 50
                            ? "bg-gradient-to-t from-primary to-primary/90"
                            : voltageDataB.batteryStatus > 20
                            ? "bg-gradient-to-t from-primary/50 to-primary/30"
                            : "bg-gradient-to-t from-primary/30 to-primary/10"
                        }`}
                        style={{
                          height: `${voltageDataB.batteryStatus}%`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-semibold text-text rotate-[-90deg]">
                          {voltageDataB.batteryStatus}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative bg-secondary rounded-lg p-4 overflow-hidden ">
              <h3 className="text-lg font-medium mb-4">Signal Strength</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6">
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
                              voltageDataA.signalStrength >= 25 * bar
                                ? "#ffdd00"
                                : "#3ff45f",
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-4xl font-bold text-center">
                      {voltageDataA.signalStrength}%
                    </span>
                  </div>
                </div>
                {/* <hr className="absolute h-[75%] sm:h-[80%] w-px bg-text/70 -top-[7%] sm:top-[15%] left-1/2 transform -translate-x-5 rotate-90 sm:rotate-0" /> */}
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-base text-text/85 font-normal tracking-wide mb-2">
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
        <div className="flex flex-col justify-between gap-4">
          {/* voltage grid */}
          <div className="bg-secondary/50 text-text rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <fieldset className="border border-primary/75 rounded-lg p-2">
              <legend className="px-2 text-primary text-base font-medium tracking-wider">
                A Side
              </legend>
              <div className="grid grid-cols-5 sm:grid-cols-4 gap-1.5">
                {[...Array(20)].map((_, index) => {
                  const sensorId = index + 1;
                  const voltage = voltageDataA.voltages[`v${sensorId}`];
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
                          p-1.5 rounded-lg transition-all hover:scale-105
                          ${
                            selectedSensors.includes(sensorId)
                              ? "ring-1 ring-primary"
                              : ""
                          }`}
                    >
                      <div className="text-sm font-medium tracking-wider opacity-55 mb-0.5">
                        S{sensorId}
                      </div>
                      <div className="text-xl font-semibold tracking-wider mb-1">
                        {voltage?.toFixed(2) || "--"}
                      </div>
                      <div className="text-xs opacity-75">mV</div>
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <fieldset className="border border-primary rounded-lg p-2">
              <legend className="px-2 text-primary text-base font-medium tracking-wider">
                B Side
              </legend>
              <div className="grid grid-cols-5 sm:grid-cols-4 gap-1.5">
                {[...Array(20)].map((_, index) => {
                  const sensorId = index + 21;
                  const voltage = voltageDataB.voltages[`v${sensorId}`];
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
                          p-1.5 rounded-lg transition-all hover:scale-105
                          ${
                            selectedSensors.includes(sensorId)
                              ? "ring-1 ring-primary"
                              : ""
                          }`}
                    >
                      <div className="text-sm font-medium tracking-wider opacity-55 mb-0.5">
                        S{sensorId}
                      </div>
                      <div className="text-xl font-semibold tracking-wider mb-1">
                        {voltage?.toFixed(2) || "--"}
                      </div>
                      <div className="text-xs opacity-75">mV</div>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          {/* chart area */}
          <div className="bg-secondary text-text rounded-lg p-4 mb-4 overflow-hidden">
            <div className="flex flex-col gap-3 mb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
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
                <div className="grid grid-cols-10 gap-1 bg-background/20 p-2 rounded-lg">
                  {[...Array(20)].map((_, index) => {
                    const sensorId =
                      selectedSide === "A" ? index + 1 : index + 21;
                    return (
                      <label
                        key={sensorId}
                        className="container relative flex items-center gap-1 cursor-pointer select-none text-[10px] pl-5 mb-1"
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
                          className="absolute opacity-0 cursor-pointer h-0 w-0"
                        />
                        <span className="checkmark absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 bg-text/20 rounded transition-colors duration-200 hover:bg-text/30 peer-checked:bg-primary peer-checked:before:block"></span>
                        <span>S{sensorId}</span>
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
                    key={`chart-${JSON.stringify(chartData)}`}
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
