import React from "react";
import { cn } from "../../../utils/cn";

const VARIANT_CLASSES = {
  edit: "text-primary hover:bg-slate-100",
  approve: "text-success hover:bg-success-muted",
  convert: "text-primary hover:bg-slate-100",
  resolve: "text-sky-600 hover:bg-sky-50",
  review: "text-sky-600 hover:bg-sky-50",
  info: "text-sky-600 hover:bg-sky-50",
  delete: "text-rose-600 hover:bg-rose-50",
  dismiss: "text-rose-600 hover:bg-rose-50",
  reject: "text-rose-600 hover:bg-rose-50",
  warning: "text-amber-600 hover:bg-amber-50",
  neutral: "text-slate-500 hover:bg-slate-100",
};

export default function TableIconAction({
  onClick,
  title,
  icon: Icon,
  variant = "neutral",
  disabled = false,
  iconSize = 16,
  iconClassName,
  className,
  ...props
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-md border border-slate-200",
        disabled
          ? "text-slate-300 cursor-not-allowed hover:bg-transparent"
          : VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.neutral,
        className,
      )}
      {...props}
    >
      {Icon && <Icon size={iconSize} className={iconClassName} />}
    </button>
  );
}
