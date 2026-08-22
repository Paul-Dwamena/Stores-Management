import { enqueueApprovalFromRequest } from "../approvals";

/** Seed requests — store accessory requests only. */
const REQUESTS = [
  {
    id: "req_002",
    requestNumber: "STR-REQ-2026-1105",
    requestType: "request_from_stores",
    amount: 0,
    costCenter: "Accra Central Store — Ringway Estates",
    budgetLine: "Stores Requisition",
    requestClass: "Operating",
    expenseCategory: "Oil Filter × 2",
    purpose: "Needed for scheduled service on GS-2210-20.",
    status: "PENDING",
    approvalStatus: "Pending",
    paymentStatus: null,
    leaveDetails: null,
    storesDetails: {
      requisitionId: "req-seed-acc-001",
      requestNumber: "REQ-ACC-2026-001",
      kind: "accessories",
      itemName: "Oil Filter",
      itemCode: "ACC-OF-100",
      quantity: 2,
      justification: "Needed for scheduled service on GS-2210-20.",
    },
    submittedDate: "2026-07-26T11:05:00.000Z",
    approvedBy: null,
    approvalDate: null,
    createdAt: "2026-07-26T11:05:00.000Z",
    updatedAt: "2026-07-26T11:05:00.000Z",
  },
  {
    id: "req_007",
    requestNumber: "STR-REQ-2026-1100",
    requestType: "request_from_stores",
    amount: 0,
    costCenter: "Accra Central Store — Ringway Estates",
    budgetLine: "Stores Requisition",
    requestClass: "Operating",
    expenseCategory: "Safety Gloves × 12",
    purpose: "Restock workshop gloves for Accra Central Store.",
    status: "APPROVED",
    approvalStatus: "Approved",
    paymentStatus: null,
    leaveDetails: null,
    storesDetails: {
      requisitionId: "req-seed-acc-002",
      requestNumber: "REQ-ACC-2026-002",
      kind: "accessories",
      itemName: "Safety Gloves",
      itemCode: "ACC-SG-012",
      quantity: 12,
      justification: "Restock workshop gloves for Accra Central Store.",
    },
    submittedDate: "2026-07-08T09:30:00.000Z",
    approvedBy: "Ama Serwaa",
    approvalDate: "2026-07-08T15:45:00.000Z",
    createdAt: "2026-07-08T09:30:00.000Z",
    updatedAt: "2026-07-09T08:00:00.000Z",
  },
];

let sessionRequests = REQUESTS.map((request) => ({ ...request }));

function nextRequestNumber() {
  const year = new Date().getFullYear();
  const sequence = sessionRequests.filter((request) =>
    request.requestNumber.startsWith(`STR-REQ-${year}-`),
  ).length;
  return `STR-REQ-${year}-${String(sequence + 1100).padStart(4, "0")}`;
}

export function getRequests() {
  return sessionRequests.map((request) => ({ ...request }));
}

export function saveRequest(payload) {
  const now = new Date().toISOString();
  const status = (payload.status ?? "PENDING").toString().toUpperCase();
  const created = {
    id: `req_${Date.now()}`,
    requestNumber: nextRequestNumber(),
    requestType: payload.requestType,
    amount: Number(payload.amount) || 0,
    costCenter: payload.costCenter,
    budgetLine: payload.budgetLine,
    requestClass: payload.requestClass,
    expenseCategory: payload.expenseCategory,
    purpose: payload.purpose,
    status,
    approvalStatus:
      payload.approvalStatus
      ?? (status === "DRAFT" ? "Draft" : status === "APPROVED" ? "Approved" : "Pending"),
    paymentStatus: payload.paymentStatus ?? null,
    leaveDetails: payload.leaveDetails ?? null,
    storesDetails: payload.storesDetails ?? null,
    submittedDate: now,
    approvedBy: null,
    approvalDate: null,
    createdAt: now,
    updatedAt: now,
  };

  sessionRequests = [created, ...sessionRequests];
  if (status === "PENDING") {
    enqueueApprovalFromRequest(created);
  }
  return created;
}

export function updateRequestApprovalStatus(requestId, { status, approvalStatus, approvedBy = null } = {}) {
  if (!requestId) return null;
  const now = new Date().toISOString();
  let updated = null;
  sessionRequests = sessionRequests.map((request) => {
    if (request.id !== requestId) return request;
    updated = {
      ...request,
      status: (status ?? request.status).toString().toUpperCase(),
      approvalStatus: approvalStatus ?? request.approvalStatus,
      approvedBy,
      approvalDate: status && String(status).toUpperCase() === "APPROVED" ? now : request.approvalDate,
      updatedAt: now,
    };
    return updated;
  });
  return updated ? { ...updated } : null;
}
