import { isSilentApiError } from "../../utils/apiResponseHelpers";

const toastListeners = new Set();

export const subscribeToToasts = (listener) => {
  toastListeners.add(listener);
  return () => toastListeners.delete(listener);
};

export const toast = {
  notify: ({ message, type = "info" }) => {
    if (!message) return;
    toastListeners.forEach((listener) =>
      listener({ message, type, id: Date.now() }),
    );
  },
  success: (message) => toast.notify({ message, type: "success" }),
  error: (message, err) => {
    if (err && isSilentApiError(err)) return;
    if (!message) return;
    toast.notify({ message, type: "error" });
  },
  /** Load failures — skip toast on 401/403 so the user stays on the page quietly */
  loadError: (err, message) => {
    if (isSilentApiError(err)) return;
    if (message) toast.error(message);
  },
  warning: (message) => toast.notify({ message, type: "warning" }),
  info: (message) => toast.notify({ message, type: "info" }),
};
