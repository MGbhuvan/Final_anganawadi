const currentOrigin = window.location.origin;
const onBackendHost =
  window.location.protocol.startsWith("http") &&
  (window.location.port === "4000" || currentOrigin.includes(":4000"));

export const API_BASE_URL = onBackendHost ? `${currentOrigin}/api` : "http://127.0.0.1:4000/api";
