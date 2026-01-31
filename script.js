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
  const t = document.getElementById("popup-text");
  if (t) t.textContent = text;
  popup?.classList.remove("hidden");
  try { popupBtn?.focus(); } catch {}
}

popupBtn?.addEventListener("click", () => popup.classList.add("hidden"));
popup?.addEventListener("click", (e) => {
  if (e.target === popup) popup.classList.add("hidden");
});

// ==============================
// CONFETTI (safe)
// ==============================
const reduceMotion =
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function confettiBurstSafe() {
  if (reduceMotion) return;
  try {
    for (let i = 0; i < 60; i++) {
      const c = document.createElement("div");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.width = 6 + Math.random() * 6 + "px";
      c.style.height = 10 + Math.random() * 12 + "px";
      c.style.background = Math.random() > 0.5 ? "#fbbf24" : "#38bdf8";
      c.style.opacity = "0.95";
      document.body.appendChild(c);

      // Use CSS animation if present; also safe animate fallback
      if (c.animate) {
        c.animate(
          [
            { transform: "translateY(0)", opacity: 1 },
            { transform: "translateY(110vh)", opacity: 0 }
          ],
          { duration: 1400, easing: "linear" }
        );
      }

      setTimeout(() => c.remove(), 2000);
    }
  } catch {
    // never break the submit flow
  }
}

// ==============================
// FORM LOGIC (STABLE)
// ==============================
const logForm = document.getElementById("log-form");
const logMessage = document.getElementById("log-message");

let isSubmitting = false;
let lastShown = ""; // prevents random overwrites

function setLogStatus(text, type) {
  if (!logMessage) return;
  lastShown = text;
  logMessage.textContent = text;
  logMessage.className = "status-message" + (type ? ` ${type}` : "");
}

// Clear stale UI when returning / tab switching
window.addEventListener("pageshow", () => {
  setLogStatus("", "");
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    // when you come back, don’t show old errors
    if (lastShown.includes("Something went wrong")) setLogStatus("", "");
  }
});

logForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (isSubmitting) return;
  isSubmitting = true;

  try {
    setLogStatus("Submitting...", "");

    const name = document.getElementById("name")?.value || "";
    const event = document.getElementById("event")?.value || "";
    const minutes = document.getElementById("minutes")?.value || "";
    const notes = document.getElementById("notes")?.value || "";

    if (!name || !event || !minutes) {
      setLogStatus("Please complete all required fields.", "error");
      return;
    }

    // FIRE-AND-FORGET POST (no-cors). We cannot read response, but it will log.
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ name, event, minutes, notes })
    });

    // If fetch didn't throw, treat as success.
    setLogStatus("Practice logged! Great work.", "success");
    try { logForm.reset(); } catch {}

    showPopup("Practice logged. Great work!");
    confettiBurstSafe();
  } catch (err) {
    // Only show error if the POST truly throws (rare)
    setLogStatus("Something went wrong. Please tell your coach.", "error");
  } finally {
    isSubmitting = false;
  }
});

// ==============================
// PROGRESS VIEW (GET works normally)
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

loadProgressButton?.addEventListener("click", async () => {
  const name = progressNameSelect?.value || "";
  if (!name) {
    if (progressMessage) {
      progressMessage.textContent = "Please select your name.";
      progressMessage.className = "status-message error";
    }
    return;
  }

  if (progressMessage) {
    progressMessage.textContent = "Loading...";
    progressMessage.className = "status-message";
  }

  try {
    const res = await fetch(`${SCRIPT_URL}?name=${encodeURIComponent(name)}`);
    const data = await res.json();

    if (data.status !== "success") throw new Error(data.message || "Server error");

    const logs = data.logs || [];

    if (!logs.length) {
      if (progressMessage) progressMessage.textContent = "No practices logged yet.";
      summarySection?.classList.add("hidden");
      chartSection?.classList.add("hidden");
      listSection?.classList.add("hidden");
      return;
    }

    const total = logs.reduce((s, l) => s + Number(l.minutes || 0), 0);
    if (totalMinutesEl) totalMinutesEl.textContent = String(total);
    if (sessionCountEl) sessionCountEl.textContent = String(logs.length);
    summarySection?.classList.remove("hidden");

    // simple chart
    if (chartBarsContainer) {
      chartBarsContainer.innerHTML = "";
      const recent = logs.slice(-7);
      const max = Math.max(...recent.map((l) => Number(l.minutes || 0)), 1);

      recent.forEach((l) => {
        const bar = document.createElement("div");
        bar.className = "chart-bar";

        const inner = document.createElement("div");
        inner.className = "chart-bar-inner";
        inner.style.height = `${(Number(l.minutes || 0) / max) * 100}%`;

        const label = document.createElement("div");
        label.className = "chart-bar-label";
        label.textContent = `${Number(l.minutes || 0)} min`;

        bar.appendChild(inner);
        bar.appendChild(label);
        chartBarsContainer.appendChild(bar);
      });
    }
    chartSection?.classList.remove("hidden");

    // history
    if (logList) {
      logList.innerHTML = "";
      logs
        .slice()
        .reverse()
        .forEach((l) => {
          const li = document.createElement("li");
          const d = new Date(l.timestamp);
          const dateStr = isNaN(d.getTime())
            ? ""
            : d.toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });

          li.textContent = `${dateStr} — ${l.event} — ${l.minutes} min${l.notes ? " — " + l.notes : ""}`;
          logList.appendChild(li);
        });
    }
    listSection?.classList.remove("hidden");

    if (progressMessage) progressMessage.textContent = "";
  } catch (err) {
    if (progressMessage) {
      progressMessage.textContent = "Could not load progress. Please tell your coach.";
      progressMessage.className = "status-message error";
    }
    summarySection?.classList.add("hidden");
    chartSection?.classList.add("hidden");
    listSection?.classList.add("hidden");
  }
});
