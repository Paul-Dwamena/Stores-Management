import React from "react";
import { cn } from "../../../../utils/cn";
import { formatRequisitionStatus } from "../../../../mockdata/stores";
import { supplyStatusBadgeClass, supplyStatusKey } from "./supplyStatus";

export function SupplyStatusBadge({ status, className }) {
  const key = supplyStatusKey(status);
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap",
        supplyStatusBadgeClass(key),
        className,
      )}
    >
      {formatRequisitionStatus(key)}
    </span>
  );
}
