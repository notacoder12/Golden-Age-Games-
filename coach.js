const SCRIPT_URL = "YOUR_SCRIPT_URL_HERE";  // same as before

document.getElementById("load-all").addEventListener("click", async () => {
  const msg = document.getElementById("coach-msg");
  const list = document.getElementById("coach-list");
  const entries = document.getElementById("coach-entries");

  msg.textContent = "Loading...";
  list.classList.add("hidden");

  try {
    const res = await fetch(`${SCRIPT_URL}`);
    const data = await res.json();

    if (data.status !== "success") {
      msg.textContent = "Error loading logs.";
      return;
    }

    entries.innerHTML = "";
    data.logs.reverse().forEach(entry => {
      const li = document.createElement("li");
      const date = new Date(entry.timestamp);
      const d = date.toLocaleString();
      li.textContent = `${d} — ${entry.name} — ${entry.event} — ${entry.minutes} min — ${entry.notes || ''}`;
      entries.appendChild(li);
    });

    msg.textContent = "";
    list.classList.remove("hidden");

  } catch (err) {
    console.error(err);
    msg.textContent = "Server error.";
  }
});
