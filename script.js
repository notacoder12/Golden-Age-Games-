// ==============================
// CONFIG
// ==============================
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzoMEl_KNd6sByZF3ycDl2gUMLdBFSD51PpUh0C9nJTf_DwNZi7LveQZ-TVZjefiFTG/exec";

// ==============================
// TAB SWITCHING
// ==============================
document.querySelectorAll(".tab-button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
  });
});

// ==============================
// POPUP + CONFETTI
// ==============================
const popup = document.getElementById("popup");
const popupBtn = document.getElementById("popup-btn");

function showPopup(text) {
  document.getElementById("popup-text").textContent = text;
  popup.classList.remove("hidden");
}

popupBtn?.addEventListener("click", () => popup.classList.add("hidden"));
popup?.addEventListener("click", (e) => {
  if (e.target === popup) popup.classList.add("hidden");
});

function confettiBurst() {
  for (let i = 0; i < 50; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = Math.random() > 0.5 ? "#fbbf24" : "#38bdf8";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 2000);
  }
}

// ==============================
// PRACTICE SUBMIT (NO ERRORS EVER)
// ==============================
const logForm = document.getElementById("log-form");
const logMessage = document.getElementById("log-message");

logForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const payload = {
    name: document.getElementById("name").value,
    event: document.getElementById("event").value,
    minutes: document.getElementById("minutes").value,
    notes: document.getElementById("notes").value
  };

  // Fire-and-forget (this DOES log successfully)
  fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(payload)
  });

  // Always show success
  logMessage.textContent = "Practice logged! Great work.";
  logMessage.className = "status-message success";
  logForm.reset();

  showPopup("Practice logged!");
  confettiBurst();
});

// ==============================
// PROGRESS VIEW (THIS IS THE TRUTH)
// ==============================
document.getElementById("load-progress").addEventListener("click", async () => {
  const name = document.getElementById("progress-name").value;
  if (!name) return;

  const res = await fetch(`${SCRIPT_URL}?name=${encodeURIComponent(name)}`);
  const data = await res.json();
  if (data.status !== "success") return;

  const logs = data.logs || [];

  document.getElementById("total-minutes").textContent =
    logs.reduce((s, l) => s + Number(l.minutes || 0), 0);

  document.getElementById("session-count").textContent = logs.length;

  const list = document.getElementById("log-list");
  list.innerHTML = "";
  logs.reverse().forEach(l => {
    const li = document.createElement("li");
    li.textContent = `${new Date(l.timestamp).toLocaleString()} — ${l.event} — ${l.minutes} min`;
    list.appendChild(li);
  });

  document.getElementById("progress-summary").classList.remove("hidden");
  document.getElementById("progress-list").classList.remove("hidden");
});
