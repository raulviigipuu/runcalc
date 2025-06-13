// =========================
// Constants & Config
// =========================
const KM_PER_MILE = 1.60934;

const PRESETS_KM = {
  marathon: 42.195,
  half: 21.0975,
  tenK: 10,
};

const PRESETS_MILES = {
  marathon: 26.2188,
  half: 13.1,
  tenK: 6.2,
};

// =========================
// State
// =========================
let selectedPreset = null;
let isPaceMode = false;

// =========================
// DOM Elements
// =========================
const elems = {};

document.addEventListener("DOMContentLoaded", () => {
  collectDOMElements();

  const toggleModeLink = document.getElementById("toggleMode");
  const paceGroup = document.getElementById("paceGroup");
  const timeGroup = elems.hours.closest(".form-group");
  const paceInput = document.getElementById("paceInput");

  attachEventListeners();

  toggleModeLink.addEventListener("click", (e) => {
    e.preventDefault();
    isPaceMode = !isPaceMode;

    paceGroup.style.display = isPaceMode ? "block" : "none";
    timeGroup.style.display = isPaceMode ? "none" : "block";

    toggleModeLink.textContent = isPaceMode
      ? "🔁 Switch to Time Input"
      : "🔁 Switch to Pace Input";

    document.getElementById("resultType").textContent = isPaceMode
      ? "Finish Time"
      : "Pace";

    document.querySelectorAll("#paceUnits").forEach((el) => {
      el.style.display = isPaceMode ? "none" : "inline";
    });

    if (isPaceMode) {
      paceInput.value = "5:00"; // Default pace when entering pace mode
    }

    calculatePaceOrTime();
  });

  paceInput.addEventListener("input", calculatePaceOrTime);

  // Set initial default values
  elems.units.value = "km";
  elems.distance.value = 5;
  setTimeInputs(0, 25, 0);
  calculatePaceOrTime();

  elems.distance.focus();
});

// =========================
// DOM Access & Events
// =========================
function collectDOMElements() {
  elems.distance = document.getElementById("distanceInput");
  elems.hours = document.getElementById("hoursInput");
  elems.minutes = document.getElementById("minutesInput");
  elems.seconds = document.getElementById("secondsInput");
  elems.pace = document.getElementById("paceLabel");
  elems.units = document.getElementById("unitsSelect");

  elems.presetMarathon = document.getElementById("distanceMarathon");
  elems.presetHalf = document.getElementById("distanceHalfMarathon");
  elems.preset10k = document.getElementById("distance10k");
}

function attachEventListeners() {
  elems.distance.addEventListener("input", () => {
    selectedPreset = null;
    updatePresetHighlight();
    calculatePaceOrTime();
  });

  ["hours", "minutes", "seconds"].forEach((key) => {
    elems[key].addEventListener("input", calculatePaceOrTime);
  });

  document
    .getElementById("unitsSelect")
    .addEventListener("change", handleUnitChange);

  elems.presetMarathon.addEventListener("click", (e) => {
    e.preventDefault();
    setPreset("marathon");
  });
  elems.presetHalf.addEventListener("click", (e) => {
    e.preventDefault();
    setPreset("half");
  });
  elems.preset10k.addEventListener("click", (e) => {
    e.preventDefault();
    setPreset("tenK");
  });
}

// =========================
// Core Logic
// =========================
function calculatePaceOrTime() {
  const distance = parseFloat(elems.distance.value);
  if (!distance || distance <= 0) {
    elems.pace.textContent = "–";
    return;
  }

  let resultStr = "–";

  if (!isPaceMode) {
    const hours = parseInt(elems.hours.value) || 0;
    const minutes = parseInt(elems.minutes.value) || 0;
    const seconds = parseInt(elems.seconds.value) || 0;
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds <= 0) {
      elems.pace.textContent = "–";
      return;
    }

    const paceSeconds = Math.round(totalSeconds / distance);
    const paceMinutes = Math.floor(paceSeconds / 60);
    const paceRemainder = paceSeconds % 60;

    resultStr = `${pad(paceMinutes)}:${pad(paceRemainder)}`;
  } else {
    const paceStr = document.getElementById("paceInput").value.trim();
    const [minStr, secStr = "0"] = paceStr.split(":");
    const paceSeconds = parseInt(minStr) * 60 + parseInt(secStr);
    if (isNaN(paceSeconds) || paceSeconds <= 0) {
      elems.pace.textContent = "–";
      return;
    }

    const totalSeconds = Math.round(paceSeconds * distance);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    resultStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  // 🔁 Apply the result and animate
  elems.pace.textContent = resultStr;
  elems.pace.classList.remove("animate");
  void elems.pace.offsetWidth; // force reflow
  elems.pace.classList.add("animate");
}

function setPreset(name) {
  selectedPreset = name;
  const toKm = elems.units.value === "km";
  const value = toKm ? PRESETS_KM[name] : PRESETS_MILES[name];
  elems.distance.value = value;

  if (!isPaceMode) {
    if (name === "marathon") {
      setTimeInputs(4, 0, 0);
    } else if (name === "half") {
      setTimeInputs(1, 50, 0);
    } else if (name === "tenK") {
      setTimeInputs(0, 50, 0);
    }
  }

  updatePresetHighlight();
  calculatePaceOrTime();
}

// =========================
// Helpers
// =========================
function setTimeInputs(h, m, s) {
  elems.hours.value = h;
  elems.minutes.value = m;
  elems.seconds.value = s;
}

function pad(num) {
  return String(num).padStart(2, "0");
}

function updatePresetHighlight() {
  [elems.presetMarathon, elems.presetHalf, elems.preset10k].forEach((link) =>
    link.classList.remove("active")
  );

  if (selectedPreset === "marathon") {
    elems.presetMarathon.classList.add("active");
  } else if (selectedPreset === "half") {
    elems.presetHalf.classList.add("active");
  } else if (selectedPreset === "tenK") {
    elems.preset10k.classList.add("active");
  }
}

function handleUnitChange() {
  const toKm = elems.units.value === "km";
  document.querySelectorAll("#paceUnits").forEach((el) => {
    el.textContent = toKm ? "min/km" : "min/mile";
  });

  let val = parseFloat(elems.distance.value);
  if (isNaN(val)) return;

  if (selectedPreset) {
    setPreset(selectedPreset);
  } else {
    elems.distance.value = toKm
      ? (val * KM_PER_MILE).toFixed(3)
      : (val / KM_PER_MILE).toFixed(3);
    calculatePaceOrTime();
  }
}
