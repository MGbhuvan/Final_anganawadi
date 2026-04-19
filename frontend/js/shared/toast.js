export function showInlineToast(elementId, msg, type = "success", timeout = 3000) {
  const t = document.getElementById(elementId);
  if (!t) return;
  t.textContent = msg;
  t.className = `${t.className.split(" ")[0]} ${type}`.trim();
  setTimeout(() => {
    t.className = t.className.split(" ")[0];
  }, timeout);
}

export function showFixedToast(elementId, msg, color, timeout = 2800) {
  const t = document.getElementById(elementId);
  if (!t) return;
  t.textContent = msg;
  if (color) t.style.background = color;
  t.style.display = "block";
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.display = "none";
  }, timeout);
}
