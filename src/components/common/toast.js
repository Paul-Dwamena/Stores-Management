import { isSilentApiError } from "../../utils/apiResponseHelpers";

const toastBridge = (globalThis.__storeDashboardToasts ||= {
  listeners: new Set(),
  pending: [],
});

const toText = (value) => (typeof value === "string" ? value.trim() : "");

export const subscribeToToasts = (listener) => {
  toastBridge.listeners.add(listener);
  toastBridge.pending.splice(0).forEach(listener);
  return () => toastBridge.listeners.delete(listener);
};

export const toast = {
  notify: ({ message, type = "info" }) => {
    const text = toText(message);
    if (!text) return;
    const payload = {
      message: text,
      type,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
    if (toastBridge.listeners.size === 0) {
      toastBridge.pending.push(payload);
      return;
    }
    toastBridge.listeners.forEach((listener) => listener(payload));
  },
  success: (message) => toast.notify({ message, type: "success" }),
  error: (message) => toast.notify({ message, type: "error" }),
  /** Load failures — skip toast on 401/403 so the user stays on the page quietly */
  loadError: (err, message) => {
    if (isSilentApiError(err)) return;
    if (message) toast.error(message);
  },
  warning: (message) => toast.notify({ message, type: "warning" }),
  info: (message) => toast.notify({ message, type: "info" }),
};
