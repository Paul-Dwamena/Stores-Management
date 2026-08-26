import axios from "axios";

const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const resolveApiBaseUrl = () => {
  const configured = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL);

  // Dev: relative path so Vite can proxy /api → backend.
  if (import.meta.env.DEV) return "/api/v1";

  // Production (e.g. Netlify): call the API host directly.
  if (configured) return `${configured}/api/v1`;

  return "/api/v1";
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

const isPublicAuthRequest = (config) => {
  const path = `${config?.baseURL || ""}${config?.url || ""}`;
  return (
    path.includes("/auth/login") ||
    path.includes("/auth/reset-password")
  );
};

let redirectingToLogin = false;

const logoutExpiredSession = () => {
  localStorage.removeItem("userInfo");
  window.dispatchEvent(new Event("auth-expired"));
  if (redirectingToLogin || window.location.pathname === "/login") return;
  redirectingToLogin = true;
  window.location.replace("/login");
};

api.interceptors.request.use((config) => {
  if (isPublicAuthRequest(config)) return config;

  try {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      const parsed = JSON.parse(userInfo);
      const token = parsed.token;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore malformed session
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;
    const credentialsFailed =
      status === 401 || detail === "Could not validate credentials";

    if (credentialsFailed && !isPublicAuthRequest(error.config)) {
      logoutExpiredSession();
    }

    return Promise.reject(error);
  },
);

export default api;
