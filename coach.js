const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzoMEl_KNd6sByZF3ycDl2gUMLdBFSD51PpUh0C9nJTf_DwNZi7LveQZ-TVZjefiFTG/exec";

const unlockBtn = document.getElementById("unlock");
const pinInput = document.getElementById("coach-pin");
const coachMsg = document.getElementById("coach-msg");
const coachTools = document.getElementById("coach-tools");

const loadAllBtn = document.getElementById("load-all");
const loadMsg = document.getElementById("load-msg");
const coachResults = document.getElementById("coach-results");
const allLogsUl = document.getElementById("all-logs");

const resetBtn = document.getElementById("reset-season");
const resetMsg = document.getElementById("reset-msg");

let coachPin = "";

unlockBtn.addEventListener("click", () => {
  coachPin = pinInput.value.trim();
  if (!coachPin) {
    coachMsg.textContent = "Please enter your coach PIN.";
    coachMsg.className = "status-message error";
    return;
  }
  coachMsg.textContent = "Unlocked.";
  coachMsg.className = "status-message success";
  coachTools.classList.remove("hidden");
});

loadAllBtn.addEventListener("click", async () => {
  loadMsg.textContent = "Loading...";
  loadMsg.className = "status-message";

  try {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();
    if (data.status !== "success") throw new Error(data.message || "Server error");

    const logs = data.logs || [];
    if (!logs.length) {
      loadMsg.textContent = "No logs found.";
      coachResults.classList.add("hidden");
      return;
    }

    allLogsUl.innerHTML = "";
    logs.slice().reverse().forEach((l) => {
      const li = document.createElement("li");
      const d = new Date(l.timestamp);
      const dateStr = isNaN(d.getTime()) ? "" : d.toLocaleString();
      li.textContent = `${dateStr} — ${l.name} — ${l.event} — ${l.minutes} min${l.notes ? " — " + l.notes : ""}`;
      allLogsUl.appendChild(li);
    });

    coachResults.classList.remove("hidden");
    loadMsg.textContent = "";
  } catch (e) {
    console.error(e);
    loadMsg.textContent = "Could not load logs.";
    loadMsg.className = "status-message error";
  }
});

resetBtn.addEventListener("click", async () => {
  if (!coachPin) {
    resetMsg.textContent = "Enter PIN and unlock first.";
    resetMsg.className = "status-message error";
    return;
  }

  const confirmText = prompt('Type RESET to confirm deleting ALL logs:');
  if (confirmText !== "RESET") {
    resetMsg.textContent = "Reset canceled.";
    resetMsg.className = "status-message";
    return;
  }

  resetMsg.textContent = "Resetting...";
  resetMsg.className = "status-message";

  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "resetSeason", pin: coachPin })
    });

    resetMsg.textContent = "Season reset sent. Refresh coach page in 5 seconds.";
    resetMsg.className = "status-message success";
    coachResults.classList.add("hidden");
  } catch (e) {
    console.error(e);
    resetMsg.textContent = "Reset failed. Try again.";
    resetMsg.className = "status-message error";
  }
});
