import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
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
