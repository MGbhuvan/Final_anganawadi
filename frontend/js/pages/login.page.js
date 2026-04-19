import { API_BASE_URL } from "../config.js";

document.getElementById("loginForm").addEventListener("submit", function onSubmit(e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errUser = document.getElementById("errUser");
  const errPass = document.getElementById("errPass");
  const loginErr = document.getElementById("loginError");

  errUser.classList.remove("show-error");
  errPass.classList.remove("show-error");
  loginErr.classList.remove("show-error");

  let valid = true;
  if (!username) {
    errUser.classList.add("show-error");
    valid = false;
  }
  if (!password) {
    errPass.classList.add("show-error");
    valid = false;
  }
  if (!valid) return;

  verifyBackendAndContinue();
});

async function verifyBackendAndContinue() {
  const loginErr = document.getElementById("loginError");
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error("BACKEND_UNHEALTHY");
    window.location.href = "home.html";
  } catch (_err) {
    loginErr.textContent = "Backend is not reachable. Start backend with: python run.py";
    loginErr.classList.add("show-error");
  }
}

function togglePassword() {
  const pass = document.getElementById("password");
  const icon = document.getElementById("eyeIcon");
  const showing = pass.type === "text";

  pass.type = showing ? "password" : "text";
  icon.innerHTML = showing
    ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
    : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
}

window.togglePassword = togglePassword;

(function createParticles() {
  const container = document.getElementById("particles");
  const colors = ["#FF6B00", "#138808", "#F5A623", "#FFD700", "#FF4081"];
  const sizes = [3, 4, 5, 6];
  for (let i = 0; i < 25; i += 1) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    p.style.cssText = [
      `width:${size}px`,
      `height:${size}px`,
      `left:${Math.random() * 100}%`,
      "bottom:-10px",
      `background:${colors[Math.floor(Math.random() * colors.length)]}`,
      `animation-duration:${6 + Math.random() * 10}s`,
      `animation-delay:${Math.random() * 8}s`,
      "opacity:0"
    ].join(";");
    container.appendChild(p);
  }
})();
