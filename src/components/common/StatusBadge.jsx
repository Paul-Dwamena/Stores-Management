import React from "react";
import { cn } from "../../utils/cn";
import { formatStatusLabel, statusBadgeClass } from "../../utils/apiResponseHelpers";

/**
 * Renders a status pill using the global three-tone system:
 * success (green), pending (blue), failed (red).
 */
const StatusBadge = ({ status, rawStatus, className, rounded = "md" }) => {
  const source = rawStatus ?? status;
  const label = formatStatusLabel(status ?? rawStatus);

  return (
    <span
      className={cn(
        "px-2 py-0.5 text-[9px] font-medium border inline-block",
        rounded === "full" ? "rounded-full" : "rounded",
        statusBadgeClass(source),
        className,
      )}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
