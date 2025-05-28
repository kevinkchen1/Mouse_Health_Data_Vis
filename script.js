// script.js

// Scrollama setup
/*
const scroller = scrollama();

// Dimensions
const margin = { top: 30, right: 50, bottom: 50, left: 50 };
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select("#graphic")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Time scales
const xScale = d3.scaleLinear().range([0, width]).domain([0, 1440]); // minutes in a day
const yScaleActivity = d3.scaleLinear().range([height, 0]).domain([0, 100]); // activity 0-100
const yScaleTemp = d3.scaleLinear().range([height, 0]).domain([35, 40]); // temp in °C approx

// Line generators
const lineActivity = d3.line()
  .x(d => xScale(d.minute))
  .y(d => yScaleActivity(d.value))
  .curve(d3.curveMonotoneX);

const lineTemp = d3.line()
  .x(d => xScale(d.minute))
  .y(d => yScaleTemp(d.value))
  .curve(d3.curveMonotoneX);

let dataReady = null;

// Calculate average helper (assumes each CSV has 'minute' and multiple mouse columns)
function calculateAverage(data) {
  // Data is array of objects, keys: minute, mouse1, mouse2, ...
  // For each minute, average across mouse columns
  return data.map(row => {
    let sum = 0;
    let count = 0;
    for (const key in row) {
      if (key !== "minute") {
        sum += +row[key];
        count++;
      }
    }
    return { minute: row.minute, value: sum / count };
  });
}

// Draw initial axes
svg.append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(xScale).ticks(12).tickFormat(d => `${Math.floor(d / 60)}h`));

svg.append("g")
  .attr("class", "y-axis-left")
  .call(d3.axisLeft(yScaleActivity));

function updateAxes(type) {
  if (type === "activity") {
    svg.select(".y-axis-left")
      .transition()
      .duration(500)
      .call(d3.axisLeft(yScaleActivity));
    svg.select(".y-axis-right").remove();
  } else if (type === "temperature") {
    svg.select(".y-axis-left").remove();
    if (svg.select(".y-axis-right").empty()) {
      svg.append("g")
        .attr("class", "y-axis-right")
        .attr("transform", `translate(${width},0)`)
        .call(d3.axisRight(yScaleTemp));
    }
  }
}

function drawLine(data, lineClass, lineGen, stroke, widthStroke) {
  let line = svg.select(`.${lineClass}`);
  if (line.empty()) {
    line = svg.append("path")
      .attr("class", lineClass)
      .attr("fill", "none")
      .attr("stroke", stroke)
      .attr("stroke-width", widthStroke)
      .attr("d", lineGen(data));
  } else {
    line.transition()
      .duration(1000)
      .attr("stroke", stroke)
      .attr("stroke-width", widthStroke)
      .attr("d", lineGen(data));
  }
}

// Scrollama step handler
function handleStepEnter(response) {
  const index = response.index;
  d3.selectAll(".step").classed("is-active", (d, i) => i === index);

  if (!dataReady) return;

  switch (index) {
    case 0:
      // Intro: Light background, no data plot yet
      d3.select("#graphic").style("background", "linear-gradient(to bottom, #e0eafc, #cfdef3)");
      svg.selectAll("path").remove();
      svg.select(".y-axis-right").remove();
      updateAxes("activity");
      break;
    case 1:
      // Lights out: activity rises (male average)
      d3.select("#graphic").style("background", "linear-gradient(to bottom, #1a1a2e, #0f3460)");
      drawLine(dataReady.act.male, "line-activity", lineActivity, "#0f3460", 3);
      svg.select(".y-axis-right").remove();
      updateAxes("activity");
      break;
    case 2:
      // Circadian clock (placeholder)
      // For simplicity, keep activity line and maybe highlight
      drawLine(dataReady.act.male, "line-activity", lineActivity, "#0f3460", 3);
      break;
    case 3:
      // Temperature rises: overlay temp line male
      drawLine(dataReady.act.male, "line-activity", lineActivity, "#0f3460", 3);
      drawLine(dataReady.temp.male, "line-temp", lineTemp, "#f53855", 2);
      updateAxes("temperature");
      break;
    case 4:
      // Female behavior day 2 - female activity and temp
      drawLine(dataReady.act.female, "line-activity", lineActivity, "#f53855", 3);
      drawLine(dataReady.temp.female, "line-temp", lineTemp, "#ff6f91", 2);
      updateAxes("temperature");
      break;
    case 5:
      // Estrus cycle animation placeholder (not implemented)
      break;
    case 6:
      // Compare genders - both lines
      drawLine(dataReady.act.male, "line-activity-male", lineActivity, "#0f3460", 3);
      drawLine(dataReady.act.female, "line-activity-female", lineActivity, "#f53855", 3);
      svg.select(".line-temp").remove();
      updateAxes("activity");

      // Legend
      svg.selectAll(".legend").remove();
      const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(20,20)");

      legend.append("rect").attr("width", 15).attr("height", 15).attr("fill", "#0f3460");
      legend.append("text").attr("x", 20).attr("y", 12).text("Male").attr("fill", "#0f3460").style("font-weight", "600");

      legend.append("rect").attr("width", 15).attr("height", 15).attr("fill", "#f53855").attr("transform", "translate(100,0)");
      legend.append("text").attr("x", 120).attr("y", 12).text("Female").attr("fill", "#f53855").style("font-weight", "600");
      break;
    case 7:
      // Interactive mouse choice (not implemented here)
      break;
    case 8:
      // Summary insight, reset background
      d3.select("#graphic").style("background", "linear-gradient(to bottom, #e0eafc, #cfdef3)");
      svg.selectAll("path").remove();
      svg.select(".y-axis-right").remove();
      updateAxes("activity");
      break;
  }
}

// Load and process data
Promise.all([
  d3.csv("data/MaleTemp.csv", d3.autoType),
  d3.csv("data/FemTemp.csv", d3.autoType),
  d3.csv("data/MaleAct.csv", d3.autoType),
  d3.csv("data/FemAct.csv", d3.autoType)
]).then(([maleTemp, femTemp, maleAct, femAct]) => {
  dataReady = {
    temp: {
      male: calculateAverage(maleTemp),
      female: calculateAverage(femTemp)
    },
    act: {
      male: calculateAverage(maleAct),
      female: calculateAverage(femAct)
    }
  };
  // Setup Scrollama after data is ready
  initScrollama();
});

// Setup Scrollama and window resize handler
function initScrollama() {
  scroller
    .setup({
      step: ".step",
      offset: 0.5,
      debug: false
    })
    .onStepEnter(handleStepEnter);

  window.addEventListener("resize", scroller.resize);
}
*/
// Globals
const svg = d3.select("#chart");
const width = 900;
const height = 400;
const margin = { top: 30, right: 30, bottom: 50, left: 60 };

let dataReady = null;
let selectedMouse = null;

// Scales
const xScale = d3.scaleLinear().range([margin.left, width - margin.right]);
const yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);

// Line generators
const lineTemp = d3.line()
  .x((d, i) => xScale(i))
  .y(d => yScale(d.temp));

const lineAct = d3.line()
  .x((d, i) => xScale(i))
  .y(d => yScale(d.act));

// Axes
const xAxis = svg.append("g")
  .attr("transform", `translate(0,${height - margin.bottom})`);

const yAxis = svg.append("g")
  .attr("transform", `translate(${margin.left},0)`);

svg.append("text")
  .attr("id", "yLabel")
  .attr("transform", `translate(20, ${height / 2}) rotate(-90)`)
  .attr("text-anchor", "middle")
  .attr("font-weight", "bold")
  .attr("fill", "#fff")
  .text("");

// Path elements for lines
const pathTemp = svg.append("path")
  .attr("fill", "none")
  .attr("stroke", "#FF69B4") // pink for temp
  .attr("stroke-width", 2);

const pathAct = svg.append("path")
  .attr("fill", "none")
  .attr("stroke", "#1E90FF") // blue for activity
  .attr("stroke-width", 2)
  .attr("opacity", 0.7);

// Function to calculate averages (over all mice in dataset)
function calculateAverage(data) {
  // data = array of objects (rows) with mouse columns
  const avg = [];
  data.forEach(row => {
    let sum = 0;
    let count = 0;
    for (const key in row) {
      if (key !== "minute" && key !== "time") {
        sum += +row[key];
        count++;
      }
    }
    avg.push(sum / count);
  });
  return avg;
}

// Function to extract individual mouse data as array of values
function getMouseData(data, mouseID) {
  return data.map(row => +row[mouseID]);
}

// Update chart to show averages or selected mouse
function updateChart() {
  if (!dataReady) return;

  let tempData, actData;

  if (selectedMouse) {
    // Find gender by mouseID prefix
    if (selectedMouse.startsWith("M")) {
      tempData = getMouseData(dataReady.temp.maleRaw, selectedMouse);
      actData = getMouseData(dataReady.act.maleRaw, selectedMouse);
    } else if (selectedMouse.startsWith("F")) {
      tempData = getMouseData(dataReady.temp.femaleRaw, selectedMouse);
      actData = getMouseData(dataReady.act.femaleRaw, selectedMouse);
    } else {
      console.warn("Unrecognized mouse ID:", selectedMouse);
      return;
    }
  } else {
    // Use averages
    tempData = dataReady.temp.maleAvg.map((v, i) => (v + dataReady.temp.femaleAvg[i]) / 2);
    actData = dataReady.act.maleAvg.map((v, i) => (v + dataReady.act.femaleAvg[i]) / 2);
  }

  // Compose data array for lines [{temp, act}, ...]
  const combined = tempData.map((t, i) => ({ temp: t, act: actData[i] }));

  // Update scales
  xScale.domain([0, combined.length - 1]);
  yScale.domain([0, d3.max(combined, d => Math.max(d.temp, d.act)) * 1.1]);

  xAxis.call(d3.axisBottom(xScale).ticks(10).tickFormat(d => `${Math.floor(d/60)}h`));
  yAxis.call(d3.axisLeft(yScale));

  // Update lines
  pathTemp.datum(combined)
    .transition()
    .duration(800)
    .attr("d", lineTemp)
    .attr("stroke", "#FF69B4");

  pathAct.datum(combined)
    .transition()
    .duration(800)
    .attr("d", lineAct)
    .attr("stroke", "#1E90FF");

  // Update label
  svg.select("#yLabel").text(selectedMouse ? `Mouse ${selectedMouse} Data` : "Average Temp & Activity");
}

// Scrollama setup
const scroller = scrollama();

scroller
  .setup({
    step: ".step",
    offset: 0.5,
    debug: false,
  })
  .onStepEnter(({ index, element }) => {
    d3.selectAll(".step").classed("is-active", (d, i) => i === index);

    // Logic to update chart based on scroll step
    if (index === 7) {
      d3.select("#mouse-picker-container").style("display", "block");
    } else {
      d3.select("#mouse-picker-container").style("display", "none");
      selectedMouse = null;
      updateChart();
    }
  });

window.addEventListener("resize", scroller.resize);

// Load and process the data
Promise.all([
  d3.csv("data/MaleTemp.csv", d3.autoType),
  d3.csv("data/FemTemp.csv", d3.autoType),
  d3.csv("data/MaleAct.csv", d3.autoType),
  d3.csv("data/FemAct.csv", d3.autoType)
]).then(([maleTemp, femTemp, maleAct, femAct]) => {
  // Store raw data for mouse-specific selection
  dataReady = {
    temp: {
      maleRaw: maleTemp,
      femaleRaw: femTemp,
      maleAvg: calculateAverage(maleTemp),
      femaleAvg: calculateAverage(femTemp)
    },
    act: {
      maleRaw: maleAct,
      femaleRaw: femAct,
      maleAvg: calculateAverage(maleAct),
      femaleAvg: calculateAverage(femAct)
    }
  };

  // Fill mouse picker dropdown
  const select = d3.select("#mousePicker");
  const maleMouseIDs = Object.keys(maleTemp[0]).filter(k => k !== "minute" && k !== "time");
  const femaleMouseIDs = Object.keys(femTemp[0]).filter(k => k !== "minute" && k !== "time");

  const allMouseIDs = maleMouseIDs.concat(femaleMouseIDs);

  allMouseIDs.forEach(id => {
    select.append("option").attr("value", id).text(id);
  });

  select.on("change", function () {
    selectedMouse = this.value || null;
    updateChart();
  });

  // Initial chart draw with averages
  updateChart();
}).catch(err => {
  console.error("Error loading data:", err);
});
