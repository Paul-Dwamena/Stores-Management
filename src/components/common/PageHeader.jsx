import React from "react";
import { cn } from "../../utils/cn";

/**
 * PageHeader Component
 * A reusable header for pages in the Fleet Management Dashboard.
 *
 * @param {Object} props
 * @param {string} props.title - The main heading text.
 * @param {string} [props.description] - The subtitle or description text.
 * @param {React.ReactNode} [props.children] - Action elements (buttons, etc.) to show on the right.
 * @param {React.ElementType} [props.icon] - Optional Lucide icon to display next to the title.
 * @param {string} [props.className] - Optional className override for the wrapper.
 */
const PageHeader = ({ title, description, children, icon: Icon, className }) => {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 min-w-0",
        className ?? "mb-3",
      )}
    >
      <div className="min-w-0 flex-1">
        <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          {Icon && <Icon size={22} className="text-slate-400 shrink-0" />}
          <span className="truncate">{title}</span>
        </h1>
        {description && (
          <p className="text-[12px] text-slate-500 font-medium max-w-3xl mt-1">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
