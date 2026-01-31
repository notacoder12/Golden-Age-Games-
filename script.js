// ==============================
// CONFIG
// ==============================
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzoMEl_KNd6sByZF3ycDl2gUMLdBFSD51PpUh0C9nJTf_DwNZi7LveQZ-TVZjefiFTG/exec";

// ==============================
// TAB SWITCHING
// ==============================
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;
    tabButtons.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${target}`).classList.add("active");
  });
});

// ==============================
// POPUP
// ==============================
const popup = document.getElementById("popup");
const popupBtn = document.getElementById("popup-btn");

function showPopup(text) {
  document.getElementById("popup-text").textContent = text;
  popup.classList.remove("hidden");
  popupBtn?.focus();
}

popupBtn?.addEventListener("click", () => popup.classList.add("hidden"));
popup?.addEventListener("click", (e) => {
  if (e.target === popup) popup.classList.add("hidden");
});

// ==============================
// CONFETTI
// ==============================
function confettiBurst() {
  for (let i = 0; i < 60; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.width = 6 + Math.random() * 6 + "px";
    c.style.height = 10 + Math.random() * 12 + "px";
    c.style.background = Math.random() > 0.5 ? "#fbbf24" : "#38bdf8";
    document.body.appendChild(c);

    c.animate(
      [
        { transform: "translateY(0)", opacity: 1 },
        { transform: "translateY(110vh)", opacity: 0 }
      ],
      { duration: 1400, easing: "linear" }
    );

    setTimeout(() => c.remove(), 2000);
  }
}

const reduceMotion =
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ==============================
// FORM LOGIC
// ==============================
const logForm = document.getElementById("log-form");
const logMessage = document.getElementById("log-message");
let isSubmitting = false;

// Clear stale messages if page is restored
window.addEventListener("pageshow", () => {
  logMessage.textContent = "";
  logMessage.className = "status-message";
});

logForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (isSubmitting) return;
  isSubmitting = true;

  try {
    logMessage.textContent = "Submitting...";
    logMessage.className = "status-message";

    const payload = {
      name: document.getElementById("name").value,
      event: document.getElementById("event").value,
      minutes: document.getElementById("minutes").value,
      notes: document.getElementById("notes").value
    };

    if (!payload.name || !payload.event || !payload.minutes) {
      logMessage.textContent = "Please complete all required fields.";
      logMessage.classList.add("error");
      return;
    }

    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.status !== "success") throw new Error();

    logMessage.textContent = "Practice logged! Great work.";
    logMessage.className = "status-message success";
    logForm.reset();

    showPopup("Practice logged. Great work!");
    if (!reduceMotion) confettiBurst();
  } catch (err) {
    console.warn("POST failed, using fallback.");

    try {
      const img = new Image();
      img.src =
        SCRIPT_URL +
        "?fallback=1&data=" +
        encodeURIComponent(JSON.stringify(payload)) +
        "&t=" +
        Date.now();

      logMessage.textContent = "Submitted! If it doesn’t show up, tell your coach.";
      logMessage.className = "status-message success";
      logForm.reset();

      showPopup("Submitted!");
      if (!reduceMotion) confettiBurst();
    } catch {
      logMessage.textContent = "Something went wrong. Please tell your coach.";
      logMessage.className = "status-message error";
    }
  } finally {
    isSubmitting = false;
  }
});

// ==============================
// PROGRESS VIEW
// ==============================
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
    const res = await fetch(`${SCRIPT_URL}?name=${encodeURIComponent(name)}`);
    const data = await res.json();
    if (data.status !== "success") throw new Error();

    const logs = data.logs || [];
    if (!logs.length) {
      progressMessage.textContent = "No practices logged yet.";
      return;
    }

    const total = logs.reduce((s, l) => s + Number(l.minutes || 0), 0);
    totalMinutesEl.textContent = total;
    sessionCountEl.textContent = logs.length;
    summarySection.classList.remove("hidden");

    chartBarsContainer.innerHTML = "";
    logs.slice(-7).forEach((l) => {
      const bar = document.createElement("div");
      bar.className = "chart-bar";

      const inner = document.createElement("div");
      inner.className = "chart-bar-inner";
      inner.style.height = Math.min(100, l.minutes * 3) + "%";

      bar.appendChild(inner);
      chartBarsContainer.appendChild(bar);
    });

    chartSection.classList.remove("hidden");

    logList.innerHTML = "";
    logs.reverse().forEach((l) => {
      const li = document.createElement("li");
      li.textContent = `${new Date(l.timestamp).toLocaleString()} — ${l.event} — ${l.minutes} min`;
      logList.appendChild(li);
    });

    listSection.classList.remove("hidden");
    progressMessage.textContent = "";
  } catch {
    progressMessage.textContent = "Could not load progress.";
    progressMessage.className = "status-message error";
  }
});
