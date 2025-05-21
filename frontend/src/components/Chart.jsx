import { useRef, useEffect, useState, memo } from "react";
import * as d3 from "d3";
import { useSignal, useSignals } from "@preact/signals-react/runtime";

const ChartContainer = ({ data }) => {
  useSignals();

  const dataVersion = useSignal(0)

  useEffect(() => {
    dataVersion.value = dataVersion.value + 1;
  }, [data.value])

  if (data.value.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-text">
        no voltage data to display chart...
      </div>
    );
  }

  return <Chart data={data} key={`chart-${dataVersion}-${JSON.stringify(data.value.map(item => item.sensorId))}`} />;
};

const Chart = memo(({ data }) => {
  useSignals();

  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const brushGroupRef = useRef(null);
  const brushRef = useRef(null);
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [zoomState, setZoomState] = useState(null);

  // adding key to force re-renders
  const dataKey = JSON.stringify(
    data.value.map((item) => ({
      id: item.sensorId,
      // Include length and timestamp range to better detect changes
      dataLength: item.data?.length || 0,
      firstTimestamp: item.data?.[0]?.timestamp,
      lastTimestamp: item.data?.[item.data?.length - 1]?.timestamp,
    }))
  );

  useEffect(() => {
    if (!data.value || data.value.length === 0) return;

    // Implement data decimation for large datasets
    const decimateData = (sensorData, threshold = 1000) => {
      if (sensorData.length <= threshold) return sensorData;

      const factor = Math.floor(sensorData.length / threshold);
      return sensorData.filter((_, index) => index % factor === 0);
    };

    // Process data with decimation
    const processedData = data.value.map((sensor) => ({
      ...sensor,
      data: decimateData(sensor.data),
    }));

    // Get the container dimensions from the SVG element itself
    const svgElement = svgRef.current;
    const width = svgElement.clientWidth;
    const height = svgElement.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Background
    svg
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#1a2234")
      .attr("rx", 8);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Adding clipPath to ensure lines don't extend beyond the chart area
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "chart-area-clip")
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("x", 0)
      .attr("y", 0);

    // Process data
    const allTimestamps = processedData.flatMap((sensor) =>
      sensor.data.map((d) => new Date(d.timestamp))
    );
    const allValues = processedData
      .flatMap((sensor) => sensor.data.map((d) => d.value))
      .filter((v) => v !== null && !isNaN(v));

    if (allValues.length === 0) return;

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(allTimestamps))
      .range([0, innerWidth]);

    const yMin = d3.min(allValues);
    const yMax = d3.max(allValues);
    const yPadding = Math.abs((yMax - yMin) * 0.1);

    const yScale = d3
      .scaleLinear()
      .domain([yMin - yPadding, yMax + yPadding])
      .range([innerHeight, 0]);

    // If we have a saved zoom state, apply it
    if (isZoomActive && zoomState) {
      xScale.domain([zoomState.x0, zoomState.x1]);
    }

    const xValue = (d) => {
      // Use timestamp if available, otherwise try to parse the label
      if (d.timestamp) {
        return new Date(d.timestamp);
      } else if (d.label) {
        // Try to parse the label as a date if it's in a standard format
        return new Date(d.label);
      }
      return null;
    };

    // Line generator
    const line = d3
      .line()
      .x((d) => xScale(xValue(d)))
      .y((d) => yScale(d.value))
      .defined((d) => d.value !== null && !isNaN(d.value))
      .curve(d3.curveMonotoneX);

    // Add grid
    g.append("g")
      .attr("class", "x-grid")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat(""))
      .attr("color", "#2a3444")
      .attr("stroke-opacity", 0.5);

    g.append("g")
      .attr("class", "y-grid")
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(""))
      .attr("color", "#2a3444")
      .attr("stroke-opacity", 0.5);

    // Add axes
    const xAxis = g
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%H:%M")))
      .attr("color", "#e9ebed");

    const yAxis = g
      .append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale).tickFormat((d) => `${d}mV`))
      .attr("color", "#e9ebed");

    // Create a group for the lines with clipping applied
    const linesGroup = g.append("g").attr("clip-path", "url(#chart-area-clip)");

    // Draw lines
    const colors = ["#0ea5e9", "#f43f5e", "#22c55e", "#f59e0b", "#8b5cf6"];
    const lines = processedData.map((sensor, i) => {
      const validData = sensor.data.filter(
        (d) => d.value !== null && !isNaN(d.value)
      );
      return linesGroup
        .append("path")
        .datum(validData)
        .attr("fill", "none")
        .attr("stroke", colors[i % colors.length])
        .attr("stroke-width", 2)
        .attr("d", line);
    });

    // Brush/zoom functionality
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on("end", function (event) {
        if (!event.sourceEvent) return;
        brushed(event);
      });

    const brushGroup = g
      .append("g")
      .attr("class", "brush")
      .style("display", isZoomActive ? "block" : "none") // Initially hidden
      .style("pointer-events", "all")
      .call(brush);

    brushGroupRef.current = brushGroup;

    // Properly style brush components
    brushGroup
      .select(".overlay")
      .attr("fill", "none")
      .attr("pointer-events", "all");

    brushGroup
      .select(".selection")
      .attr("fill", "#3b82f6")
      .attr("fill-opacity", 0.3)
      .attr("stroke", "#2563eb")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3");

    brushGroup
      .selectAll(".handle")
      .attr("fill", "#3b82f6")
      .attr("fill-opacity", 0.8);

    function brushed(event) {
      if (!event.selection) {
        // Only reset if this was an explicit clear (like hitting Esc)
        if (event.sourceEvent && event.sourceEvent.type === "keydown") {
          setIsZoomActive(false);
          setZoomRange(null);
          resetZoom();
          return;
        }

        return;
      }

      const [x0, x1] = event.selection.map(xScale.invert);
      setIsZoomActive(true);
      setZoomState({ x0, x1 });
      zoomToRange(x0, x1);
    }

    function zoomToRange(start, end) {
      xScale.domain([start, end]);

      // Update chart elements
      xAxis
        .transition()
        .duration(750)
        .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%H:%M")));

      g.select(".x-grid")
        .transition()
        .duration(750)
        .call(d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat(""));

      lines.forEach((linePath, i) => {
        const validData = processedData[i].data.filter(
          (d) => d.value !== null && !isNaN(d.value)
        );
        linePath.transition().duration(750).attr("d", line(validData));
      });

      // Hide brush after successful zoom
      // brushGroup.style("display", "none");
    }

    function resetZoom() {
      // setZoomState(null); // Clear zoom state
      xScale.domain(d3.extent(allTimestamps));

      xAxis
        .transition()
        .duration(750)
        .call(
          d3.axisBottom(xScale).tickFormat(d3.timeFormat("%d-%B-%y %H:%M"))
        );

      g.select(".x-grid")
        .transition()
        .duration(750)
        .call(d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat(""));

      lines.forEach((linePath, i) => {
        // Fix: Use processedData instead of data
        const validData = processedData[i].data.filter(
          (d) => d.value !== null && !isNaN(d.value)
        );
        linePath.transition().duration(750).attr("d", line(validData));
      });
    }

    // Store brush reference
    brushRef.current = brush;

    // Add zoom controls
    const zoomButtons = svg
      .append("g")
      .attr("transform", `translate(${width - 90}, 5)`);

    // Zoom button
    const zoomBtn = zoomButtons
      .append("g")
      .attr("cursor", "pointer")
      .on("click", () => {
        const newZoomState = !isZoomActive;
        setIsZoomActive(newZoomState);

        if (newZoomState) {
          // Show brush
          brushGroup.style("display", "block");
        } else {
          // Hide brush and reset zoom if active
          brushGroup.style("display", "none");
          if (zoomState) {
            setZoomState(null);
            resetZoom();
          }
        }
      });

    zoomBtn
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 30)
      .attr("height", 24)
      .attr("rx", 6)
      .attr("fill", isZoomActive ? "#3b82f6" : "#2a3444")
      .attr("stroke", "#3b4559")
      .attr("stroke-width", 1);

    zoomBtn
      .append("text")
      .attr("x", 15)
      .attr("y", 17)
      .attr("text-anchor", "middle")
      .attr("fill", "#e9ebed")
      .attr("font-size", "14px")
      .text("🔍");

    // Reset button
    if (isZoomActive) {
      const resetBtn = zoomButtons
        .append("g")
        .attr("transform", "translate(35, 0)")
        .attr("cursor", "pointer")
        .on("click", () => {
          setIsZoomActive(false);
          setZoomState(null);
          resetZoom();
          brushGroup.style("display", "none");
        });

      resetBtn
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 50)
        .attr("height", 24)
        .attr("rx", 6)
        .attr("fill", "#2a3444")
        .attr("stroke", "#3b4559")
        .attr("stroke-width", 1);

      resetBtn
        .append("text")
        .attr("x", 25)
        .attr("y", 17)
        .attr("text-anchor", "middle")
        .attr("fill", "#e9ebed")
        .attr("font-size", "12px")
        .text("Reset");
    }
    // Tooltip setup
    if (!isZoomActive) {
      const tooltip = d3.select(tooltipRef.current);
      const tooltipLine = g
        .append("line")
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", 1)
        .attr("y1", 0)
        .attr("y2", innerHeight)
        .style("opacity", 0);

      const tooltipPoints = data.value.map((_, i) =>
        g
          .append("circle")
          .attr("r", 4)
          .attr("fill", colors[i % colors.length])
          .style("opacity", 0)
      );

      // Hover interaction for tooltips
      const hoverArea = g
        .append("rect")
        .attr("width", innerWidth)
        .attr("height", innerHeight)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("mousemove", function (event) {
          const mouseX = d3.pointer(event)[0];
          const x0 = xScale.invert(mouseX);

          // Find closest data points
          const points = [];
          data.value.forEach((sensor, sensorIndex) => {
            const bisect = d3.bisector((d) => new Date(d.timestamp)).left;
            const index = bisect(sensor.data, x0);

            // Get the points on either side of the cursor
            const d0 = sensor.data[index - 1];
            const d1 = sensor.data[index];

            // If we have points on both sides, find the closest one
            if (d0 && d1) {
              const point =
                x0 - new Date(d0.timestamp) > new Date(d1.timestamp) - x0
                  ? d1
                  : d0;
              points.push({ point, index: sensorIndex });
            } else if (d0) {
              points.push({ point: d0, index: sensorIndex });
            } else if (d1) {
              points.push({ point: d1, index: sensorIndex });
            } else {
              points.push(null);
            }
          });

          if (points.some((p) => !p)) return;

          // Update tooltip line
          tooltipLine.attr("x1", mouseX).attr("x2", mouseX).style("opacity", 1);

          // Update tooltip points
          points.forEach(({ point, index }) => {
            const timestamp = new Date(point.timestamp);
            const value = point.value;

            tooltipPoints[index]
              .attr("cx", xScale(timestamp))
              .attr("cy", yScale(value))
              .style("opacity", 1);
          });

          // Update tooltip content
          tooltip
            .style("opacity", 1)
            .style("left", `${event.pageX - 994}px`)
            .style("top", `${event.pageY - 750}px`).html(`
            <div style="background: rgba(26,34,52,0.9); padding: 6px; border-radius: 4px;">
              <div style="color: #e9ebed; font-size: 10px; opacity: 0.7;">
                ${new Date(points[0].point.timestamp).toLocaleString()}
              </div>
              ${points
                .map(
                  ({ point, index }) => `
                <div style="color: ${
                  colors[index % colors.length]
                }; font-weight: bold;">
                  S${data.value[index].sensorId}: ${point.value.toFixed(2)}mV
                </div>
              `
                )
                .join("")}
            </div>
          `);
        })
        .on("mouseleave", () => {
          tooltipLine.style("opacity", 0);
          tooltipPoints.forEach((point) => point.style("opacity", 0));
          tooltip.style("opacity", 0);
        });

      // Bring tooltip elements to front
      tooltipLine.raise();
      tooltipPoints.forEach((point) => point.raise());
      hoverArea.raise();
    }

    lines.forEach((line) => line.raise());
    if (brushGroup) brushGroup.raise();

    // Keyboard support
    d3.select(document).on("keydown", function (event) {
      if (event.key === "Escape" && isZoomActive) {
        setIsZoomActive(false);
        setZoomRange(null);
        resetZoom();
        brushGroup.style("display", "none");
      }
    });

    // Clean up
    return () => {
      d3.select(document).on("keydown", null);
    };
  }, [data.value, dataKey, zoomState, isZoomActive]);

  return (
    <>
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ minHeight: "250px" }}
      />
      <div
        ref={tooltipRef}
        className="absolute bg-background/90 border border-primary/30 rounded-md p-2 text-xs pointer-events-none"
      />
    </>
  );
});

Chart.displayName = "Chart";

export default ChartContainer;
