import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiX } from "react-icons/fi";
import { cn } from "../../utils/cn";
import { subscribeToToasts } from "./toast";

const TOAST_DURATION = 4500;
const MAX_VISIBLE_TOASTS = 4;

const TOAST_TITLES = {
  success: "Success",
  error: "Something went wrong",
  warning: "Heads up",
  info: "Notice",
};

// eslint-disable-next-line react-refresh/only-export-components -- shared toast API used across the app
export { toast } from "./toast";

export const GlobalToastProvider = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const listener = (newToast) => {
      setToasts((prev) => [...prev, newToast].slice(-MAX_VISIBLE_TOASTS));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, TOAST_DURATION);
    };
    return subscribeToToasts(listener);
  }, []);

  return (
    <div
      className="fixed top-6 right-6 z-[99999] flex flex-col gap-2 pointer-events-none max-w-[min(100vw-2rem,22rem)]"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((t) => (
        <ToastNotification
          key={t.id}
          message={t.message}
          type={t.type}
          duration={TOAST_DURATION}
          onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
        />
      ))}
    </div>
  );
};

const TYPE_STYLES = {
  success: {
    icon: FiCheckCircle,
    iconWrap: "bg-brand-muted text-brand",
    bar: "bg-brand",
  },
  error: {
    icon: FiXCircle,
    iconWrap: "bg-danger-muted text-danger",
    bar: "bg-danger",
  },
  warning: {
    icon: FiAlertTriangle,
    iconWrap: "bg-warning-muted text-warning",
    bar: "bg-warning",
  },
  info: {
    icon: FiInfo,
    iconWrap: "bg-info-muted text-info",
    bar: "bg-info",
  },
};

export const ToastNotification = ({ message, type = "info", duration = TOAST_DURATION, onClose }) => {
  const style = TYPE_STYLES[type] || TYPE_STYLES.info;
  const StatusIcon = style.icon;
  const title = TOAST_TITLES[type] || TOAST_TITLES.info;

  return (
    <div
      className="pointer-events-auto w-full max-w-[22rem] animate-[toast-panel-enter_0.28s_ease-out_forwards]"
      role="status"
    >
      <div className="relative overflow-hidden rounded-lg border border-border bg-white shadow-md">
        <div className="flex items-start gap-3 px-3.5 py-3 pr-2">
          <div
            className={cn(
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
              style.iconWrap,
            )}
          >
            <StatusIcon size={16} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[11px] font-bold text-text">{title}</p>
            <p className="mt-0.5 text-[12px] text-muted leading-snug">{message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-subtle hover:bg-slate-100 hover:text-text"
            aria-label="Dismiss notification"
          >
            <FiX size={14} />
          </button>
        </div>
        <div
          className={cn("h-0.5 w-full origin-left", style.bar)}
          style={{ animation: `toast-progress ${duration}ms linear forwards` }}
        />
      </div>
    </div>
  );
};

export default ToastNotification;
