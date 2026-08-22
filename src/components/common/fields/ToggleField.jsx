import React from "react";
import { cn } from "../../../utils/cn";

export default function ToggleField({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-3">
      <div>
        <p className="text-[12px] font-bold text-slate-800">{label}</p>
        {description ? <p className="text-[10px] text-slate-500">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-emerald-500" : "bg-slate-200",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all",
            checked ? "left-6" : "left-1",
          )}
        />
      </button>
    </div>
  );
}
