import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Button from "./base/Button";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Shared loading / error / content wrapper for API-backed sections and tables.
 */
export default function SectionLoadState({
  loading = false,
  error = null,
  onRetry,
  loadingLabel = "Loading…",
  errorTitle = "Couldn’t load this section",
  retryLabel = "Reload",
  children,
}) {
  if (loading) {
    return (
      <div className="py-8">
        <LoadingSpinner size="sm" label={loadingLabel} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg bg-rose-50/50 px-4 py-6 text-center shadow-sm">
        <div className="flex items-center justify-center text-rose-600">
          <AlertTriangle size={16} strokeWidth={2.25} />
        </div>
        <div className="max-w-sm space-y-1">
          <p className="text-[13px] font-semibold text-slate-800">{errorTitle}</p>
          <p className="text-[12px] leading-relaxed text-slate-500">{error}</p>
        </div>
        {onRetry ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onRetry}
            className="mt-0.5 shadow-sm ring-1 ring-slate-200/80 hover:ring-slate-300"
          >
            <RefreshCw size={13} strokeWidth={2.25} className="text-slate-500" />
            {retryLabel}
          </Button>
        ) : null}
      </div>
    );
  }

  return children;
}
