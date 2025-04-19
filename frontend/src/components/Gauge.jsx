import Plot from "react-plotly.js";

const Gauge = ({ value = 0, lowThreshold = 3, highThreshold = 7 }) => {
  const data = [
    {
      type: "indicator",
      mode: "gauge+number",
      value: value || 0,
      number: {
        font: {
          size: 24,
          color: "#409fff",
          family: "Helvetica",
        },
        suffix: " mV",
      },
      gauge: {
        axis: {
          range: [0, 10],
          tickmode: "array",
          tickvals: [0, 2, 4, 6, 8, 10],
          ticktext: ["0", "02", "04", "06", "08", "10"],
          tickwidth: 2,
          tickcolor: "#e9ebed",
          ticklen: 10,
          tickfont: {
            color: "#e9ebed",
            size: 12,
          },
        },
        bar: { color: "rgba(0,0,0,0)" },
        bgcolor: "transparent",
        borderwidth: 0,
        steps: [
          { range: [0, 20], color: "#133044" },
          { range: [0, value], color: "#409fff" },
        ],
        shape: "angular",
        rotation: -135,
        angularaxis: {
          range: [0, 20],
        },
        threshold: {
          line: { color: "#e9ebed", width: 3 },
          thickness: 1,
          value: value || 0,
        },
      },
    },
  ];

  const layout = {
    autosize: true,
    margin: { t: 10, r: 10, l: 10, b: 40 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#e9ebed", family: "Helvetica" },
  };

  const config = {
    displayModeBar: false,
    staticPlot: true,
    responsive: true,
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Plot
        data={data}
        layout={layout}
        config={config}
        style={{ width: "100%", height: "100%" }}
        useResizeHandler={true}
      />
    </div>
  );
};

export default Gauge;
