import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const dataLink =
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

const width = 1024;
const height = 500;
const legendHeight = 60;
const legendWidth = 400;
const margin = { top: 30, bottom: 30, left: 80, right: 40 };
const heatColors = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "violet",
].reverse();
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const subheading = d3.select("#description");
const tooltip = d3
  .select("#graph")
  .append("div")
  .attr("id", "tooltip")
  .style("position", "absolute");

const svg = d3
  .select("#graph")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom + legendHeight);

d3.json(dataLink).then((data) => {
  console.log(data);
  // Parse data
  const baseTemp = +data.baseTemperature;
  const parsedData = data.monthlyVariance.map((d) => {
    return {
      year: d.year,
      month: d.month - 1,
      variance: d.variance,
    };
  });
  const years = parsedData.map((d) => d.year);
  const months = parsedData.map((d) => d.month);
  const variances = parsedData.map((d) => d.variance);

  // Create subheading
  // Format with min/max years in range and base temperature of graph
  subheading.html(
    d3.min(years) +
      " - " +
      d3.max(years) +
      ", base temperature " +
      baseTemp +
      "&deg;C"
  );

  // Create legend
  const legend = svg
    .append("g")
    .attr("id", "legend")
    .attr("width", legendWidth)
    .attr("height", legendHeight + margin.bottom)
    .attr(
      "transform",
      `translate(${margin.left}, ${margin.top + height + legendHeight})`
    );

  // Create legend scales for temperature and colors
  const tempScale = d3
    .scaleLinear()
    .domain([baseTemp + d3.min(variances), baseTemp + d3.max(variances)])
    .range([margin.left, margin.left + legendWidth]);
  const colorScale = d3
    .scaleThreshold()
    .domain(
      (function (min, max, colors) {
        const step = (max - min) / colors.length;

        return colors.map((d, i) => min + step * i);
      })(baseTemp + d3.min(variances), baseTemp + d3.max(variances), heatColors)
    )
    .range(heatColors);

  // Create legend axis based on temperature
  const legendAxis = d3
    .axisBottom(tempScale)
    .tickValues(colorScale.domain())
    .tickFormat(d3.format(".1f"))
    .tickSize(10);
  legend.append("g").call(legendAxis);
  //.attr("transform", `translate(0, ${legendHeight + margin.bottom})`);

  // Create legend rectangles based on temperature and filled by colors
  legend
    .append("g")
    .selectAll("rect")
    .data(colorScale.domain())
    .enter()
    .append("rect")
    .attr("x", (d) => tempScale(d))
    .attr("y", -margin.bottom)
    .attr(
      "width",
      (d, i) =>
        tempScale(colorScale.domain()[1]) - tempScale(colorScale.domain()[0])
    )
    .attr("height", legendHeight - margin.bottom)
    .attr("fill", (d) => colorScale(d - 0.01));

  // Create graph
  const graph = svg.append("g").attr("width", width).attr("height", height);
  // Create scales for x and y
  const xScale = d3
    .scaleBand()
    .domain(years)
    .range([margin.left, margin.left + width]);
  const yScale = d3
    .scaleBand()
    .domain(monthNames)
    .range([margin.top, margin.top + height]);

  // Create x and y axes
  const xAxis = d3
    .axisBottom(xScale)
    .tickValues(xScale.domain().filter((year) => year % 10 === 0));
  graph
    .append("g")
    .call(xAxis)
    .attr("transform", `translate(0, ${margin.top + height})`)
    .attr("id", "x-axis");

  const yAxis = d3.axisLeft(yScale);
  graph
    .append("g")
    .call(yAxis)
    .attr("transform", `translate(${margin.left}, 0)`)
    .attr("id", "y-axis");

  // Create rectangles
  const rectangles = graph
    .selectAll("rect")
    .data(parsedData)
    .enter()
    .append("rect")
    .attr("class", "cell")
    .attr("data-month", (d) => d.month)
    .attr("data-year", (d) => d.year)
    .attr("data-temp", (d) => baseTemp + d.variance)
    .attr("x", (d) => xScale(d.year))
    .attr("y", (d) => yScale(monthNames[d.month]))
    .attr("height", (d) => yScale.bandwidth(d.month))
    .attr("width", (d) => xScale.bandwidth(d.year))
    .attr("fill", (d) => colorScale(baseTemp + d.variance));

  // Add tooltip function to each rectangle
  rectangles
    .on("mouseover", (e) => {
      const elem = d3.select(e.target);

      tooltip
        .attr("data-year", elem.attr("data-year"))
        .style("top", e.pageY + 8 + "px")
        .style("left", e.pageX + 15 + "px")
        .style("opacity", 0.75)
        .html(
          monthNames[elem.attr("data-month")] +
            " " +
            elem.attr("data-year") +
            "<br>" +
            elem.attr("data-temp") +
            "&deg;C"
        );
    })
    .on("mouseout", (e) => {
      tooltip.style("opacity", 0);
    });
});
