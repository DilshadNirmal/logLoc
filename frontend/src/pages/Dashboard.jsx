import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import axiosInstance from "../lib/axios";
import ThreedModel from "../canvas/ThreedModel";
import Gauge from "../components/Gauge";
import SignalStrengthGrid from "../components/SignalStrengthGrid";

const Dashboard = () => {
  const { user } = useAuth();
  const [voltageData, setVoltageData] = useState({
    voltages: {},
    batteryStatus: 0,
    signalStrength: 0,
    timestamp: null,
  });
  const [selectedSensor, setSelectedSensor] = useState(1);

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

  const getVoltageClass = (value) => {
    if (value === undefined) return "bg-secondary/20 text-text/50";
    if (value >= 7) return "bg-secondary text-red-400";
    if (value <= 3) return "bg-secondary text-blue-400";
    return "bg-secondary text-text";
  };

  return (
    <div className="h-[calc(100vh-5rem)] bg-background text-text pt-8 mt-20">
      <div className="max-w-screen sm:mx-10 px-4 h-full overflow-hidden">
        {/* Main Content Grid */}
        <div className="grid sm:grid-cols-12 gap-4 h-[95%] overflow-hidden">
          {/* Left Column */}
          <div className="sm:col-span-6 grid grid-rows-[auto_1fr_1fr_1fr] gap-3 h-full overflow-hidden">
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
              <div className="col-span-3 bg-secondary backdrop-blur-sm rounded-lg p-2 overflow-hidden">
                <h3 className="text-sm font-semibold text-text/70 mb-1">
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
              <div className="col-span-5 bg-secondary rounded-lg p-4 overflow-hidden">
                <h4 className="text-sm font-semibold tracking-wider text-text mb-4">
                  Predict Value
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm">Select Frequency</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {["1 Hour", "6 Hours", "12 Hours", "24 Hours"].map(
                        (freq, index) => (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <div className="relative">
                              <input
                                type="radio"
                                name="frequency"
                                value="1"
                                className="sr-only peer"
                              />
                              <div className="w-5 h-5 border-2 border-primary rounded-full">
                                <div className="hidden peer-checked:block w-3 h-3 m-[3px] rounded-full bg-primary"></div>
                              </div>
                            </div>
                            <span className="text-sm">{freq}</span>
                          </label>
                        )
                      )}
                    </div>
                  </div>
                  <div className="h-full">
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
              <div className="col-span-3 bg-secondary backdrop-blur-sm rounded-lg p-4 overflow-hidden">
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
              <div className="col-span-5 bg-secondary backdrop-blur-sm rounded-lg p-4 overflow-hidden">
                <h3 className="text-sm font-semibold text-text/70 mb-2">
                  Signal Strength
                </h3>
                <SignalStrengthGrid value={voltageData.signalStrength} />
              </div>
            </div>
          </div>

          {/* Right Column - Voltage Grid */}
          <div className="sm:col-span-6 h-full">
            <div className="bg-secondary/50 p-1 rounded-lg">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
