import React from "react";
import StoreLogo from "./StoreLogo";
import { cn } from "../../utils/cn";

const SIZES = {
  sm: { ring: "w-10 h-10 border-[3px]", logo: "sm" },
  md: { ring: "w-16 h-16 border-4", logo: "sm" },
  lg: { ring: "w-24 h-24 border-[5px]", logo: "md" },
};

export default function LoadingSpinner({
  isLoading = true,
  variant = "inline",
  size = "md",
  label = "Loading…",
  className,
}) {
  if (!isLoading) return null;

  const { ring, logo } = SIZES[size] ?? SIZES.md;

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 bg-brand/20 rounded-full blur-md animate-pulse" />
        <div
          className={cn(
            "rounded-full border-brand-muted border-t-brand animate-spin relative z-10",
            ring,
          )}
        />
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <StoreLogo size={logo} className="shadow-none !w-7 !h-7 !rounded-lg" />
        </div>
      </div>
      {label ? (
        <p className="text-[11px] font-semibold text-slate-500">{label}</p>
      ) : null}
    </div>
  );

  if (variant === "overlay") {
    return (
      <div
        className={cn(
          "absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-[2px]",
          className,
        )}
      >
        {spinner}
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/20 backdrop-blur-sm">
        <div className="bg-white p-10 rounded-2xl shadow-2xl border border-slate-100">
          {spinner}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center py-12", className)}>
      {spinner}
    </div>
  );
}
