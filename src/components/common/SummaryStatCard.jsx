import React from "react";
import { cn } from "../../utils/cn";

/**
 * Deep summary / KPI cards — fixed equal size, distinct tones.
 * Use filled (default) for page-level main KPI rows above tabs.
 * `variant="light"` is for cards below tabs (hub-embedded lists) and nested
 * detail-page cards (pastel fills, dark text).
 */
const TONES = {
  teal: "bg-success hover:bg-[#184338]",
  emerald: "bg-success hover:bg-[#184338]",
  navy: "bg-slate-900 hover:bg-black",
  violet: "bg-slate-800 hover:bg-slate-900",
  rose: "bg-rose-700 hover:bg-rose-800",
  slate: "bg-slate-600 hover:bg-slate-700",
  amber: "bg-amber-600 hover:bg-amber-700",
  orange: "bg-orange-600 hover:bg-orange-700",
  sky: "bg-sky-700 hover:bg-sky-800",
  indigo: "bg-indigo-800 hover:bg-indigo-900",
  forest: "bg-[#184338] hover:bg-[#123028]",
  mint: "bg-success-accent hover:bg-success",
  moss: "bg-slate-700 hover:bg-slate-800",
  pine: "bg-slate-800 hover:bg-slate-900",
  sage: "bg-success hover:bg-[#184338]",
};

/** Lighter versions of the filled KPI tones (tab-level cards). */
const LIGHT_TONES = {
  sky: { bg: "#EFF6FF", title: "text-sky-800/70", value: "text-sky-950", icon: "text-sky-600/45" },
  teal: { bg: "#e8f2ee", title: "text-success/70", value: "text-success", icon: "text-success/45" },
  emerald: { bg: "#e8f2ee", title: "text-success/70", value: "text-success", icon: "text-success/45" },
  mint: { bg: "#e8f2ee", title: "text-success/70", value: "text-success", icon: "text-success/45" },
  forest: { bg: "#e8f2ee", title: "text-success/70", value: "text-success", icon: "text-success/45" },
  sage: { bg: "#e8f2ee", title: "text-success/70", value: "text-success", icon: "text-success/45" },
  moss: { bg: "#F5F5F5", title: "text-slate-600", value: "text-slate-900", icon: "text-slate-400" },
  indigo: { bg: "#EEF2FF", title: "text-indigo-800/70", value: "text-indigo-950", icon: "text-indigo-600/45" },
  violet: { bg: "#F5F3FF", title: "text-violet-800/70", value: "text-violet-950", icon: "text-violet-600/45" },
  amber: { bg: "#FFFBEB", title: "text-amber-800/70", value: "text-amber-950", icon: "text-amber-600/45" },
  orange: { bg: "#FFF7ED", title: "text-orange-800/70", value: "text-orange-950", icon: "text-orange-600/45" },
  rose: { bg: "#FEF2F2", title: "text-rose-800/70", value: "text-rose-950", icon: "text-rose-600/45" },
  slate: { bg: "#F5F5F5", title: "text-slate-600", value: "text-slate-900", icon: "text-slate-400" },
  navy: { bg: "#F5F5F5", title: "text-neutral-600", value: "text-neutral-900", icon: "text-neutral-400" },
  pine: { bg: "#F5F5F5", title: "text-slate-600", value: "text-slate-900", icon: "text-slate-400" },
};

export default function SummaryStatCard({
  title,
  value,
  icon: Icon,
  tone = "teal",
  variant = "filled",
  onClick,
  className,
}) {
  const isLight = variant === "light";
  const light = LIGHT_TONES[tone] ?? LIGHT_TONES.teal;

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "relative h-[88px] w-full overflow-hidden rounded-xl px-3.5 py-3 shadow-md transition-transform",
        "flex flex-col justify-between",
        isLight ? "border border-black/[0.04]" : "text-white",
        !isLight && (TONES[tone] ?? TONES.teal),
        onClick && "cursor-pointer active:scale-[0.98]",
        className,
      )}
      style={isLight ? { backgroundColor: light.bg } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "min-w-0 truncate text-[10px] font-semibold tracking-wide leading-snug",
            isLight ? light.title : "text-white/85",
          )}
        >
          {title}
        </p>
        {Icon ? (
          <Icon
            size={16}
            className={cn("shrink-0", isLight ? light.icon : "text-white/45")}
            strokeWidth={1.75}
          />
        ) : null}
      </div>
      <h3
        className={cn(
          "truncate text-[17px] font-extrabold leading-none tracking-tight",
          isLight ? light.value : "text-white",
        )}
      >
        {value}
      </h3>
    </div>
  );
}
