// === CONFIG: PUT YOUR APPS SCRIPT URL HERE ===
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzoMEl_KNd6sByZF3ycDl2gUMLdBFSD51PpUh0C9nJTf_DwNZi7LveQZ-TVZjefiFTG/exec";

// === TAB SWITCHING ===
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-tab");

    tabButtons.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(`tab-${target}`).classList.add("active");
  });
});

// === POPUP FUNCTION ===
function showPopup(message) {
  const popup = document.getElementById("popup");
  const popupText = document.getElementById("popup-text");
  popupText.textContent = message;
  popup.classList.remove("hidden");

  document.getElementById("popup-btn").onclick = () => {
    popup.classList.add("hidden");
  };
}

// === LOG PRACTICE FORM ===
const logForm = document.getElementById("log-form");
const logMessage = document.getElementById("log-message");

logForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  logMessage.textContent = "Submitting...";
  logMessage.className = "status-message";

  const name = document.getElementById("name").value;
  const event = document.getElementById("event").value;
  const minutes = document.getElementById("minutes").value;
  const notes = document.getElementById("notes").value;

  if (!name || !event || !minutes) {
    logMessage.textContent = "Please fill in name, event, and minutes.";
    logMessage.classList.add("error");
    return;
  }

  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, event, minutes, notes })
    });

    // === SUCCESS ===
    showPopup("Your practice has been logged. Great work, athlete!");
    logForm.reset();
    logMessage.textContent = "";
  } catch (err) {
    console.error(err);
    logMessage.textContent = "Something went wrong. Please tell your coach.";
    logMessage.classList.add("error");
  }
});

// === PROGRESS VIEW ===
const progressNameSelect = document.getElementById("progress-name");
const loadProgressButton = document.getElementById("load-progress");
const progressMessage = document.getElementById("progress-message");

const summarySection = document.getElementById("progress-summary");
const totalMinutesEl = document.getElementById("total-minutes");
const sessionCountEl = document.getElementById("session-count");

const chartSection = document.getElementById("progress-chart");
const chartBarsContainer = document.getElementById("chart-bars");

const listSection = document.getElementById("progress-list");
const logList = document.getElementById("log-list");

loadProgressButton.addEventListener("click", async () => {
  const name = progressNameSelect.value;
  if (!name) {
    progressMessage.textContent = "Please select your name.";
    progressMessage.className = "status-message error";
    return;
  }

  progressMessage.textContent = "Loading...";
  progressMessage.className = "status-message";

  try {
    const url = `${SCRIPT_URL}?name=${encodeURIComponent(name)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "success") {
      throw new Error(data.message || "Unknown error from server");
    }

    const logs = data.logs || [];

    if (logs.length === 0) {
      progressMessage.textContent = "No practice sessions logged yet.";
      progressMessage.className = "status-message";
      summarySection.classList.add("hidden");
      chartSection.classList.add("hidden");
      listSection.classList.add("hidden");
      return;
    }

    // === SUMMARY ===
    const totalMinutes = logs.reduce((sum, entry) => sum + Number(entry.minutes || 0), 0);
    totalMinutesEl.textContent = totalMinutes;
    sessionCountEl.textContent = logs.length;
    summarySection.classList.remove("hidden");

    // === CHART (Last 7 sessions) ===
    const recent = logs.slice(-7);
    const maxMinutes = Math.max(...recent.map((l) => Number(l.minutes || 0)), 1);
    chartBarsContainer.innerHTML = "";

    recent.forEach((entry) => {
      const bar = document.createElement("div");
      bar.className = "chart-bar";

      const inner = document.createElement("div");
      inner.className = "chart-bar-inner";
      const heightPercent = (Number(entry.minutes || 0) / maxMinutes) * 100;
      inner.style.height = `${heightPercent}%`;

      const label = document.createElement("div");
      label.className = "chart-bar-label";
      label.textContent = `${Number(entry.minutes || 0)} min`;

      bar.appendChild(inner);
      bar.appendChild(label);
      chartBarsContainer.appendChild(bar);
    });

    chartSection.classList.remove("hidden");

    // === HISTORY LIST ===
    logList.innerHTML = "";
    logs
      .slice()
      .reverse()
      .forEach((entry) => {
        const li = document.createElement("li");
        const date = new Date(entry.timestamp);
        const dateStr = isNaN(date.getTime())
          ? ""
          : date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

        li.textContent = `${dateStr} — ${entry.event} — ${entry.minutes} min${
          entry.notes ? " — " + entry.notes : ""
        }`;
        logList.appendChild(li);
      });

    listSection.classList.remove("hidden");

    progressMessage.textContent = "";
    progressMessage.className = "status-message";

  } catch (err) {
    console.error(err);
    progressMessage.textContent = "Could not load progress. Please tell your coach.";
    progressMessage.className = "status-message error";
    summarySection.classList.add("hidden");
    chartSection.classList.add("hidden");
    listSection.classList.add("hidden");
  }
});
