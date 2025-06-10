import { useRef, useEffect, useState, memo, useMemo } from "react";
import * as d3 from "d3";
import { useSignals } from "@preact/signals-react/runtime";
import {
  dashboardChartData,
  isDashboardChartLoading,
  dashboardChartError,
  dashboardSelectedSide,
  dashboardSelectedSensors,
  dashboardTimeRange,
  fetchDashboardChartData,
} from "../signals/dashboardSignals";

import {
  chartData as analyticsGlobalChartData,
  isLoading as isAnalyticsGlobalLoading,
} from "../signals/voltage";

const ChartContainer = ({ source = "dashboard" }) => {
  useSignals();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);

  // Determine data source based on 'source' prop
  const isDashboardSource = source === "dashboard";

  const side = isDashboardSource ? dashboardSelectedSide.value : null;
  const sensorsArray = isDashboardSource
    ? dashboardSelectedSensors.value
    : null;
  const timeRange = isDashboardSource ? dashboardTimeRange.value : null;

  // Select the correct signals based on the source
  const currentChartData = isDashboardSource
    ? dashboardChartData.value
    : analyticsGlobalChartData.value;
  const isLoading = isDashboardSource
    ? isDashboardChartLoading.value
    : isAnalyticsGlobalLoading.value;
  const error = isDashboardSource ? dashboardChartError.value : null;

  // Fetch data immediately and set up interval
  useEffect(() => {
    if (!isDashboardSource) return;

    const fetchData = async () => {
      if (isRefreshing) return; // Don't overlap requests

      setIsRefreshing(true);
      try {
        await fetchDashboardChartData();
      } catch (err) {
        console.error("Error refreshing chart data:", err);
      } finally {
        setIsRefreshing(false);
      }
    };

    // Initial fetch
    fetchData();

    // Set up interval for auto-refresh (every 2 seconds)
    refreshIntervalRef.current = setInterval(fetchData, 5000);

    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [side, JSON.stringify(sensorsArray), timeRange]);

  // Combine loading states
  const showLoading = isLoading || (isDashboardSource && isRefreshing);

  // UI for loading, error, and no data states
  if (showLoading && currentChartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-text">
        Loading chart data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-500">
        Error:{" "}
        {typeof error === "string"
          ? error
          : error.message || "Unknown chart error"}
      </div>
    );
  }

  if (!showLoading && currentChartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-text">
        No voltage data to display for the selected criteria.
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Loading overlay that appears on top of the chart during refreshes */}
      {showLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
          <div className="text-text">
            {isDashboardSource ? "Refreshing data..." : "Loading chart..."}
          </div>
        </div>
      )}

      <Chart chartDataArray={currentChartData} />
    </div>
  );
};

const Chart = memo(({ chartDataArray }) => {
  useSignals();
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [zoomState, setZoomState] = useState(null);
  const d3Refs = useRef({
    xScale: null,
    yScale: null,
    xAxis: null,
    yAxis: null,
    lines: [],
    brushGroup: null,
    tooltipLine: null,
    tooltipPoints: [],
  });

  const dataKey = useMemo(
    () =>
      chartDataArray.map((item) => ({
        id: item.sensorId,
        length: item.data?.length || 0,
        first: item.data?.[0]?.timestamp,
        last: item.data?.[item.data?.length - 1]?.timestamp,
        zoom: isZoomActive ? `${zoomState?.x0}-${zoomState?.x1}` : "full",
      })),
    [chartDataArray, isZoomActive, zoomState]
  );

  useEffect(() => {
    if (!chartDataArray || chartDataArray.length === 0) return;

    const decimateData = (data, threshold = 1000) => {
      if (data.length <= threshold) return data;
      const factor = Math.floor(data.length / threshold);
      return data.filter((_, i) => i % factor === 0);
    };

    const processedData = chartDataArray.map((sensor) => ({
      ...sensor,
      data: decimateData(sensor.data),
    }));

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.selectAll("*").remove();

    svg
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#1a2234")
      .attr("rx", 8);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "chart-clip")
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight);

    const allTimestamps = processedData.flatMap((s) =>
      s.data.map((d) => new Date(d.timestamp))
    );
    const allValues = processedData
      .flatMap((s) => s.data.map((d) => d.value))
      .filter((v) => v != null);

    if (allValues.length === 0) return;

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

    if (isZoomActive && zoomState) {
      xScale.domain([zoomState.x0, zoomState.x1]);
    }

    d3Refs.current.xScale = xScale;
    d3Refs.current.yScale = yScale;

    const line = d3
      .line()
      .x((d) => xScale(new Date(d.timestamp)))
      .y((d) => yScale(d.value))
      .defined((d) => d.value !== null)
      .curve(d3.curveMonotoneX);

    g.append("g")
      .attr("class", "grid x-grid")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat(""))
      .attr("color", "#2a3444");

    g.append("g")
      .attr("class", "grid y-grid")
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(""))
      .attr("color", "#2a3444");

    const xAxis = g
      .append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%d %b %H:%M")))
      .attr("color", "#fff");
    d3Refs.current.xAxis = xAxis;

    const yAxis = g
      .append("g")
      .attr("class", "axis y-axis")
      .call(d3.axisLeft(yScale).tickFormat((d) => `${d}mV`))
      .attr("color", "#fff");
    d3Refs.current.yAxis = yAxis;

    const linesGroup = g.append("g").attr("clip-path", "url(#chart-clip)");
    const colors = ["#0ea5e9", "#f43f5e", "#22c55e", "#f59e0b", "#8b5cf6"];

    const lines = processedData.map((sensor, i) => {
      const validData = sensor.data.filter((d) => d.value !== null);
      return linesGroup
        .append("path")
        .datum(validData)
        .attr("fill", "none")
        .attr("stroke", colors[i % colors.length])
        .attr("stroke-width", 2)
        .attr("d", line);
    });
    d3Refs.current.lines = lines;

    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on("end", handleBrushEnd);

    const brushGroup = g
      .append("g")
      .attr("class", "brush")
      .style("display", isZoomActive ? "block" : "none")
      .call(brush);
    d3Refs.current.brushGroup = brushGroup;

    brushGroup
      .select(".selection")
      .attr("fill", "#3b82f6")
      .attr("fill-opacity", 0.3);
    brushGroup.selectAll(".handle").attr("fill", "#3b82f6");

    addZoomControls(svg, width, isZoomActive, setIsZoomActive, handleResetZoom);

    // TOOLTIP IMPLEMENTATION
    if (!isZoomActive) {
      const tooltip = d3.select(tooltipRef.current);
      const tooltipLine = g
        .append("line")
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", 1)
        .attr("y1", 0)
        .attr("y2", innerHeight)
        .style("opacity", 0);
      d3Refs.current.tooltipLine = tooltipLine;

      const tooltipPoints = processedData.map((_, i) =>
        g
          .append("circle")
          .attr("r", 4)
          .attr("fill", colors[i % colors.length])
          .style("opacity", 0)
      );
      d3Refs.current.tooltipPoints = tooltipPoints;

      const hoverArea = g
        .append("rect")
        .attr("width", innerWidth)
        .attr("height", innerHeight)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("mousemove", function (event) {
          const mouseX = d3.pointer(event)[0];
          const x0 = xScale.invert(mouseX);

          const points = [];
          processedData.forEach((sensor, sensorIndex) => {
            const bisect = d3.bisector((d) => new Date(d.timestamp)).left;
            const index = bisect(sensor.data, x0);

            const d0 = sensor.data[index - 1];
            const d1 = sensor.data[index];

            let point;
            if (d0 && d1) {
              point =
                x0 - new Date(d0.timestamp) > new Date(d1.timestamp) - x0
                  ? d1
                  : d0;
            } else if (d0) {
              point = d0;
            } else if (d1) {
              point = d1;
            }

            if (point) points.push({ point, index: sensorIndex });
          });

          if (points.length === 0) return;

          tooltipLine.attr("x1", mouseX).attr("x2", mouseX).style("opacity", 1);

          points.forEach(({ point, index }) => {
            tooltipPoints[index]
              .attr("cx", xScale(new Date(point.timestamp)))
              .attr("cy", yScale(point.value))
              .style("opacity", 1);
          });

          const svgRect = svgRef.current.getBoundingClientRect();

          tooltip
            .style("opacity", 1)
            .style("left", `${event.pageX - svgRect.left + 10}px`)
            .style("top", `${event.pageY - svgRect.top + 10}px`).html(`
                                   <div class="bg-gray-900/90 p-2 rounded border border-gray-700">
                                     <div class="text-xs text-gray-300">
                                       ${new Date(
                                         points[0].point.timestamp
                                       ).toLocaleString()}
                                     </div>
                                     ${points
                                       .map(
                                         ({ point, index }) => `
                                       <div class="text-sm" style="color: ${
                                         colors[index % colors.length]
                                       }">
                                         S${
                                           processedData[index].sensorId
                                         }: ${point.value.toFixed(2)}mV
                                       </div>
                                     `
                                       )
                                       .join("")}
                                   </div>
                                 `);
        })
        .on("mouseleave", () => {
          tooltipLine.style("opacity", 0);
          tooltipPoints.forEach((p) => p.style("opacity", 0));
          tooltip.style("opacity", 0);
        });
    }

    d3.select(document).on("keydown", handleKeyDown);

    return () => {
      d3.select(document).on("keydown", null);
    };
  }, [dataKey]);

  // Brush handler
  const handleBrushEnd = (event) => {
    if (!event.selection) {
      if (event.sourceEvent?.type === "keydown") {
        handleResetZoom();
      }
      return;
    }

    const [x0, x1] = event.selection.map(d3Refs.current.xScale.invert);
    setIsZoomActive(true);
    setZoomState({ x0, x1 });
    updateZoom(x0, x1);
  };

  // Update zoom state
  const updateZoom = (x0, x1) => {
    const { xScale, xAxis, lines, brushGroup } = d3Refs.current;
    if (!xScale || !xAxis) return;

    xScale.domain([x0, x1]);

    xAxis
      .transition()
      .duration(750)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%d %b %H:%M")));

    lines.forEach((line) => {
      line
        .transition()
        .duration(750)
        .attr(
          "d",
          d3
            .line()
            .x((d) => xScale(new Date(d.timestamp)))
            .y((d) => d3Refs.current.yScale(d.value))
            .defined((d) => d.value !== null)
            .curve(d3.curveMonotoneX)
        );
    });

    brushGroup?.style("display", "none");
  };

  // Reset zoom
  const handleResetZoom = () => {
    setIsZoomActive(false);
    setZoomState(null);

    const { xScale, xAxis, lines } = d3Refs.current;
    if (!xScale || !xAxis) return;

    const allTimestamps = chartDataArray.flatMap((s) =>
      s.data.map((d) => new Date(d.timestamp))
    );
    xScale.domain(d3.extent(allTimestamps));

    xAxis
      .transition()
      .duration(750)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%d %b %H:%M")));

    lines.forEach((line) => {
      line
        .transition()
        .duration(750)
        .attr(
          "d",
          d3
            .line()
            .x((d) => xScale(new Date(d.timestamp)))
            .y((d) => d3Refs.current.yScale(d.value))
            .defined((d) => d.value !== null)
            .curve(d3.curveMonotoneX)
        );
    });
  };

  // Keyboard handler
  const handleKeyDown = (event) => {
    if (event.key === "Escape" && isZoomActive) {
      handleResetZoom();
    }
  };

  return (
    <>
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ minHeight: "250px" }}
      />
      <div
        ref={tooltipRef}
        className="absolute bg-gray-900/90 border border-gray-700 rounded p-2 pointer-events-none"
        style={{
          opacity: 0,
          transition: "opacity 0.2s",
          fontSize: "12px",
          zIndex: 10,
        }}
      />
    </>
  );
});

const addZoomControls = (
  svg,
  width,
  isZoomActive,
  setIsZoomActive,
  handleResetZoom
) => {
  const controls = svg
    .append("g")
    .attr("transform", `translate(${width - 90}, 5)`);

  // Zoom button
  const zoomBtn = controls
    .append("g")
    .attr("cursor", "pointer")
    .on("click", () => setIsZoomActive(!isZoomActive));

  zoomBtn
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 30)
    .attr("height", 24)
    .attr("rx", 6)
    .attr("fill", isZoomActive ? "#3b82f6" : "#2a3444");

  zoomBtn
    .append("text")
    .attr("x", 15)
    .attr("y", 17)
    .attr("text-anchor", "middle")
    .text("🔍");

  // Reset button (only when zoomed)
  if (isZoomActive) {
    const resetBtn = controls
      .append("g")
      .attr("transform", "translate(35, 0)")
      .attr("cursor", "pointer")
      .on("click", handleResetZoom);

    resetBtn
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 50)
      .attr("height", 24)
      .attr("rx", 6)
      .attr("fill", "#2a3444");

    resetBtn
      .append("text")
      .attr("x", 25)
      .attr("y", 17)
      .attr("text-anchor", "middle")
      .text("Reset");
  }
};

Chart.displayName = "Chart";

export default ChartContainer;
