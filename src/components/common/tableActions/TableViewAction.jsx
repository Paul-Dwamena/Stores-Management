import React from "react";
import { cn } from "../../../utils/cn";

export default function TableViewAction({
  onClick,
  title = "View",
  disabled = false,
  children = "View",
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
        "p-1.5 text-slate-500 hover:bg-slate-100 rounded-md border border-slate-200 text-[9px] font-bold",
        disabled && "text-slate-300 cursor-not-allowed hover:bg-transparent",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
