/**
 * Auth Guard — Protects pages from unauthenticated access.
 * Include this script on every protected page (home, student, etc.)
 * It checks for a valid session in sessionStorage and redirects
 * to login.html if none is found.
 */

const ALLOWED_PAGES = ["login.html", "register.html", "intro.html"];

(function authGuard() {
  // Don't guard the login/register/intro pages themselves
  const currentPage = window.location.pathname.split("/").pop() || "";
  if (ALLOWED_PAGES.some((p) => currentPage.endsWith(p))) return;

  const raw = sessionStorage.getItem("poshanSession");
  if (!raw) {
    window.location.href = "login.html";
    return;
  }

  try {
    const session = JSON.parse(raw);
    if (!session.token) {
      window.location.href = "login.html";
    }
  } catch (_e) {
    window.location.href = "login.html";
  }
})();
