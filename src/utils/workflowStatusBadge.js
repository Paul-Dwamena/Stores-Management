import {
  supplyStatusBadgeClass,
  supplyStatusKey,
} from "../pages/stores/supplies/utils/supplyStatus";
import {
  TRANSFER_STATUS,
  transferStatusBadgeClass,
  transferStatusKey,
} from "../pages/stores/transfers/utils/transferStatus";

export const STATUS_BADGE_CLASS =
  "inline-flex px-2 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap";

const TRANSFER_STATUS_KEYS = new Set(Object.values(TRANSFER_STATUS));

const SUPPLY_STATUS_KEYS = new Set([
  "PENDING_SUPPLY_REQUEST",
  "PENDING_SUPPLY_APPROVAL",
  "PENDING_ISSUANCE",
  "SUPPLIED",
  "PARTIALLY_SUPPLIED",
  "REJECTED",
]);

const INVENTORY_STATUS_CLASSES = {
  IN_STOCK: "bg-success-muted text-success border-[#b7d4c8]",
  ACTIVE: "bg-success-muted text-success border-[#b7d4c8]",
  LOW_STOCK: "bg-amber-50 text-amber-700 border-amber-200",
  OUT_OF_STOCK: "bg-rose-50 text-rose-700 border-rose-200",
  INACTIVE: "bg-slate-50 text-slate-600 border-slate-200",
};

const GENERIC_STATUS_CLASSES = {
  APPROVED: "bg-success-muted text-success border-[#b7d4c8]",
  PAID: "bg-success-muted text-success border-[#b7d4c8]",
  SUCCESSFUL: "bg-success-muted text-success border-[#b7d4c8]",
  SUPPLIED: "bg-success-muted text-success border-[#b7d4c8]",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  REJECTED_FOR_RESUBMISSION: "bg-rose-50 text-rose-700 border-rose-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  CANCELED: "bg-rose-50 text-rose-700 border-rose-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
};

/** Shared badge colours for supply, transfer, and inventory workflow statuses. */
export function workflowStatusBadgeClass(status) {
  const transferKey = transferStatusKey(status);
  if (TRANSFER_STATUS_KEYS.has(transferKey)) {
    return transferStatusBadgeClass(status);
  }

  const supplyKey = supplyStatusKey(status);
  if (SUPPLY_STATUS_KEYS.has(supplyKey)) {
    return supplyStatusBadgeClass(status);
  }

  const normalized = String(status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (INVENTORY_STATUS_CLASSES[normalized]) {
    return INVENTORY_STATUS_CLASSES[normalized];
  }

  if (GENERIC_STATUS_CLASSES[normalized]) {
    return GENERIC_STATUS_CLASSES[normalized];
  }

  return "bg-slate-50 text-slate-600 border-slate-200";
}
