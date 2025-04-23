import { useRef, useEffect, forwardRef } from "react";
import * as d3 from "d3";

const Chart = forwardRef(({ data, width, height }, ref) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  console.log(data);

  useEffect(() => {
    if (!data || data.length === 0 || !width || !height) {
      console.log("Missing required props:", { data, width, height });
      return;
    }

    // Clear previous chart
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Setup dimensions
    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // chart container with background
    svg
      .attr("width", width)
      .attr("height", height)
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#1a2234")
      .attr("rx", 8);

    // Create chart group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Get all timestamps and values
    const allTimestamps = data.flatMap((sensor) =>
      sensor.data.map((d) => new Date(d.timestamp))
    );

    const allValues = data
      .flatMap((sensor) => sensor.data.map((d) => d.value))
      .filter((v) => v !== null && !isNaN(v));

    if (allValues.length === 0) {
      console.log("No valid data points");
      return;
    }

    // Create scales with proper domains
    const xScale = d3
      .scaleTime()
      .domain([d3.min(allTimestamps), d3.max(allTimestamps)])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(allValues) * 1.1])
      .range([innerHeight, 0]);

    // zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([1, 10])
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on("zoom", zoomed);

    function zoomed(event) {
      const newXScale = event.transform.rescaleX(xScale);
      const newYScale = event.transform.rescaleY(yScale);

      // Update axes
      g.select(".x-axis").call(
        d3.axisBottom(newXScale).tickFormat(d3.timeFormat("%H:%M"))
      );
      g.select(".y-axis").call(
        d3.axisLeft(newYScale).tickFormat((d) => `${d}mV`)
      );

      // Update grid
      g.select(".x-grid").call(
        d3.axisBottom(newXScale).tickSize(-innerHeight).tickFormat("")
      );
      g.select(".y-grid").call(
        d3.axisLeft(newYScale).tickSize(-innerWidth).tickFormat("")
      );

      // Update lines
      g.selectAll(".line").attr("d", (d) => {
        const line = d3
          .line()
          .x((d) => newXScale(new Date(d.timestamp)))
          .y((d) => newYScale(d.value))
          .defined((d) => d.value !== null && !isNaN(d.value))
          .curve(d3.curveMonotoneX);
        return line(d);
      });

      // Update tooltip points
      tooltipPoints.forEach((point) => point.style("opacity", 0));
      tooltip.style("opacity", 0);
    }

    // zoom to svg
    svg.call(zoom);

    // Add grid
    g.append("g")
      .attr("class", "x-grid grid")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat(""))
      .attr("color", "#2a3444")
      .attr("stroke-opacity", 0.5);

    g.append("g")
      .attr("class", "y-grid grid")
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(""))
      .attr("color", "#2a3444")
      .attr("stroke-opacity", 0.5);

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%H:%M")))
      .attr("color", "#e9ebed");

    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat((d) => `${d}mV`))
      .attr("color", "#e9ebed");

    // Create line generator
    const line = d3
      .line()
      .x((d) => xScale(new Date(d.timestamp)))
      .y((d) => yScale(d.value))
      .defined((d) => d.value !== null && !isNaN(d.value))
      .curve(d3.curveMonotoneX); // Add curve for smoother lines

    // Add lines for each sensor
    const colors = [
      "#0ea5e9",
      "#f43f5e",
      "#22c55e",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
      "#14b8a6",
      "#f97316",
    ];

    // Draw lines
    data.forEach((sensor, i) => {
      // Filter out invalid data points
      const validData = sensor.data.filter(
        (d) => d.value !== null && !isNaN(d.value) && d.timestamp
      );

      if (validData.length > 0) {
        g.append("path")
          .datum(validData)
          .attr("fill", "none")
          .attr("stroke", colors[i % colors.length])
          .attr("stroke-width", 2)
          .attr("d", line);

        // Add sensor label
        g.append("text")
          .attr("x", innerWidth + 5)
          .attr("y", 20 + i * 20)
          .attr("fill", colors[i % colors.length])
          .attr("font-size", "12px")
          .text(`S${sensor.sensorId}`);
      }
    });

    // Add tooltip
    const tooltip = d3.select(tooltipRef.current);
    const tooltipLine = g
      .append("line")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1)
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .style("opacity", 0);

    const tooltipPoints = data.map((_, i) =>
      g
        .append("circle")
        .attr("r", 4)
        .attr("fill", colors[i % colors.length])
        .style("opacity", 0)
    );

    // Add hover interaction
    g.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mousemove", function (event) {
        const mouseX = d3.pointer(event)[0];
        const x0 = xScale.invert(mouseX);

        // Find closest data points
        const points = data.map((sensor) => {
          const bisect = d3.bisector((d) => new Date(d.timestamp)).left;
          const i = bisect(sensor.data, x0);
          return sensor.data[i];
        });

        if (points.some((p) => !p)) return;

        // Update tooltip line
        tooltipLine.attr("x1", mouseX).attr("x2", mouseX).style("opacity", 1);

        // Update tooltip points
        points.forEach((point, i) => {
          tooltipPoints[i]
            .attr("cx", mouseX)
            .attr("cy", yScale(point.value))
            .style("opacity", 1);
        });

        // Update tooltip content
        tooltip
          .style("opacity", 1)
          .style("left", `${event.pageX + 15}px`)
          .style("top", `${event.pageY - 28}px`).html(`
            <div class="bg-background/90 p-2 rounded shadow-lg border border-primary/20">
              <div class="text-text/70 text-xs">
                ${new Date(points[0].timestamp).toLocaleString()}
              </div>
              ${points
                .map(
                  (point, i) => `
                <div class="text-[${colors[i % colors.length]}] font-bold">
                  S${data[i].sensorId}: ${point.value.toFixed(2)}mV
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
  }, [data, width, height]);

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none opacity-0 transition-opacity z-50"
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
