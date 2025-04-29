import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const Gauge = ({
  value = 0,
  min = -10,
  max = 10,
  label = "",
  units = "mV",
  colorScheme = ["#1330f4cc", "#409fff"],
}) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Set dimensions
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const radius = (Math.min(width, height) / 2) * 0.8;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Create gauge group
    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Define gauge parameters
    const startAngle = -225;
    const endAngle = 45;
    const angleRange = endAngle - startAngle;

    // Scale for the gauge
    const scale = d3.scaleLinear().domain([min, max]).range([0, 1]);

    // Calculate the value as a percentage of the range
    const valuePercent = scale(value);

    // Create arc generators
    const backgroundArc = d3
      .arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius)
      .startAngle(startAngle * (Math.PI / 180))
      .endAngle(endAngle * (Math.PI / 180));

    const valueArc = d3
      .arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius)
      .startAngle(startAngle * (Math.PI / 180))
      .endAngle((startAngle + valuePercent * angleRange) * (Math.PI / 180));

    // Draw background arc
    g.append("path").attr("d", backgroundArc).attr("fill", colorScheme[0]);

    // Draw value arc
    g.append("path").attr("d", valueArc).attr("fill", colorScheme[1]);

    // Add ticks
    const tickCount = 9;
    const tickData = Array.from(
      { length: tickCount },
      (_, i) => (i * (max - min)) / (tickCount - 1) + min
    );

    tickData.forEach((tick) => {
      const tickPercent = scale(tick);
      const tickAngle = startAngle + tickPercent * angleRange;
      const tickRadians = tickAngle * (Math.PI / 180);
      const innerPoint = [
        Math.cos(tickRadians) * radius * 0.6,
        Math.sin(tickRadians) * radius * 0.6,
      ];
      const outerPoint = [
        Math.cos(tickRadians) * radius * 1.05,
        Math.sin(tickRadians) * radius * 1.05,
      ];

      // Draw tick line
      g.append("line")
        .attr("x1", innerPoint[0])
        .attr("y1", innerPoint[1])
        .attr("x2", outerPoint[0])
        .attr("y2", outerPoint[1])
        .attr("stroke", "#e9ebed")
        .attr("stroke-width", 1.5);

      // Draw tick label
      g.append("text")
        .attr("x", Math.cos(tickRadians) * radius * 1.2)
        .attr("y", Math.sin(tickRadians) * radius * 1.2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "#e9ebed")
        .attr("font-size", `${radius * 0.12}px`)
        .text(tick);
    });

    // Add pointer
    const pointerAngle = startAngle + valuePercent * angleRange;
    const pointerLength = radius * 0.8;
    const pointerWidth = radius * 0.04;
    const pointerRadians = pointerAngle * (Math.PI / 180);

    const pointerPath = `
      M ${-pointerWidth} 0
      L 0 ${-pointerLength}
      L ${pointerWidth} 0
      Z
    `;

    g.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", Math.cos(pointerRadians) * radius * 0.8)
      .attr("y2", Math.sin(pointerRadians) * radius * 0.8)
      .attr("stroke", "#ff3333")
      .attr("stroke-width", 2.5)
      .attr("stroke-linecap", "round");

    // g.append("path")
    //   .attr("d", pointerPath)
    //   .attr("fill", "#e9ebed")
    //   .attr("transform", `rotate(${pointerAngle})`);

    // Add center circle
    g.append("circle")
      .attr("r", radius * 0.08)
      .attr("fill", "#409fff")
      .attr("stroke", "#e9ebed")
      .attr("stroke-width", 2);

    // Add value text
    g.append("text")
      .attr("y", radius * 0.3)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "#409fff")
      .attr("font-size", `${radius * 0.25}px`)
      .attr("font-weight", "bold")
      .text(`${value.toFixed(2)}`);

    // Add units text
    g.append("text")
      .attr("y", radius * 0.5)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "#e9ebed")
      .attr("font-size", `${radius * 0.15}px`)
      .text(units);

    // Add label text if provided
    if (label) {
      g.append("text")
        .attr("y", -radius * 0.3)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "#e9ebed")
        .attr("font-size", `${radius * 0.15}px`)
        .text(label);
    }
  }, [value, min, max, label, units, colorScheme]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default Gauge;
