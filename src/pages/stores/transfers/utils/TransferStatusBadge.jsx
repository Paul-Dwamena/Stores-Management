import React from "react";
import { cn } from "../../../../utils/cn";
import {
  formatTransferStatus,
  transferStatusBadgeClass,
  transferStatusKey,
} from "./transferStatus";

export const TRANSFER_STATUS_BADGE_CLASS =
  "inline-flex px-2 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap";

export function TransferStatusBadge({ status, className }) {
  const key = transferStatusKey(status);
  return (
    <span
      className={cn(
        TRANSFER_STATUS_BADGE_CLASS,
        transferStatusBadgeClass(key),
        className,
      )}
    >
      {formatTransferStatus(key)}
    </span>
  );
}
