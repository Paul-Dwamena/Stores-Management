import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

export default function CollapsibleFormSection({
  title,
  description,
  open,
  onToggle,
  children,
  errorCount = 0,
}) {
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-1.5 px-3 py-2.5 text-left transition-colors",
          "bg-slate-50 hover:bg-slate-100/80",
          open && "border-b border-slate-200",
        )}
        aria-expanded={open}
      >
        <ChevronDown
          size={14}
          className={cn(
            "text-primary shrink-0 transition-transform duration-200",
            !open && "-rotate-90",
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="block text-[10px] font-bold text-primary uppercase tracking-wider">
              {title}
            </span>
            {errorCount > 0 ? (
              <span className="rounded-full bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 normal-case tracking-normal">
                {errorCount}
              </span>
            ) : null}
          </span>
          {description ? (
            <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-slate-400">
              {description}
            </span>
          ) : null}
        </span>
      </button>
      {open ? <div className="space-y-3 bg-white px-3 py-3">{children}</div> : null}
    </div>
  );
}
