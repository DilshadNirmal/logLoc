import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axiosInstance from "../lib/axios";
import Gauge from "../components/Gauge";

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
  const [currentValue, setCurrentValue] = useState(0);

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
      const response = await axiosInstance.get("/api/thresholds");
    } catch (error) {
      console.error("Error fetching thresholds:", error);
    }
  };

  useEffect(() => {
    fetchThresholds();
  }, []);

  const handleThresholdChange = (type, value) => {
    setThresholds((prev) => ({
      ...prev,
      [type]: parseInt(value) || 0,
    }));
  };

  const handleSaveThresholds = async () => {
    try {
      const sensorId =
        selectedSensor.group === "A"
          ? selectedSensor.number
          : selectedSensor.number + 20;

      const response = await axiosInstance.post("/thresholds", {
        sensorId,
        high: thresholds[sensorId]?.high || 450,
        low: thresholds[sensorId]?.low || 100,
      });
    } catch (error) {
      console.error("Error saving thresholds:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-secondary/10 rounded-lg p-6">
          <div className="grid grid-cols-2 gap-8">
            {/* Sensor Configuration Column */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text">
                Sensor Configuration
              </h2>

              {/* Sensor Groups Container */}
              <div className="grid grid-cols-2 gap-4 bg-secondary/5 p-4 rounded-lg">
                {/* Group A */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-text">
                    Group A (1-20)
                  </h3>
                  <select
                    value={
                      selectedSensor.group === "A" ? selectedSensor.number : ""
                    }
                    onChange={(e) =>
                      setSelectedSensor({
                        group: "A",
                        number: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border border-secondary rounded bg-background text-text"
                  >
                    {[...Array(20)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Sensor {i + 1}
                      </option>
                    ))}
                  </select>
                  <div className="bg-secondary/20 p-2 rounded-lg">
                    <Gauge
                      value={currentValue}
                      lowThreshold={
                        thresholds[selectedSensor.number]?.low || 100
                      }
                      highThreshold={
                        thresholds[selectedSensor.number]?.high || 450
                      }
                    />
                  </div>
                </div>
                {/* Group B */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-text">
                    Group B (21-40)
                  </h3>
                  <select
                    value={
                      selectedSensor.group === "B" ? selectedSensor.number : ""
                    }
                    onChange={(e) =>
                      setSelectedSensor({
                        group: "B",
                        number: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border border-secondary rounded bg-background text-text"
                  >
                    {[...Array(20)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Sensor {i + 21}
                      </option>
                    ))}
                  </select>
                  <div className="bg-secondary/20 p-2 rounded-lg">
                    <Gauge
                      value={currentValue}
                      lowThreshold={
                        thresholds[selectedSensor.number + 20]?.low || 100
                      }
                      highThreshold={
                        thresholds[selectedSensor.number + 20]?.high || 450
                      }
                    />
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
                    value={thresholds[selectedSensor.number]?.low || 100}
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
                    value={thresholds[selectedSensor.number]?.high || 450}
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
                  onClick={handleSaveThresholds}
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
