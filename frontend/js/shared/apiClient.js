import { API_BASE_URL } from "../config.js";

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch (_e) {
    return null;
  }
}

/**
 * Get the stored auth session from sessionStorage.
 * Returns { token, user_id, username } or null.
 */
export function getSession() {
  const raw = sessionStorage.getItem("poshanSession");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_e) {
    return null;
  }
}

/**
 * Save auth session to sessionStorage.
 */
export function saveSession(data) {
  sessionStorage.setItem(
    "poshanSession",
    JSON.stringify({
      token: data.token,
      user_id: data.user_id,
      username: data.username,
    })
  );
}

/**
 * Clear auth session (logout).
 */
export function clearSession() {
  sessionStorage.removeItem("poshanSession");
}

/**
 * Redirect to login page if there is no valid session.
 * Call this at the top of every protected page's JS module.
 */
export function requireAuth() {
  const session = getSession();
  if (!session || !session.token) {
    window.location.href = "login.html";
    return null;
  }
  return session;
}

export async function apiRequest(path, options = {}) {
  const session = getSession();
  const authHeaders = {};
  if (session && session.token) {
    authHeaders["Authorization"] = `Bearer ${session.token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...(options.headers || {})
      },
      ...options
    });
  } catch (_networkError) {
    const error = new Error(
      `Cannot connect to backend (${API_BASE_URL}). Start backend with: python run.py`
    );
    error.code = "NETWORK_ERROR";
    error.status = 0;
    throw error;
  }

  // If token is invalid/expired, redirect to login
  if (response.status === 401) {
    clearSession();
    window.location.href = "login.html";
    // Throw to stop execution in calling code (prevents null.sort() crashes)
    throw new Error("Session expired. Redirecting to login.");
  }

  if (response.status === 204) return null;

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    const message = data?.error || `Request failed (${response.status}).`;
    const code = data?.code || "INTERNAL_ERROR";
    const error = new Error(message);
    error.code = code;
    error.status = response.status;
    throw error;
  }

  return data;
}
