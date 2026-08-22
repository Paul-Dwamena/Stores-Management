import React from "react";
import { cn } from "../../../utils/cn";

const Button = React.forwardRef(
  (
    { className, variant = "primary", size = "md", children, ...props },
    ref,
  ) => {
    const variants = {
      primary:
        "bg-brand hover:bg-brand-hover text-white shadow-sm",
      secondary: "bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold",
      outline:
        "border border-slate-200 hover:border-slate-300 text-slate-700 font-bold hover:bg-slate-50",
      ghost: "hover:bg-slate-100 text-slate-600",
      danger:
        "bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-200/50",
      warning:
        "bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-300/50",
      info:
        "bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-200/50",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-[12px]",
      lg: "px-5 py-2.5 text-[13px]",
      modal: "px-5 py-2.5 text-[12px] rounded-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-bold transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
