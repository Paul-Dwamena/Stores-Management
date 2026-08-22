import React from "react";
import { cn } from "../../utils/cn";

/** Visual grouping for custom fields on runtime forms (not a Level 1 tree section). */
export default function FormOthersBlock({ children, className }) {
  if (!children) return null;
  return (
    <section className={cn("space-y-3 border-t border-slate-200 pt-4", className)}>
      {children}
    </section>
  );
}
