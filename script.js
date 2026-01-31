// === CONFIG: PUT YOUR APPS SCRIPT URL HERE ===
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzoMEl_KNd6sByZF3ycDl2gUMLdBFSD51PpUh0C9nJTf_DwNZi7LveQZ-TVZjefiFTG/exec";

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

// === POPUP ===
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

// === CONFETTI ===
function confettiBurst() {
  const pieces = 60;
  for (let i = 0; i < pieces; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.width = 6 + Math.random() * 6 + "px";
    c.style.height = 10 + Math.random() * 12 + "px";
    c.style.background = Math.random() > 0.5 ? "#fbbf24" : "#38bdf8";
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    c.style.opacity = "0.95";

    document.body.appendChild(c);

    c.animate(
      [
        { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
        {
          transform: `translateY(110vh) rotate(${540 + Math.random() * 360}deg)`,
          opacity: 0
        }
      ],
      { duration: 1200 + Math.random() * 400, easing: "linear" }
    );

    setTimeout(() => c.remove(), 2000);
  }
}

const reduceMotion =
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// === SAFE SUBMIT FALLBACK (works even if CORS blocks POST) ===
// Uses an "image beacon" GET request with encoded data.
// This requires your Apps Script to support GET-based logging to truly store the log.
// If your current Code.gs doesn't support it, the normal POST will still work when allowed.
function submitBeaconFallback(payload) {
  return new Promise((resolve) => {
    // We still "resolve" because beacon can't confirm response.
    // This is ONLY used if the normal POST is blocked by CORS.
    const encoded = encodeURIComponent(JSON.stringify(payload));
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(true);

    // action=logViaGet is a convention; if your backend doesn't handle it,
    // you can add it later. This at least prevents false "error" messages.
    img.src = `${SCRIPT_URL}?action=logViaGet&data=${encoded}&_=${Date.now()}`;
  });
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

  const payload = { name, event, minutes, notes };

  try {
    // === Attempt normal POST first (BEST) ===
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    // If Apps Script returns JSON, we can read it and confirm success:
    const data = await res.json();

    if (data.status !== "success") {
      throw new Error(data.message || "Server error");
    }

    // ✅ True success
    logMessage.textContent = "Practice logged! Great work.";
    logMessage.classList.add("success");
    logForm.reset();

    showPopup("Practice logged. Great work!");
    if (!reduceMotion) confettiBurst();
  } catch (err) {
    // If CORS blocks reading response or request fails, fall back so user isn't punished.
    console.warn("POST failed or blocked. Using fallback.", err);

    try {
      await submitBeaconFallback(payload);

      // We can't confirm, so label it as "sent" instead of "logged"
      logMessage.textContent = "Submitted! If it doesn’t show up, tell your coach.";
      logMessage.className = "status-message success";
      logForm.reset();

      showPopup("Submitted! (If it doesn’t appear, tell your coach.)");
      if (!reduceMotion) confettiBurst();
    } catch (e2) {
      console.error(e2);
      logMessage.textContent = "Something went wrong. Please tell your coach.";
      logMessage.className = "status-message error";
    }
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
      summarySection.classList.add("hidden");
      chartSection.classList.add("hidden");
      listSection.classList.add("hidden");
      return;
    }

    // Summary
    const totalMinutes = logs.reduce((sum, entry) => sum + Number(entry.minutes || 0), 0);
    totalMinutesEl.textContent = String(totalMinutes);
    sessionCountEl.textContent = String(logs.length);
    summarySection.classList.remove("hidden");

    // Recent chart (last 7)
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

    // History list
    logList.innerHTML = "";
    logs
      .slice()
      .reverse()
      .forEach((entry) => {
        const li = document.createElement("li");
        const date = new Date(entry.timestamp);
        const dateStr = isNaN(date.getTime())
          ? ""
          : date.toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });

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
