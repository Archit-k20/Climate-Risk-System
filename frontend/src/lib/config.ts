const mode = import.meta.env.VITE_APP_MODE ?? "demo";
if (mode !== "demo" && mode !== "connected")
  throw new Error("VITE_APP_MODE must be demo or connected");
export const isDemo = mode === "demo";
export const apiURL = import.meta.env.VITE_API_URL || "/api/v1";
export const socketURL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? "http://localhost:8000" : window.location.origin);
