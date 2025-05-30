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

/*
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
*/

/*
// Globals and constants
const svg = d3.select("#mainChart");
const width = 900;
const height = 400;
const margin = { top: 40, right: 40, bottom: 60, left: 70 };

let dataReady = null;
let selectedMouse = null;

const xScale = d3.scaleLinear().range([margin.left, width - margin.right]);
const yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);

const colorMale = "#1E90FF";
const colorFemale = "#FF69B4";

const svgTempLine = svg.append("path").attr("fill", "none").attr("stroke-width", 3);
const svgActLine = svg.append("path").attr("fill", "none").attr("stroke-width", 3);

const xAxisGroup = svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`);
const yAxisGroup = svg.append("g").attr("transform", `translate(${margin.left},0)`);

svg.append("text")
  .attr("id", "yAxisLabel")
  .attr("transform", `translate(15,${height/2}) rotate(-90)`)
  .attr("text-anchor", "middle")
  .attr("font-weight", "bold")
  .attr("fill", "white");

svg.append("text")
  .attr("id", "chartTitle")
  .attr("x", width/2)
  .attr("y", margin.top / 2)
  .attr("text-anchor", "middle")
  .attr("font-weight", "bold")
  .attr("fill", "white")
  .attr("font-size", "20px");

// Line generators for temperature and activity
const lineTemp = d3.line()
  .x((d,i) => xScale(i))
  .y(d => yScale(d.temp))
  .curve(d3.curveMonotoneX);

const lineAct = d3.line()
  .x((d,i) => xScale(i))
  .y(d => yScale(d.act))
  .curve(d3.curveMonotoneX);

// Scrollama setup
const scroller = scrollama();

// Utility to calculate averages across mice for each minute
function calculateAverage(data) {
  return data.map(row => {
    let sum = 0, count = 0;
    for (const key in row) {
      if (key !== "minute" && key !== "time") {
        sum += +row[key];
        count++;
      }
    }
    return sum / count;
  });
}

// Extract data for one mouse ID
function getMouseData(data, mouseID) {
  return data.map(row => +row[mouseID]);
}

// Compose combined data array {temp, act}
function composeData(tempArray, actArray) {
  return tempArray.map((t, i) => ({ temp: t, act: actArray[i] }));
}

// Update line chart for given data and labels/colors
function updateLineChart(combinedData, options) {
  options = options || {};
  const { tempColor = "#FF69B4", actColor = "#1E90FF", yLabel = "", title = "" } = options;

  xScale.domain([0, combinedData.length - 1]);
  yScale.domain([0, d3.max(combinedData, d => Math.max(d.temp, d.act)) * 1.1]);

  xAxisGroup.transition().duration(800)
    .call(d3.axisBottom(xScale).ticks(8).tickFormat(d => `${Math.floor(d/60)}h`));

  yAxisGroup.transition().duration(800)
    .call(d3.axisLeft(yScale));

  svgTempLine.datum(combinedData)
    .transition().duration(800)
    .attr("stroke", tempColor)
    .attr("d", lineTemp);

  svgActLine.datum(combinedData)
    .transition().duration(800)
    .attr("stroke", actColor)
    .attr("d", lineAct);

  svg.select("#yAxisLabel").text(yLabel);
  svg.select("#chartTitle").text(title);
}

// Draw circadian clock on canvas element
function drawCircadianClock(activityData) {
  const canvas = document.getElementById("circadianClock");
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = 150;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background circle
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.fillStyle = "#001F3F";
  ctx.fill();

  // Draw hour ticks
  for (let h = 0; h < 24; h++) {
    const angle = (h / 24) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + Math.cos(angle) * radius;
    const y1 = cy + Math.sin(angle) * radius;
    const x2 = cx + Math.cos(angle) * (radius - 10);
    const y2 = cy + Math.sin(angle) * (radius - 10);
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Draw activity ring
  for (let m = 0; m < 1440; m++) {
    const angleStart = (m / 1440) * 2 * Math.PI - Math.PI / 2;
    const angleEnd = ((m + 1) / 1440) * 2 * Math.PI - Math.PI / 2;

    const intensity = activityData[m] || 0;
    const color = d3.interpolateBlues(intensity / d3.max(activityData));

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.arc(cx, cy, radius - 20, angleStart, angleEnd);
    ctx.stroke();
  }
}

// Estrus cycle animation helper
let estrusCycleInterval = null;
function startEstrusCycleAnimation(data) {
  const canvas = document.getElementById("circadianClock");
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = 150;

  let frame = 0;
  if (estrusCycleInterval) clearInterval(estrusCycleInterval);

  estrusCycleInterval = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#001F3F";
    ctx.fill();

    // Highlight phase by mod 4 days
    const phase = frame % (4 * 1440);
    const angleStart = (phase / (4 * 1440)) * 2 * Math.PI - Math.PI / 2;
    const angleEnd = ((phase + 360) / (4 * 1440)) * 2 * Math.PI - Math.PI / 2;

    ctx.beginPath();
    ctx.strokeStyle = "#FF1493";
    ctx.lineWidth = 10;
    ctx.arc(cx, cy, radius - 25, angleStart, angleEnd);
    ctx.stroke();

    // Draw male activity ring behind
    for (let m = 0; m < 1440; m++) {
      const angleStart = (m / 1440) * 2 * Math.PI - Math.PI / 2;
      const angleEnd = ((m + 1) / 1440) * 2 * Math.PI - Math.PI / 2;
      const intensity = data[m] || 0;
      const color = d3.interpolateBlues(intensity / d3.max(data));

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.arc(cx, cy, radius - 40, angleStart, angleEnd);
      ctx.stroke();
    }

    frame++;
  }, 100);
}

// Populate mouse picker dropdown
function populateMousePicker(maleData, femaleData) {
  const select = d3.select("#mousePicker");
  select.selectAll("option:not(:first-child)").remove();

  const maleMouseIDs = Object.keys(maleData[0]).filter(k => k !== "minute" && k !== "time");
  const femaleMouseIDs = Object.keys(femaleData[0]).filter(k => k !== "minute" && k !== "time");

  maleMouseIDs.forEach(id => {
    select.append("option").attr("value", id).text(`Male - ${id}`);
  });

  femaleMouseIDs.forEach(id => {
    select.append("option").attr("value", id).text(`Female - ${id}`);
  });

  select.on("change", function() {
    selectedMouse = this.value || null;
    updateChart();
  });
}

// Update chart depending on current step and selected mouse
function updateChart(step = 0) {
  if (!dataReady) return;

  const { temp, act } = dataReady;

  // Clear canvas and stop estrus animation on steps other than 5
  if (estrusCycleInterval) {
    clearInterval(estrusCycleInterval);
    estrusCycleInterval = null;
  }
  d3.select("#circadianClock").style("display", "none");
  d3.select("#mousePickerContainer").style("display", "none");

  switch (step) {
    case 0:
      svgTempLine.style("opacity", 0);
      svgActLine.style("opacity", 0);
      svg.select("#chartTitle").text("Mice live by the light — or rather, the dark.");
      svg.select("#yAxisLabel").text("");
      break;

    case 1:
      {
        const combinedData = composeData(temp.maleAvg, act.maleAvg);
        updateLineChart(combinedData, {
          tempColor: colorMale,
          actColor: colorMale,
          yLabel: "Value",
          title: "Lights Out — Activity Rises"
        });
        svgTempLine.style("opacity", 1);
        svgActLine.style("opacity", 1);
      }
      break;

    case 2:
      {
        svgTempLine.style("opacity", 0);
        svgActLine.style("opacity", 0);
        d3.select("#circadianClock").style("display", "block");
        drawCircadianClock(act.maleAvg);
        svg.select("#chartTitle").text("Circadian Clock: Male Activity Over 24 Hours");
        svg.select("#yAxisLabel").text("");
      }
      break;

    case 3:
      {
        const combinedData = composeData(temp.maleAvg, act.maleAvg);
        updateLineChart(combinedData, {
          tempColor: colorMale,
          actColor: colorMale,
          yLabel: "Value",
          title: "Temperature Rises with Activity"
        });
        svgTempLine.style("opacity", 1);
        svgActLine.style("opacity", 1);
      }
      break;

    case 4:
      {
        const combinedData = composeData(temp.femaleAvg, act.femaleAvg);
        updateLineChart(combinedData, {
          tempColor: colorFemale,
          actColor: colorFemale,
          yLabel: "Value",
          title: "Day 2: Female Mouse Behavior Shifts"
        });
        svgTempLine.style("opacity", 1);
        svgActLine.style("opacity", 1);
      }
      break;

    case 5:
      {
        d3.select("#circadianClock").style("display", "block");
        startEstrusCycleAnimation(act.femaleAvg);
        svg.select("#chartTitle").text("Four-Day Estrus Hormone Cycle");
        svg.select("#yAxisLabel").text("");
      }
      break;

    case 6:
      {
        const maleCombined = composeData(temp.maleAvg, act.maleAvg);
        const femaleCombined = composeData(temp.femaleAvg, act.femaleAvg);

        updateLineChart(maleCombined, {
          tempColor: colorMale,
          actColor: colorMale,
          yLabel: "Value",
          title: "Male vs Female: Temperature & Activity"
        });

        // Overlay female lines
        svg.append("path")
          .datum(femaleCombined)
          .attr("fill", "none")
          .attr("stroke", colorFemale)
          .attr("stroke-width", 3)
          .attr("d", lineTemp)
          .attr("class", "femaleTempLine");

        svg.append("path")
          .datum(femaleCombined)
          .attr("fill", "none")
          .attr("stroke", colorFemale)
          .attr("stroke-width", 3)
          .attr("d", lineAct)
          .attr("class", "femaleActLine");
      }
      break;

    case 7:
      {
        d3.select("#mousePickerContainer").style("display", "block");
        svgTempLine.style("opacity", 0);
        svgActLine.style("opacity", 0);
        updateChartWithSelectedMouse();
      }
      break;

    case 8:
      {
        svgTempLine.style("opacity", 0);
        svgActLine.style("opacity", 0);
        d3.select("#circadianClock").style("display", "none");
        d3.select("#mousePickerContainer").style("display", "none");
        svg.select("#chartTitle").text("The rhythm of life, seen one minute at a time.");
        svg.select("#yAxisLabel").text("");
      }
      break;
  }
}

// Update chart for selected mouse in dropdown
function updateChartWithSelectedMouse() {
  if (!selectedMouse) {
    // Show averages if no mouse selected
    updateChart(6);
    return;
  }

  const { temp, act } = dataReady;

  let mouseTempData, mouseActData, gender;

  if (selectedMouse.startsWith("Male")) {
    gender = "male";
    mouseTempData = getMouseData(temp.maleRaw, selectedMouse.replace("Male - ", ""));
    mouseActData = getMouseData(act.maleRaw, selectedMouse.replace("Male - ", ""));
  } else if (selectedMouse.startsWith("Female")) {
    gender = "female";
    mouseTempData = getMouseData(temp.femaleRaw, selectedMouse.replace("Female - ", ""));
    mouseActData = getMouseData(act.femaleRaw, selectedMouse.replace("Female - ", ""));
  }

  const combinedData = composeData(mouseTempData, mouseActData);

  updateLineChart(combinedData, {
    tempColor: gender === "male" ? colorMale : colorFemale,
    actColor: gender === "male" ? colorMale : colorFemale,
    yLabel: "Value",
    title: `Mouse: ${selectedMouse}`
  });
}

function getMouseData(rawData, mouseID) {
  return rawData.map(d => d[mouseID]);
}

document.addEventListener("DOMContentLoaded", () => {
  init();
});
*/

import * as d3 from "https://cdn.skypack.dev/d3@7";

let dataReady = {};
let selectedMouse = null; // For "Pick a mouse to follow"
let svg, width, height, margin;
let xScale, yScale;
let lineTempMale, lineTempFemale, lineActMale, lineActFemale;
let currentDataType = "act"; // "act" or "temp"
let scrollamaInstance;

// Utility: average data by minute across mice in CSVs
function calculateAverage(data) {
  // data: array of objects with keys as mouse IDs and values as measurements per minute
  const n = data.length;
  if (n === 0) return [];
  const keys = Object.keys(data[0]).filter(k => k !== "minute");
  const averages = [];
  for (let i = 0; i < n; i++) {
    averages.push(data[i]);
  }
  // average per minute across mice
  let result = [];
  for (let i = 0; i < n; i++) {
    const row = data[i];
    result.push(row);
  }
  return result;
}

function updateChart(stage) {
  // stage: current scrollytelling step
  // We'll draw or update chart depending on stage

  if (!dataReady || !dataReady.act) return;

  svg.selectAll("*").remove();

  if (stage === 0) {
    // Intro: no plot, just background gradient
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#gradient-light-dark)");
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "24px")
      .attr("fill", "#333")
      .text("Mice live by the light — or rather, the dark.");
  }

  if (stage === 1) {
    // Lights Out: plot activity rising over one day
    // For simplicity, plot male average activity minute by minute

    const data = dataReady.act.male;

    xScale = d3.scaleLinear().domain([0, 1440]).range([margin.left, width - margin.right]);
    yScale = d3.scaleLinear().domain([0, d3.max(data, d => d.value)]).nice().range([height - margin.bottom, margin.top]);

    const line = d3.line()
      .x(d => xScale(d.minute))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top)
      .attr("text-anchor", "middle")
      .attr("font-size", "20px")
      .text("Male Mouse Activity Over One Day");
  }

  // Additional stages (2, 3, 4, 5, ...) can be implemented similarly
}

function handleStepEnter(response) {
  const index = response.index;
  updateChart(index);
}

function init() {
  // Basic SVG setup
  margin = {top: 40, right: 30, bottom: 30, left: 50};
  width = 900;
  height = 500;

  svg = d3.select("#chart")
    .attr("width", width)
    .attr("height", height);

  // Background gradient definition
  const defs = svg.append("defs");

  const gradient = defs.append("linearGradient")
    .attr("id", "gradient-light-dark")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "0%").attr("y2", "100%");

  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#fff");

  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#333");

  // Load CSVs (adjust paths to your files)
  Promise.all([
    d3.csv("data/MaleTemp.csv", d3.autoType),
    d3.csv("data/FemTemp.csv", d3.autoType),
    d3.csv("data/MaleAct.csv", d3.autoType),
    d3.csv("data/FemAct.csv", d3.autoType)
  ]).then(([maleTemp, femTemp, maleAct, femAct]) => {
    // For demo, let's assume data are arrays with {minute, value} for averages

    dataReady = {
      temp: {
        male: maleTemp,
        female: femTemp
      },
      act: {
        male: maleAct,
        female: femAct
      }
    };

    // Initialize Scrollama
    scrollamaInstance = scrollama();

    scrollamaInstance
      .setup({
        step: ".step",
        offset: 0.7,
        debug: false
      })
      .onStepEnter(handleStepEnter);

    // Initial chart render
    updateChart(0);
  });
}

document.addEventListener("DOMContentLoaded", init);

