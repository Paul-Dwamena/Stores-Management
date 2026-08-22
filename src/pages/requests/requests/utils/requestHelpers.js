export const REQUEST_TYPE_OPTIONS = [
  { value: "request_from_stores", label: "Request from Stores" },
];

export const REQUEST_TYPE_ACTIONS = {
  request_from_stores: {
    mode: "modal",
    template: "stores",
    continueLabel: "Continue to item request form",
    hint: "Opens the New item request form",
  },
};

export function getRequestTypeAction(requestType) {
  return REQUEST_TYPE_ACTIONS[requestType] ?? null;
}

export function getRequestTypeLabel(requestType) {
  return REQUEST_TYPE_OPTIONS.find((option) => option.value === requestType)?.label
    ?? String(requestType ?? "").replace(/_/g, " ");
}

export const REQUEST_STATUS_FILTERS = [
  { value: "ALL", label: "All Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING", label: "Pending Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export function formatRequestAmount(amount) {
  const value = Number(amount) || 0;
  if (value === 0) return "—";
  return `GHS ${value.toLocaleString()}`;
}

export function formatRequestStatus(status) {
  const raw = (status ?? "PENDING").toString().toUpperCase();
  if (raw === "DRAFT") return "Draft";
  if (raw === "PENDING") return "Pending";
  if (raw === "APPROVED") return "Approved";
  if (raw === "REJECTED") return "Rejected";
  return raw.replace(/_/g, " ");
}

export function formatRequestDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildStoresRequestPayload(requisition) {
  const itemLabel = requisition?.itemName || "Store item";
  const qty = requisition?.quantity ?? 1;
  return {
    requestType: "request_from_stores",
    amount: 0,
    costCenter: "Accra Central Store — Ringway Estates",
    budgetLine: "Stores Requisition",
    requestClass: "Operating",
    expenseCategory: `${itemLabel} × ${qty}`,
    purpose:
      (requisition?.justification || "").trim()
      || requisition?.description
      || `Store request ${requisition?.requestNumber || ""}`.trim(),
    status: "PENDING",
    approvalStatus: "Pending",
    paymentStatus: null,
    storesDetails: {
      requisitionId: requisition?.id ?? null,
      requestNumber: requisition?.requestNumber ?? null,
      kind: "accessories",
      itemName: itemLabel,
      itemCode: requisition?.itemCode ?? null,
      quantity: qty,
      justification: (requisition?.justification || "").trim() || null,
    },
  };
}
