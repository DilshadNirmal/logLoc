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

  // Expose reset function to parent
  useImperativeHandle(ref, () => ({
    resetZoom: () => setSelection(null),
  }));

  useEffect(() => {
    if (!data || data.length === 0) return;

    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear previous renders
    const svg = d3
      .select(svgRef.current)
      .html("")
      .attr("width", width)
      .attr("height", height);

    // Add dark theme background
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#1a2234")
      .attr("rx", 8);

    // Create scales with initial domains
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

    // Add clip path
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", innerWidth)
      .attr("height", innerHeight);

    // Create brush
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
        // Clear the brush after selection
        d3.select(".brush").call(brush.move, null);
      });

    // Add brush group
    const brushGroup = svg.append("g").attr("class", "brush").call(brush);

    // Add grid lines
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

    // Create line generator
    const line = d3
      .line()
      .x((d) => xScale(new Date(d.timestamp)))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add the line path with clip path
    const path = svg
      .append("g")
      .attr("clip-path", "url(#clip)")
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#0ea5e9")
      .attr("stroke-width", 2)
      .attr("d", line);

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

    // Add reset zoom button
    if (selection) {
      const resetButton = svg
        .append("g")
        .attr("cursor", "pointer")
        .attr(
          "transform",
          `translate(${width - margin.right - 60}, ${margin.top + 20})`
        )
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

    // Rest of your tooltip code remains the same
    // ... (keep existing tooltip implementation)
  }, [data, width, height, selection]);

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none opacity-0 transition-opacity z-50"
      />
    </div>
  );
});

Chart.displayName = "Chart";

export default Chart;
