import { useAuth } from "../contexts/AuthContext";
import { useEffect, useRef, useState } from "react";
import axiosInstance from "../lib/axios";
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
  const chartRef = useRef();

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

  useEffect(() => {
    fetchVoltages();
    const interval = setInterval(fetchVoltages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
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

    fetchChart();
  }, [selectedSensor, timeRange]);

  const getVoltageClass = (value) => {
    if (value === undefined) return "bg-secondary/20 text-text/50";
    if (value >= 7) return "bg-secondary text-red-400";
    if (value <= 3) return "bg-secondary text-blue-400";
    return "bg-secondary text-text";
  };

  return (
    <div className="h-[calc(100vh-5rem)] bg-background text-text pt-4 mt-20">
      <div className="max-w-screen sm:mx-6 px-4 h-full overflow-hidden">
        {/* Main Content Grid */}
        <div className="grid sm:grid-cols-12 gap-4 h-[97%] overflow-hidden">
          {/* Left Column */}
          <div className="sm:col-span-6 grid grid-rows-[45px_auto_220px_250px] gap-3 h-full overflow-hidden">
            {/* status bar */}
            <div className="bg-secondary text-text rounded-lg p-2 flex justify-around">
              <p className="text-base">
                Total Active:
                <span className="text-primary font-semibold tracking-wide text-lg ml-4">
                  {
                    Object.values(voltageData.voltages).filter(
                      (value) => value !== undefined
                    ).length
                  }
                </span>
              </p>
              <p>
                Total Inactive:
                <span className="text-primary font-semibold tracking-wide text-lg ml-4">
                  {
                    Object.values(voltageData.voltages).filter(
                      (value) => value === undefined
                    ).length
                  }
                </span>
              </p>
              <p>
                Lt. Upd:
                <span className="text-primary font-semibold tracking-wide text-lg ml-4">
                  {voltageData.timestamp?.toLocaleString() || "--:--:--"}
                </span>
              </p>
            </div>
            {/* 3d model */}
            <div className=" bg-secondary text-text rounded-lg p-2 overflow-hidden">
              <ThreedModel />
            </div>
            {/* split column 1 */}
            <div className="grid grid-cols-8 gap-4 overflow-hidden">
              <div className="col-span-3 bg-secondary backdrop-blur-sm rounded-lg p-6 overflow-hidden">
                <h3 className="text-sm font-semibold text-text mb-1">
                  Maximum Value
                </h3>
                <div className="h-[85%]">
                  <Gauge
                    value={Math.max(
                      ...Object.values(voltageData.voltages).filter(
                        (v) => v !== undefined
                      ),
                      0
                    )}
                    lowThreshold={3}
                    highThreshold={7}
                  />
                </div>
              </div>
              <div className="relative col-span-5 bg-secondary rounded-lg p-6 overflow-hidden">
                <div className="grid grid-cols-[240px_1fr] gap-4">
                  <div className="h-full">
                    <h4 className="text-sm font-semibold tracking-wider text-text mb-4">
                      Predict Value
                    </h4>
                    <h4 className="text-sm mb-10">Select Frequency</h4>
                    <div className="grid grid-cols-2 gap-8">
                      {["1 Hour", "6 Hours", "12 Hours", "24 Hours"].map(
                        (freq, index) => (
                          <label
                            key={index}
                            className="flex items-center gap-4 cursor-pointer"
                          >
                            <div className="relative">
                              <input
                                type="radio"
                                name="frequency"
                                value={freq}
                                checked={selectedFrequency === freq}
                                onChange={() => setSelectedFrequency(freq)}
                                className="sr-only"
                              />
                              <div
                                className={`w-5 h-5 border-2 ${
                                  selectedFrequency === freq
                                    ? "border-primary bg-primary/20"
                                    : "border-primary"
                                } rounded-full flex items-center justify-center`}
                              >
                                {selectedFrequency === freq && (
                                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                                )}
                              </div>
                            </div>
                            <span className="text-sm">{freq}</span>
                          </label>
                        )
                      )}
                    </div>
                  </div>
                  <hr className="absolute h-[80%] w-px bg-text/70 top-[15%] left-1/2 transform -translate-x-1/2" />
                  <div className="h-full flex items-center">
                    <Gauge
                      value={12}
                      lowThreshold={3}
                      highThreshold={7}
                      size="small"
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* split column 2 */}
            <div className="grid grid-cols-8 gap-4 overflow-hidden">
              <div className="col-span-3 bg-secondary backdrop-blur-sm rounded-lg p-6 overflow-hidden">
                <h3 className="text-sm font-semibold text-text/70 mb-2">
                  Minimum Value
                </h3>
                <div className="h-[85%]">
                  <Gauge
                    value={Math.min(
                      ...Object.values(voltageData.voltages).filter(
                        (v) => v !== undefined
                      ),
                      10
                    )}
                    lowThreshold={3}
                    highThreshold={7}
                  />
                </div>
              </div>
              <div className="relative col-span-5 bg-secondary backdrop-blur-sm rounded-lg p-6 overflow-hidden">
                <div className="grid grid-cols-[240px_1fr] gap-4">
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
                  <hr className="absolute h-[80%] w-px bg-text/70 top-[15%] left-1/2 transform -translate-x-5" />
                  <div className="">
                    <h4 className="text-sm font-medium tracking-wide mb-1">
                      Signal strength - 12 Hours
                    </h4>
                    <div className="grid grid-cols-4 grid-rows-3 gap-1">
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

          {/* Right Column - Voltage Grid */}
          <div className="sm:col-span-6 h-full flex flex-col">
            <div className="bg-secondary/50 rounded-lg">
              <div className="grid grid-cols-2 gap-1">
                <div className="space-y-4 p-2">
                  <fieldset className="border border-primary/75 rounded-lg p-2 shadow-2xl">
                    <legend className="px-2 text-primary text-sm font-semibold">
                      A Side
                    </legend>
                    <div className="grid grid-cols-4 gap-2">
                      {[...Array(20)].map((_, index) => {
                        const sensorId = index + 1;
                        const voltage = voltageData.voltages[`v${sensorId}`];
                        return (
                          <button
                            key={sensorId}
                            onClick={() => setSelectedSensor(sensorId)}
                            className={`${getVoltageClass(voltage)}
                          p-3 rounded-lg transition-all hover:scale-105
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
                <div className="space-y-4 p-2">
                  <fieldset className="border border-primary rounded-lg p-2 shadow-2xl">
                    <legend className="px-2 text-primary text-sm font-semibold">
                      B Side
                    </legend>
                    <div className="grid grid-cols-4 gap-2">
                      {[...Array(20)].map((_, index) => {
                        const sensorId = index + 21;
                        const voltage = voltageData.voltages[`v${sensorId}`];
                        return (
                          <button
                            key={sensorId}
                            onClick={() => setSelectedSensor(sensorId)}
                            className={`${getVoltageClass(voltage)}
                          p-3 rounded-lg transition-all hover:scale-105
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
            </div>

            {/* chart area */}
            <div className="bg-secondary rounded-lg p-4 col-span-full h-full mt-3">
              <div className="flex flex-wrap gap-4 items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text">Sensor:</span>
                  <select
                    value={selectedSensor}
                    onChange={(e) =>
                      setSelectedSensor(parseInt(e.target.value))
                    }
                    className="bg-background/20 rounded-lg px-3 py-1 text-sm text-text"
                  >
                    {Array.from({ length: 40 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        Sensor {num}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  {["1h", "6h", "12h", "1d"].map((range) => (
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

              <div className="h-[calc(100%-60px)]">
                {chartData ? (
                  <Chart
                    ref={chartRef}
                    data={chartData}
                    width={800}
                    height={250}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-text/50">
                    Loading voltage chart...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
