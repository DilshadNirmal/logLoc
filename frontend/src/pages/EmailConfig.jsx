import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axiosInstance from "../lib/axios";
import GaugeComponent from "react-gauge-component";
import {
  Chart as ChartJs,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJs.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const EmailConfig = () => {
  const { user } = useAuth();
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [selectedSensor, setSelectedSensor] = useState({
    group: "A",
    number: 1,
  });
  const [thresholds, setThresholds] = useState({});
  const [alertDelay, setAlertDelay] = useState("5");
  const [voltageHistory, setVoltageHistory] = useState([]);
  const [voltageData, setVoltageData] = useState({
    voltages: {},
    timestamp: null,
  });
  const [gaugeValue, setGaugeValue] = useState(5);

  const handleAddEmail = () => {
    if (newEmail && !emails.includes(newEmail)) {
      setEmails([...emails, newEmail]);
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (emailToRemove) => {
    setEmails(emails.filter((email) => email !== emailToRemove));
  };

  const fetchThresholds = async () => {
    try {
      const response = await axiosInstance.get("/alert-config");
      const configs = response.data;

      // transforming data to match our state structure
      const thresholdData = {};
      configs.forEach((config) => {
        thresholdData[config.sensorId] = {
          high: config.high,
          low: config.low,
        };
      });

      setThresholds(thresholdData);

      const sensorId =
        selectedSensor.group === "A"
          ? selectedSensor.number
          : selectedSensor.number + 20;

      if (thresholdData[sensorId]) {
        setGaugeValue(thresholdData[sensorId].high);
      }

      if (configs.length > 0) {
        setEmails(configs[0].emails || []);
        setAlertDelay(configs[0].alertDelay.toString() || "5");
      }
    } catch (error) {
      console.error("Error fetching thresholds:", error);
    }
  };

  const fetchVoltageHistroy = async () => {
    try {
      const response = await axiosInstance.get("/voltage-history");
      setVoltageHistory(response.data);

      // Update current value based on selected sensor
      const sensorId =
        selectedSensor.group === "A"
          ? selectedSensor.number
          : selectedSensor.number + 20;
      const voltageKey = `v${sensorId}`;
      if (
        response.data.Voltages &&
        response.data.Voltages[voltageKey] !== undefined
      ) {
        setCurrentValue(response.data.Voltages[voltageKey]);
      }
    } catch (error) {
      console.error("Error fetching voltage history:", error);
    }
  };

  const fetchGlobalEmailConfig = async () => {
    try {
      const response = await axiosInstance.get("/global-email-config");
      if (response.data && Array.isArray(response.data)) {
        setEmails(response.data);
      }
    } catch (error) {
      console.error("Error fetching global email config:", error);
    }
  };

  useEffect(() => {
    fetchThresholds();
    fetchVoltageHistroy();
    fetchGlobalEmailConfig();

    const sensorId =
      selectedSensor.group === "A"
        ? selectedSensor.number
        : selectedSensor.number + 20;
    if (thresholds[sensorId]) {
      setGaugeValue(currentValue || thresholds[sensorId].high);
    }

    const interval = setInterval(fetchVoltageHistroy, 5000);
    return () => clearInterval(interval);
  }, [selectedSensor]);

  const handleThresholdChange = (type, value) => {
    const sensorId =
      selectedSensor.group === "A"
        ? selectedSensor.number
        : selectedSensor.number + 20;

    setThresholds((prev) => ({
      ...prev,
      [sensorId]: {
        ...prev[sensorId],
        [type]: value === "" ? "" : parseFloat(parseFloat(value).toFixed(2)),
      },
    }));

    if (type === "high") {
      setGaugeValue(parseFloat(parseFloat(value).toFixed(2)));
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      const sensorId =
        selectedSensor.group === "A"
          ? selectedSensor.number
          : selectedSensor.number + 20;

      // Ensure we have valid threshold values
      const highThreshold = thresholds[sensorId]?.high ?? 7;
      const lowThreshold = thresholds[sensorId]?.low ?? 3;

      // Make sure we have at least one email
      if (emails.length === 0) {
        alert("Please add at least one email address");
        return;
      }

      const configData = {
        sensorId,
        high: highThreshold,
        low: lowThreshold,
        emails: emails,
        alertDelay: parseInt(alertDelay),
      };

      await axiosInstance.post("/alert-config", {
        sensorId,
        high: thresholds[sensorId]?.high || 7,
        low: thresholds[sensorId]?.low || 3,
        emails,
        alertDelay: parseInt(alertDelay),
      });

      await axiosInstance.post("/global-email-config", {
        emails,
      });

      // Show success message using your existing notification system
      alert("Configuration saved successfully");
      fetchThresholds();
    } catch (error) {
      console.error("Error saving thresholds:", error);
      alert("Error saving configuration. Please try again.");
    }
  };

  // const gaugeData = {
  //   labels: ["Low", "Normal", "High"],
  //   datasets: [
  //     {
  //       data: [
  //         thresholds[
  //           selectedSensor.group === "A"
  //             ? selectedSensor.number
  //             : selectedSensor.number + 20
  //         ]?.low || 3,
  //         (thresholds[
  //           selectedSensor.group === "A"
  //             ? selectedSensor.number
  //             : selectedSensor.number + 20
  //         ]?.high || 7) -
  //           (thresholds[
  //             selectedSensor.group === "A"
  //               ? selectedSensor.number
  //               : selectedSensor.number + 20
  //           ]?.low || 3),
  //         10 -
  //           (thresholds[
  //             selectedSensor.group === "A"
  //               ? selectedSensor.number
  //               : selectedSensor.number + 20
  //           ]?.high || 7),
  //       ],
  //       backgroundColor: ["#133044", "#409fff", "#e9ebed"],
  //       borderWidth: 0,
  //       circumference: 180,
  //       rotation: -90,
  //     },
  //   ],
  // };

  useEffect(() => {
    if (voltageHistory?.Voltages) {
      const sensorId =
        selectedSensor.group === "A"
          ? selectedSensor.number
          : selectedSensor.number + 20;
      const voltageKey = `v${sensorId}`;
      if (voltageHistory.Voltages[voltageKey] !== undefined) {
        setGaugeValue(voltageHistory.Voltages[voltageKey]);
      }
    }
  }, [voltageHistory, selectedSensor]);

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

  // Add this useEffect to fetch voltage data periodically
  useEffect(() => {
    fetchVoltages();
    const interval = setInterval(fetchVoltages, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background pt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-secondary/10 rounded-lg p-6">
          <div className="grid sm:grid-cols-2 gap-8">
            {/* Sensor Configuration Column */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text">
                Sensor Configuration
              </h2>

              {/* Sensor Groups Container */}
              <div className=" bg-secondary/5 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  {/* Group A Selector */}
                  <div>
                    <h3 className="text-lg font-semibold tracking-wide text-text mb-2">
                      Group A (1-20)
                    </h3>
                    <select
                      value={
                        selectedSensor.group === "A"
                          ? selectedSensor.number
                          : ""
                      }
                      onChange={(e) =>
                        setSelectedSensor({
                          group: "A",
                          number: Number(e.target.value),
                        })
                      }
                      className={`w-full p-2 border ${
                        selectedSensor.group === "A"
                          ? "border-primary bg-primary/10"
                          : "border-secondary bg-background"
                      } rounded text-text transition-colors duration-200`}
                    >
                      {[...Array(20)].map((_, i) => (
                        <option
                          key={i + 1}
                          value={i + 1}
                          className="text-text/75 bg-background"
                        >
                          Sensor {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Group B */}
                  <div>
                    <h3 className="text-lg font-semibold tracking-wide mb-2 text-text">
                      Group B (21-40)
                    </h3>
                    <select
                      value={
                        selectedSensor.group === "B"
                          ? selectedSensor.number
                          : ""
                      }
                      onChange={(e) =>
                        setSelectedSensor({
                          group: "B",
                          number: Number(e.target.value),
                        })
                      }
                      className={`w-full p-2 border ${
                        selectedSensor.group === "B"
                          ? "border-primary bg-primary/10"
                          : "border-secondary bg-background"
                      } rounded text-text transition-colors duration-200`}
                    >
                      {[...Array(20)].map((_, i) => (
                        <option
                          key={i + 1}
                          value={i + 1}
                          className="text-text/75 bg-background"
                        >
                          Sensor {i + 21}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* single Gauge chart */}
                <div className="bg-secondary/50 p-4 rounded-lg mt-6">
                  <div className="text-center mb-4">
                    <span className="text-2xl font-semibold tracking-wider text-text">
                      Current:{" "}
                      {voltageData.voltages[
                        `v${
                          selectedSensor.group === "A"
                            ? selectedSensor.number
                            : selectedSensor.number + 20
                        }`
                      ]?.toFixed(2) || "0.00"}
                      mV
                    </span>
                  </div>
                  <div className="h-64 relative">
                    <GaugeComponent
                      value={gaugeValue}
                      type="semicircle"
                      arc={{
                        width: 0.3,
                        padding: 0.005,
                        cornerRadius: 1,
                        gradient: false,
                        subArcs: [
                          {
                            limit:
                              thresholds[
                                selectedSensor.group === "A"
                                  ? selectedSensor.number
                                  : selectedSensor.number + 20
                              ]?.low ?? 3,
                            color: "#133044",
                            showTick: true,
                          },
                          {
                            limit:
                              thresholds[
                                selectedSensor.group === "A"
                                  ? selectedSensor.number
                                  : selectedSensor.number + 20
                              ]?.high ?? 7,
                            color: "#409fff",
                            showTick: true,
                          },
                          {
                            limit: 10,
                            color: "#5c5c5c99",
                            showTick: true,
                          },
                        ],
                      }}
                      pointer={{
                        type: "arrow",
                        color: "#409fff",
                        length: 0.6,
                        width: 10,
                        elastic: true,
                      }}
                      labels={{
                        valueLabel: {
                          formatTextValue: (value) => value.toFixed(2) + " mV",
                          style: {
                            fontSize: 5,
                            fill: "#e9ebed",
                            display: "none",
                          },
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
                            style: { fill: "#e9ebed" },
                          },
                        },
                      }}
                      maxValue={10}
                      minValue={0}
                    />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-[-25%] text-center mt-2">
                      <div className="text-lg font-medium text-text/70">
                        Threshold
                      </div>
                      <div className="text-xl font-bold text-text">
                        {thresholds[
                          selectedSensor.group === "A"
                            ? selectedSensor.number
                            : selectedSensor.number + 20
                        ]?.low || 3}
                        &nbsp;-&nbsp;
                        {thresholds[
                          selectedSensor.group === "A"
                            ? selectedSensor.number
                            : selectedSensor.number + 20
                        ]?.high || 7}
                        &nbsp;mV
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Threshold Controls */}
              <div className="grid grid-cols-2 gap-4 bg-secondary/5 p-4 rounded-lg">
                <div>
                  <label className="block text-text/70 mb-2">
                    Low Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    value={
                      thresholds[
                        selectedSensor.group === "A"
                          ? selectedSensor.number
                          : selectedSensor.number + 20
                      ]?.low ?? 3
                    }
                    onChange={(e) =>
                      handleThresholdChange("low", e.target.value)
                    }
                    className="w-full p-2 border border-secondary rounded bg-background text-text"
                  />
                </div>
                <div>
                  <label className="block text-text/70 mb-2">
                    High Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    value={
                      thresholds[
                        selectedSensor.group === "A"
                          ? selectedSensor.number
                          : selectedSensor.number + 20
                      ]?.high ?? 7
                    }
                    onChange={(e) =>
                      handleThresholdChange("high", e.target.value)
                    }
                    className="w-full p-2 border border-secondary rounded bg-background text-text"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveConfiguration}
                  className="px-6 py-2 bg-primary text-text rounded hover:bg-primary/80"
                >
                  Save Configuration
                </button>
              </div>
            </div>

            {/* Right Column - Email Configuration */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text">
                Email Configuration
              </h2>

              {/* Email Input */}
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      newEmail &&
                      !emails.includes(newEmail)
                    ) {
                      handleAddEmail();
                    }
                  }}
                  placeholder="Add email address"
                  className="flex-1 p-2 border border-secondary rounded bg-background text-text"
                />
                <button
                  onClick={handleAddEmail}
                  className="px-4 py-2 bg-primary text-text rounded hover:bg-primary/80"
                >
                  Add
                </button>
              </div>

              {/* Email List */}
              <div className="space-y-2">
                {emails.map((email) => (
                  <div
                    key={email}
                    className="flex justify-between items-center p-2 bg-secondary/5 rounded"
                  >
                    <span className="text-text">{email}</span>
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      className="text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Alert Delay */}
              <div>
                <label className="block text-text/70 mb-2">Alert Delay</label>
                <div className="flex gap-4">
                  {["1", "5", "10", "15", "30", "60"].map((delay) => (
                    <label key={delay} className="flex items-center">
                      <input
                        type="radio"
                        value={delay}
                        checked={alertDelay === delay}
                        onChange={(e) => setAlertDelay(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-text">{delay} min</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfig;
