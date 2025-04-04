import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axiosInstance from "../lib/axios";

const EmailConfig = () => {
  const { user } = useAuth();
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [selectedSensor, setSelectedSensor] = useState(1);
  const [thresholds, setThresholds] = useState({
    high: 450,
    low: 100,
  });
  const [alertDelay, setAlertDelay] = useState("5");

  const handleAddEmail = () => {
    if (newEmail && !emails.includes(newEmail)) {
      setEmails([...emails, newEmail]);
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (emailToRemove) => {
    setEmails(emails.filter((email) => email !== emailToRemove));
  };

  const handleThresholdChange = (type, value) => {
    setThresholds((prev) => ({
      ...prev,
      [type]: parseInt(value) || 0,
    }));
  };

  return (
    <div className="min-h-screen bg-background pt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-secondary/10 rounded-lg p-6">
          <div className="grid grid-cols-2 gap-8">
            {/* Left Column - Sensor Controls */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text">
                Sensor Configuration
              </h2>

              {/* Sensor Selector */}
              <div className="mb-4">
                <label className="block text-text/70 mb-2">Select Sensor</label>
                <select
                  value={selectedSensor}
                  onChange={(e) => setSelectedSensor(Number(e.target.value))}
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                >
                  {[...Array(40)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Sensor {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Voltmeter Display */}
              <div className="relative w-full h-80 bg-text/10 rounded-full overflow-hidden">
                <div className="absolute w-2 h-full bg-primary/20 left-1/2 -translate-x-1/2" />
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={thresholds.high}
                  onChange={(e) =>
                    handleThresholdChange("high", e.target.value)
                  }
                  className="absolute w-3/4 top-1/4 left-1/2 -translate-x-1/2 -rotate-45"
                />
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={thresholds.low}
                  onChange={(e) => handleThresholdChange("low", e.target.value)}
                  className="absolute w-3/4 bottom-1/4 left-1/2 -translate-x-1/2 rotate-45"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-text">
                  <span className="mr-4">Low: {thresholds.low}V</span>
                  <span>High: {thresholds.high}V</span>
                </div>
              </div>

              {/* Manual Input */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text/70 mb-2">
                    High Threshold
                  </label>
                  <input
                    type="number"
                    value={thresholds.high}
                    onChange={(e) =>
                      handleThresholdChange("high", e.target.value)
                    }
                    className="w-full p-2 border border-secondary rounded bg-background text-text"
                  />
                </div>
                <div>
                  <label className="block text-text/70 mb-2">
                    Low Threshold
                  </label>
                  <input
                    type="number"
                    value={thresholds.low}
                    onChange={(e) =>
                      handleThresholdChange("low", e.target.value)
                    }
                    className="w-full p-2 border border-secondary rounded bg-background text-text"
                  />
                </div>
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

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button className="px-6 py-2 bg-primary text-text rounded hover:bg-primary/80">
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfig;
