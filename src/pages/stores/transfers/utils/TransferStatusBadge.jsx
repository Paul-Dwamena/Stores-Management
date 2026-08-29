import React from "react";
import { cn } from "../../../../utils/cn";
import {
  formatTransferStatus,
  transferStatusKey,
} from "./transferStatus";
import {
  STATUS_BADGE_CLASS,
  workflowStatusBadgeClass,
} from "../../../../utils/workflowStatusBadge";

export { STATUS_BADGE_CLASS as TRANSFER_STATUS_BADGE_CLASS };

export function TransferStatusBadge({ status, className }) {
  const key = transferStatusKey(status);
  return (
    <span
      className={cn(
        STATUS_BADGE_CLASS,
        workflowStatusBadgeClass(key),
        className,
      )}
    >
      {formatTransferStatus(key)}
    </span>
  );
}
