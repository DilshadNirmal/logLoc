import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import * as d3 from "d3";

const Chart = forwardRef(({ data, width, height }, ref) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [selection, setSelection] = useState(null);
  // console.log(data);

  useImperativeHandle(ref, () => ({
    resetZoom: () => setSelection(null),
  }));

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Setup dimensions
    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Find peak and low values
    const peakValue = d3.max(data, (d) => d.value);
    const lowValue = d3.min(data, (d) => d.value);
    const peakPoint = data.find((d) => d.value === peakValue);
    const lowPoint = data.find((d) => d.value === lowValue);

    // Setup SVG
    const svg = d3
      .select(svgRef.current)
      .html("")
      .attr("width", width)
      .attr("height", height);

    // Background
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#1a2234")
      .attr("rx", 8);

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(
        selection?.domain || d3.extent(data, (d) => new Date(d.timestamp))
      )
      .range([margin.left, innerWidth + margin.left]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) * 1.1])
      .nice()
      .range([innerHeight + margin.top, margin.top]);

    // Clip path for line chart
    const clipPath = svg
      .append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", innerWidth)
      .attr("height", innerHeight);

    // Grid lines
    const addGrid = () => {
      svg
        .append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${innerHeight + margin.top})`)
        .call(d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat(""))
        .attr("color", "#2a3444")
        .attr("stroke-opacity", 0.5);

      svg
        .append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(""))
        .attr("color", "#2a3444")
        .attr("stroke-opacity", 0.5);
    };

    // Add line path
    const line = d3
      .line()
      .x((d) => xScale(new Date(d.timestamp)))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    const path = svg
      .append("g")
      .attr("clip-path", "url(#clip)")
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#0ea5e9")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Hover elements
    const hoverLine = svg
      .append("line")
      .attr("class", "hover-line")
      .attr("y1", margin.top)
      .attr("y2", innerHeight + margin.top)
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1)
      .style("opacity", 0);

    const hoverPoint = svg
      .append("circle")
      .attr("r", 4)
      .attr("fill", "#0ea5e9")
      .style("opacity", 0);

    // Add value indicators (peak/low)
    const addValueIndicator = (point, isMax) => {
      const g = svg
        .append("g")
        .attr(
          "transform",
          `translate(${xScale(new Date(point.timestamp))},${yScale(
            point.value
          )})`
        );

      g.append("circle")
        .attr("r", 4)
        .attr("fill", isMax ? "#ff4d4d" : "#4d4dff");

      const label = g
        .append("g")
        .attr(
          "transform",
          `translate(${isMax ? 10 : -10}, ${isMax ? -10 : 10})`
        );

      label
        .append("rect")
        .attr("x", -35)
        .attr("y", -20)
        .attr("width", 70)
        .attr("height", 40)
        .attr("rx", 4)
        .attr("fill", "#2a3444")
        .attr("opacity", 0.9);

      label
        .append("text")
        .attr("x", 0)
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8")
        .attr("font-size", "10px")
        .text(isMax ? "Peak" : "Low");

      label
        .append("text")
        .attr("x", 0)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .attr("font-size", "12px")
        .text(`${point.value.toFixed(2)}mV`);
    };

    // Add hover interaction
    const overlay = svg
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "none")
      .style("pointer-events", "all");

    overlay
      .on("mousemove", function (event) {
        const [xPos] = d3.pointer(event, this);
        const x0 = xScale.invert(xPos + margin.left);
        const bisect = d3.bisector((d) => new Date(d.timestamp)).left;
        const index = bisect(data, x0);
        const d0 = data[index - 1];
        const d1 = data[index];

        if (!d0 || !d1) return;

        const d =
          x0 - new Date(d0.timestamp) > new Date(d1.timestamp) - x0 ? d1 : d0;
        const xPosition = xScale(new Date(d.timestamp));
        const yPosition = yScale(d.value);

        hoverLine
          .attr("x1", xPosition)
          .attr("x2", xPosition)
          .style("opacity", 1);

        hoverPoint
          .attr("cx", xPosition)
          .attr("cy", yPosition)
          .style("opacity", 1);

        const tooltip = d3
          .select(tooltipRef.current)
          .style("opacity", 1)
          .style("left", `${event.pageX + 15}px`)
          .style("top", `${event.pageY - 28}px`);

        tooltip.html(`
        <div class="bg-background/90 p-2 rounded shadow-lg backdrop-blur-sm border border-primary/20">
          <div class="text-text/70 text-xs">
            ${new Date(d.timestamp).toLocaleString()}
          </div>
          <div class="text-primary font-bold text-lg">
            ${d.value.toFixed(2)} mV
          </div>
        </div>
      `);
      })
      .on("mouseleave", () => {
        hoverLine.style("opacity", 0);
        hoverPoint.style("opacity", 0);
        d3.select(tooltipRef.current).style("opacity", 0);
      });

    // Add brush for zooming
    const brush = d3
      .brushX()
      .extent([
        [margin.left, margin.top],
        [innerWidth + margin.left, innerHeight + margin.top],
      ])
      .on("end", (event) => {
        if (!event.selection) return;
        const [x0, x1] = event.selection.map(xScale.invert);
        setSelection({ domain: [x0, x1] });
        d3.select(".brush").call(brush.move, null);
      });

    svg.append("g").attr("class", "brush").call(brush);

    // Add axes
    svg
      .append("g")
      .attr("transform", `translate(0,${innerHeight + margin.top})`)
      .call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.timeFormat("%H:%M")))
      .attr("color", "#94a3b8")
      .call((g) => g.select(".domain").remove());

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => `${d}mV`)
      )
      .attr("color", "#94a3b8")
      .call((g) => g.select(".domain").remove());

    // Add grid lines
    addGrid();

    // Add peak and low indicators
    addValueIndicator(peakPoint, true);
    addValueIndicator(lowPoint, false);

    // Add reset zoom button if zoomed
    if (selection) {
      const resetButton = svg
        .append("g")
        .attr("cursor", "pointer")
        .attr("transform", `translate(${width - 90}, ${margin.top + 10})`)
        .on("click", () => setSelection(null));

      resetButton
        .append("rect")
        .attr("fill", "#2a3444")
        .attr("rx", 4)
        .attr("width", 80)
        .attr("height", 24);

      resetButton
        .append("text")
        .attr("x", 40)
        .attr("y", 16)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8")
        .text("Reset Zoom");
    }
  }, [data, width, height, selection]);

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
      <div
        ref={tooltipRef}
        className="absolute top-5 left-5 pointer-events-none opacity-0 transition-opacity z-50"
        style={{
          backgroundColor: "rgba(26, 34, 52, 0.9)",
          borderRadius: "4px",
          padding: "8px",
        }}
      />
    </div>
  );
});

Chart.displayName = "Chart";

export default Chart;
