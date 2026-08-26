import React from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "../../utils/cn";
import useAppUpdateCheck from "../../hooks/useAppUpdateCheck";

/**
 * Sticky banner when a new deployment is detected. Auto-reloads after countdown.
 */
export default function AppUpdateBanner() {
  const { updateAvailable, secondsLeft, reloadNow } = useAppUpdateCheck();

  if (!updateAvailable) return null;

  return (
    <div
      role="alert"
      className={cn(
        "fixed bottom-0 inset-x-0 z-[100000] pointer-events-auto",
        "animate-in slide-in-from-bottom duration-300",
      )}
    >
      <div className="mx-auto max-w-3xl m-3 sm:m-4 rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50 p-4 flex flex-col sm:flex-row sm:items-center gap-4 safe-area-bottom">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-primary shrink-0">
            <RefreshCw size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-slate-900">Update available</p>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              A new version of Fleetly is live. Refresh to get the latest fixes and features.
              {secondsLeft != null && secondsLeft > 0 && (
                <span className="block mt-1 text-primary font-semibold">
                  Auto-refreshing in {secondsLeft}s…
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={reloadNow}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-[12px] font-bold transition-colors shadow-md"
        >
          Refresh now
        </button>
      </div>
    </div>
  );
}
