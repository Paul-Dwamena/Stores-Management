import React from "react";
import { cn } from "../../../../utils/cn";
import { formatStatusLabel } from "../../../../utils/apiResponseHelpers";
import { formatRequisitionStatus } from "../../../../mockdata/stores";
import { supplyStatusKey } from "./supplyStatus";
import {
  STATUS_BADGE_CLASS,
  workflowStatusBadgeClass,
} from "../../../../utils/workflowStatusBadge";

const SUPPLY_STATUS_KEYS = new Set([
  "PENDING_SUPPLY_REQUEST",
  "PENDING_SUPPLY_APPROVAL",
  "PENDING_ISSUANCE",
  "SUPPLIED",
  "PARTIALLY_SUPPLIED",
  "REJECTED",
]);

export function SupplyStatusBadge({ status, className }) {
  const key = supplyStatusKey(status);
  const label = SUPPLY_STATUS_KEYS.has(key)
    ? formatRequisitionStatus(key)
    : formatStatusLabel(key);

  return (
    <span
      className={cn(
        STATUS_BADGE_CLASS,
        workflowStatusBadgeClass(key),
        className,
      )}
    >
      {label}
    </span>
  );
}
