import { formatStatusLabel } from "../../../../utils/apiResponseHelpers";

/** Canonical transfer status values — match API response strings. */
export const TRANSFER_STATUS = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  PENDING_DISPATCH: "PENDING_DISPATCH",
  IN_TRANSIT: "IN_TRANSIT",
  ARRIVED: "ARRIVED",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
};

export function transferStatusKey(status) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export const TRANSFER_STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: TRANSFER_STATUS.PENDING_APPROVAL, label: "Pending approval" },
  { value: TRANSFER_STATUS.PENDING_DISPATCH, label: "Pending dispatch" },
  { value: TRANSFER_STATUS.IN_TRANSIT, label: "In transit" },
  { value: TRANSFER_STATUS.ARRIVED, label: "Arrived" },
  { value: TRANSFER_STATUS.COMPLETED, label: "Completed" },
  { value: TRANSFER_STATUS.REJECTED, label: "Rejected dispatch" },
  { value: TRANSFER_STATUS.CANCELLED, label: "Cancelled" },
];

const TRANSFER_STATUS_LABELS = {
  [TRANSFER_STATUS.PENDING_APPROVAL]: "Pending approval",
  [TRANSFER_STATUS.PENDING_DISPATCH]: "Pending dispatch",
  [TRANSFER_STATUS.IN_TRANSIT]: "In transit",
  [TRANSFER_STATUS.ARRIVED]: "Arrived",
  [TRANSFER_STATUS.COMPLETED]: "Completed",
  [TRANSFER_STATUS.REJECTED]: "Rejected dispatch",
  [TRANSFER_STATUS.CANCELLED]: "Cancelled",
};

export function formatTransferStatus(status) {
  const key = transferStatusKey(status);
  return TRANSFER_STATUS_LABELS[key] || formatStatusLabel(key);
}

export function transferStatusBadgeClass(status) {
  switch (transferStatusKey(status)) {
    case TRANSFER_STATUS.PENDING_APPROVAL:
      return "bg-amber-50 text-amber-700 border-amber-200";
    case TRANSFER_STATUS.PENDING_DISPATCH:
      return "bg-violet-50 text-violet-700 border-violet-200";
    case TRANSFER_STATUS.IN_TRANSIT:
      return "bg-teal-50 text-teal-700 border-teal-200";
    case TRANSFER_STATUS.ARRIVED:
      return "bg-success-muted text-success border-[#b7d4c8]";
    case TRANSFER_STATUS.COMPLETED:
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    case TRANSFER_STATUS.REJECTED:
      return "bg-rose-50 text-rose-700 border-rose-200";
    case TRANSFER_STATUS.CANCELLED:
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}
