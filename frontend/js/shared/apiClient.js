import { API_BASE_URL } from "../config.js";

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch (_e) {
    return null;
  }
}

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
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
