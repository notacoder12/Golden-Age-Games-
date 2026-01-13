const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzoMEl_KNd6sByZF3ycDl2gUMLdBFSD51PpUh0C9nJTf_DwNZi7LveQZ-TVZjefiFTG/exec";

// CHANGE THIS PIN
const COACH_PIN = "2580";

const pinGate = document.getElementById("pin-gate");
const dashboard = document.getElementById("dashboard");
const pinInput = document.getElementById("coach-pin");
const pinSubmit = document.getElementById("pin-submit");
const pinMsg = document.getElementById("pin-msg");

function unlock() {
  pinGate.classList.add("hidden");
  dashboard.classList.remove("hidden");
  pinMsg.textContent = "";
  localStorage.setItem("coach_unlocked", "1");
}

function lock() {
  dashboard.classList.add("hidden");
  pinGate.classList.remove("hidden");
  localStorage.removeItem("coach_unlocked");
  pinInput.value = "";
}

if (localStorage.getItem("coach_unlocked") === "1") {
  unlock();
}

pinSubmit.addEventListener("click", () => {
  if (pinInput.value.trim() === COACH_PIN) unlock();
  else {
    pinMsg.textContent = "Wrong PIN.";
    pinMsg.className = "status-message error";
  }
});

document.getElementById("lock").addEventListener("click", lock);

document.getElementById("load-all").addEventListener("click", async () => {
  const msg = document.getElementById("coach-msg");
  const list = document.getElementById("coach-list");
  const entries = document.getElementById("coach-entries");

  msg.textContent = "Loading...";
  msg.className = "status-message";
  list.classList.add("hidden");

  try {
    const res = await fetch(`${SCRIPT_URL}`);
    const data = await res.json();

    if (data.status !== "success") throw new Error("Bad response");

    entries.innerHTML = "";
    (data.logs || []).slice().reverse().forEach((entry) => {
      const li = document.createElement("li");
      const date = new Date(entry.timestamp);
      const dateStr = isNaN(date.getTime()) ? "" : date.toLocaleString();
      li.textContent = `${dateStr} — ${entry.name} — ${entry.event} — ${entry.minutes} min${entry.notes ? " — " + entry.notes : ""}`;
      entries.appendChild(li);
    });

    msg.textContent = "";
    list.classList.remove("hidden");
  } catch (e) {
    console.error(e);
    msg.textContent = "Could not load logs.";
    msg.className = "status-message error";
  }
});
