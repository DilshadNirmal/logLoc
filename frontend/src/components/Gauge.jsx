import { Doughnut } from "react-chartjs-2";

const Gauge = ({
  value,
  lowThreshold = 3,
  highThreshold = 7,
  showLabel = true,
  size = "normal",
}) => {
  const gaugeColors = {
    low: "#133044", // Blue
    normal: "#409fff", // Primary
    high: "#e9ebed", // Text
  };

  const gaugeData = {
    labels: ["Low", "Normal", "High"],
    datasets: [
      {
        data: [lowThreshold, highThreshold - lowThreshold, 10 - highThreshold],
        backgroundColor: ["#0d0e10", "#409fff", "#e9ebed"],
        borderWidth: 0,
        circumference: 180,
        rotation: -90,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    circumference: 180,
    rotation: -90,
    cutout: "75%",
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    layout: {
      padding: size === "small" ? 10 : 20,
    },
  };

  return (
    <div
      className={`relative w-full ${
        size === "small" ? "h-24" : "h-full"
      } flex items-center justify-center`}
    >
      <Doughnut data={gaugeData} options={options} />
      {showLabel && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-[20%] text-center">
          <span className="text-2xl font-semibold text-text">
            {value?.toFixed(2) || "--"}
          </span>
          <span className="block text-sm text-text/70">mV</span>
        </div>
      )}
    </div>
  );
};

export default Gauge;
