import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const Gauge = ({ value = 0, min = -10, max = 10, label = "", units = "" }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    // Set up dimensions
    const width = 200;
    const height = 200;
    const margin = 20;
    const radius = Math.min(width, height) / 2 - margin;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Create scale for angle conversion
    const angleScale = d3
      .scaleLinear()
      .domain([min, max])
      .range([-Math.PI / 1.2, Math.PI / 1.2]);

    // Create arc generator
    const arc = d3
      .arc()
      .innerRadius(radius - 20)
      .outerRadius(radius)
      .startAngle(-Math.PI / 1.2)
      .endAngle(Math.PI / 1.2);

    // Background arc
    svg
      .append("path")
      .datum({ endAngle: Math.PI / 1.2, startAngle: -Math.PI / 1.2 })
      .style("fill", "#1330f4cc")
      .attr("d", arc);

    // Foreground arc (value indicator)
    const foregroundArc = d3
      .arc()
      .innerRadius(radius - 20)
      .outerRadius(radius)
      .startAngle(-Math.PI / 1.2)
      .endAngle(angleScale(value));

    svg.append("path").style("fill", "#409fff").attr("d", foregroundArc);

    // Add needle
    const needleLength = radius - 25;
    const angle = angleScale(value);

    // Create needle shape
    const needlePath = `M -2 0 L ${needleLength * Math.sin(angle)} ${
      -needleLength * Math.cos(angle)
    } L 2 0`;

    svg
      .append("path")
      .attr("d", needlePath)
      .attr("fill", "none")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2);

    // Add center circle
    svg
      .append("circle")
      .attr("r", 4)
      .attr("fill", "#409fff")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1);

    // Add value and units text combined
    svg
      .append("text")
      .attr("y", radius * 0.6) // Move text down
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", "18px")
      .attr("font-weight", "semi-bold")
      .text(`${value.toFixed(2)}`);

    svg
      .append("text")
      .attr("y", radius * 0.8) // Place units below value
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", "12px")
      .text(units);

    // Add label text if provided
    if (label) {
      svg
        .append("text")
        .attr("y", -radius * 0.3)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "#ffffff")
        .attr("font-size", "16px")
        .text(label);
    }

    // Add min and max ticks and labels outside the gauge
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${-radius * 0.9}, ${radius * 0.7})`)
      .style("font-size", "12px")
      .style("fill", "#ffffff")
      .text(min + units);

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${radius * 0.9}, ${radius * 0.7})`)
      .style("font-size", "12px")
      .style("fill", "#ffffff")
      .text(max + units);

    // Add small tick marks
    const tickLength = 8;
    svg
      .append("line")
      .attr("x1", -radius * Math.cos(Math.PI / 1.2))
      .attr("y1", radius * Math.sin(Math.PI / 1.2))
      .attr("x2", -(radius + tickLength) * Math.cos(Math.PI / 1.2))
      .attr("y2", (radius + tickLength) * Math.sin(Math.PI / 1.2))
      .style("stroke", "#ffffff")
      .style("stroke-width", 1);

    svg
      .append("line")
      .attr("x1", radius * Math.cos(Math.PI / 1.2))
      .attr("y1", radius * Math.sin(Math.PI / 1.2))
      .attr("x2", (radius + tickLength) * Math.cos(Math.PI / 1.2))
      .attr("y2", (radius + tickLength) * Math.sin(Math.PI / 1.2))
      .style("stroke", "#ffffff")
      .style("stroke-width", 1);
  }, [value, min, max, label, units]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default Gauge;
