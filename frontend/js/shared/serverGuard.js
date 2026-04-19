const CHECK_INTERVAL_MS = 2000;
const MAX_FAILURES = 2;

let failedChecks = 0;
let intervalId = null;

function showServerStoppedState() {
  const overlay = document.createElement("div");
  overlay.setAttribute(
    "style",
    [
      "position:fixed",
      "inset:0",
      "z-index:99999",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:24px",
      "background:#0f172a",
      "color:#f8fafc",
      "font-family:Arial,sans-serif",
      "text-align:center"
    ].join(";")
  );
  overlay.innerHTML =
    "<div>" +
    "<h2 style='margin:0 0 8px;font-size:22px;'>Server Stopped</h2>" +
    "<p style='margin:0;font-size:14px;opacity:.9;'>Backend was closed from terminal (Ctrl+C). This page will close now.</p>" +
    "</div>";
  document.body.appendChild(overlay);
}

function closeOrBlankPage() {
  showServerStoppedState();
  setTimeout(() => {
    try {
      window.open("", "_self");
      window.close();
    } catch (_err) {
      // Ignore close errors and fallback to blank page.
    }
    setTimeout(() => {
      window.location.replace("about:blank");
    }, 200);
  }, 450);
}

async function checkBackendHealth() {
  try {
    const response = await fetch("/api/health", {
      method: "GET",
      cache: "no-store"
    });
    if (!response.ok) throw new Error("UNHEALTHY");
    failedChecks = 0;
  } catch (_err) {
    failedChecks += 1;
    if (failedChecks >= MAX_FAILURES) {
      clearInterval(intervalId);
      closeOrBlankPage();
    }
  }
}

if (window.location.port === "4000") {
  intervalId = setInterval(checkBackendHealth, CHECK_INTERVAL_MS);
  checkBackendHealth();
}
