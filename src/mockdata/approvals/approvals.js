import { getRequisitions } from "../stores/requisitions";

function getSpendingRequests() {
  return [];
}
function getFundingRequests() {
  return [];
}
function getBudgetLineItems() {
  return [];
}

/** Approval categories for queue filtering. */
export const APPROVAL_TYPE_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "general_requests", label: "Store requests" },
];

export const APPROVAL_PAGE_SIZE = 10;

/** Seed history only — pending rows are synced from PENDING requests. */
export const APPROVAL_QUEUE = [
  {
    id: "ap-h1",
    sourceRequestId: "req_007",
    requestNumber: "STR-REQ-2026-1100",
    requestType: "Request from Stores",
    approvalCategory: "general_requests",
    requester: "Current User",
    requesterDept: "Accra Central Store",
    costCenter: "Accra Central Store — Ringway Estates",
    amount: 0,
    date: "Jul 08, 2026 09:30 AM",
    decision: "Approved",
    decisionDate: "Jul 08, 2026 03:45 PM",
    comment: "Issue Safety Gloves from Accra Central Store.",
    status: "Approved",
    queue: "history",
    purpose: "Restock workshop gloves for Accra Central Store.",
    supportingDocuments: {
      receiptNumber: "REQ-ACC-2026-002",
      purchaseDate: "2026-07-08",
      fileName: "Stores requisition - safety gloves.pdf",
    },
    paymentDetails: null,
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
    approvalHistory: [
      {
        status: "Approved",
        isCurrent: false,
        approvers: [
          {
            name: "Ama Serwaa",
            status: "Approved",
            date: "Jul 08, 2026 03:45 PM",
            comment: "Issue Safety Gloves from Accra Central Store.",
          },
        ],
      },
    ],
  },
  {
    id: "ap-h2",
    sourceRequestId: null,
    requestNumber: "IST-ACC-2026-002",
    requestType: "Inter-store Transfer",
    approvalCategory: "general_requests",
    requester: "Ama Serwaa",
    requesterDept: "Accra Central Store",
    costCenter: "Accra Central Store — Ringway Estates",
    amount: 0,
    date: "Aug 08, 2026 02:10 PM",
    decision: "Approved",
    decisionDate: "Aug 08, 2026 04:40 PM",
    comment: "Approved charger restock from Accra Central to Tema Fleet Store.",
    status: "Approved",
    queue: "history",
    purpose: "Move USB Dual Car Chargers from Accra Central Store to Tema Fleet Store.",
    supportingDocuments: {
      receiptNumber: "IST-ACC-2026-002",
      purchaseDate: "2026-08-08",
      fileName: "Inter-store transfer - USB chargers.pdf",
    },
    paymentDetails: null,
    leaveDetails: null,
    storesDetails: {
      transferId: "ist-acc-002",
      requestNumber: "IST-ACC-2026-002",
      kind: "accessories",
      itemName: "USB Dual Car Charger",
      itemCode: "ACC-CHG-033",
      quantity: 8,
      fromStore: "Accra Central Store — Ringway Estates",
      toStore: "Tema Fleet Store — Community 12",
      justification: "Regional restock for field tablets.",
    },
    approvalHistory: [
      {
        status: "Approved",
        isCurrent: false,
        approvers: [
          {
            name: "Nii Quaye",
            status: "Approved",
            date: "Aug 08, 2026 04:40 PM",
            comment: "Approved charger restock from Accra Central to Tema Fleet Store.",
          },
        ],
      },
    ],
  },
  {
    id: "ap-h3",
    sourceRequestId: null,
    requestNumber: "STR-REQ-2026-1096",
    requestType: "Request from Stores",
    approvalCategory: "general_requests",
    requester: "Kwesi Mensah",
    requesterDept: "Kumasi Regional Store",
    costCenter: "Kumasi Regional Store — Asokwa",
    amount: 0,
    date: "Jul 18, 2026 10:05 AM",
    decision: "Rejected For Resubmission",
    decisionDate: "Jul 18, 2026 01:20 PM",
    comment: "Confirm available stock at Kumasi Regional Store before resubmitting.",
    status: "Rejected For Resubmission",
    queue: "history",
    purpose: "Issue warning triangles for Kumasi Regional Store.",
    supportingDocuments: {
      receiptNumber: "REQ-ACC-2026-004",
      purchaseDate: "2026-07-18",
      fileName: "Stores requisition - warning triangles.pdf",
    },
    paymentDetails: null,
    leaveDetails: null,
    storesDetails: {
      requisitionId: "req-seed-acc-004",
      requestNumber: "REQ-ACC-2026-004",
      kind: "accessories",
      itemName: "Warning Triangle",
      itemCode: "ACC-WT-008",
      quantity: 6,
      justification: "Issue warning triangles for Kumasi Regional Store.",
    },
    approvalHistory: [
      {
        status: "Rejected",
        isCurrent: false,
        approvers: [
          {
            name: "Yaw Mensah",
            status: "Rejected",
            date: "Jul 18, 2026 01:20 PM",
            comment: "Confirm available stock at Kumasi Regional Store before resubmitting.",
          },
        ],
      },
    ],
  },
  {
    id: "ap-h4",
    sourceRequestId: null,
    requestNumber: "IST-ACC-2026-008",
    requestType: "Inter-store Transfer",
    approvalCategory: "general_requests",
    requester: "Esi Nyarko",
    requesterDept: "Tema Fleet Store",
    costCenter: "Tema Fleet Store — Community 12",
    amount: 0,
    date: "Jul 22, 2026 11:40 AM",
    decision: "Approved",
    decisionDate: "Jul 22, 2026 03:10 PM",
    comment: "Approved floor-mat transfer to Accra Central Store.",
    status: "Approved",
    queue: "history",
    purpose: "Move surplus floor mats from Tema Fleet Store to Accra Central Store.",
    supportingDocuments: {
      receiptNumber: "IST-ACC-2026-008",
      purchaseDate: "2026-07-22",
      fileName: "Inter-store transfer - floor mats.pdf",
    },
    paymentDetails: null,
    leaveDetails: null,
    storesDetails: {
      transferId: "ist-acc-008",
      requestNumber: "IST-ACC-2026-008",
      kind: "accessories",
      itemName: "Floor Mat Set (Universal)",
      itemCode: "ACC-FLP-001",
      quantity: 10,
      fromStore: "Tema Fleet Store — Community 12",
      toStore: "Accra Central Store — Ringway Estates",
      justification: "Move surplus floor mats to Accra Central Store.",
    },
    approvalHistory: [
      {
        status: "Approved",
        isCurrent: false,
        approvers: [
          {
            name: "Kojo Asante",
            status: "Approved",
            date: "Jul 22, 2026 03:10 PM",
            comment: "Approved floor-mat transfer to Accra Central Store.",
          },
        ],
      },
    ],
  },
];

function cloneApproval(row) {
  return {
    ...row,
    supportingDocuments: row.supportingDocuments ? { ...row.supportingDocuments } : null,
    paymentDetails: row.paymentDetails ? { ...row.paymentDetails } : null,
    storesDetails: row.storesDetails ? { ...row.storesDetails } : null,
    leaveDetails: row.leaveDetails ? { ...row.leaveDetails } : null,
    spendingDetails: row.spendingDetails ? { ...row.spendingDetails } : null,
    fundingDetails: row.fundingDetails ? { ...row.fundingDetails } : null,
    vehicleRequestDetails: row.vehicleRequestDetails ? { ...row.vehicleRequestDetails } : null,
    approvalHistory: (row.approvalHistory || []).map((level) => ({
      ...level,
      approvers: (level.approvers || []).map((approver) => ({ ...approver })),
    })),
  };
}

let sessionApprovals = APPROVAL_QUEUE.map(cloneApproval);

const REQUEST_TYPE_TO_APPROVAL = {
  leave_request: { label: "Leave Request", category: "general_requests" },
  vehicle_request: { label: "Vehicle Request", category: "general_requests" },
  maintenance_request: { label: "Maintenance Request", category: "works_services" },
  work_service_request: { label: "Work Service Request", category: "works_services" },
  request_from_stores: { label: "Request from Stores", category: "general_requests" },
  inter_store_transfer: { label: "Inter-store Transfer", category: "general_requests" },
  spending_request: { label: "Spending Request", category: "general_requests" },
  funding_request: { label: "Funding Request", category: "general_requests" },
};

function formatApprovalQueueDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getApprovals() {
  return sessionApprovals.map(cloneApproval);
}

export function getApprovalById(id) {
  const match = sessionApprovals.find((row) => row.id === id);
  return match ? cloneApproval(match) : null;
}

/**
 * Push a submitted request into the pending approval queue.
 * Returns the created approval row (or null if not queued).
 */
function requestPayloadFromRequisition(requisition) {
  const qty = requisition.quantityRequested ?? requisition.quantity ?? 0;
  return {
    id: `req_from_${requisition.id}`,
    requestNumber: requisition.requestNumber,
    requestType: "request_from_stores",
    amount: 0,
    costCenter: requisition.storeLocation || "Stores",
    requestedBy: requisition.requestedBy || "Current User",
    purpose: requisition.comment || requisition.description || requisition.itemName,
    expenseCategory: `${requisition.itemName || "Store item"} × ${qty}`,
    status: "PENDING",
    submittedDate: requisition.createdAt,
    createdAt: requisition.createdAt,
    storesDetails: {
      requisitionId: requisition.id,
      requestNumber: requisition.requestNumber,
      kind: requisition.kind || "accessories",
      itemName: requisition.itemName,
      itemCode: requisition.itemCode,
      quantity: qty,
      justification: requisition.justification || requisition.comment || requisition.description,
    },
  };
}

function findExistingStoreApproval(request) {
  const requisitionId = request?.storesDetails?.requisitionId;
  const storeRequestNumber = request?.storesDetails?.requestNumber;
  return sessionApprovals.find((row) => {
    if (request?.id && row.sourceRequestId === request.id) return true;
    if (requisitionId && row.storesDetails?.requisitionId === requisitionId) return true;
    if (
      storeRequestNumber
      && (
        row.storesDetails?.requestNumber === storeRequestNumber
        || row.requestNumber === storeRequestNumber
      )
    ) {
      return true;
    }
    return false;
  }) ?? null;
}

export function enqueueApprovalFromRequest(request) {
  if (!request) return null;
  const status = (request.status ?? "").toString().toUpperCase();
  if (status !== "PENDING") return null;

  const existing = findExistingStoreApproval(request);
  if (existing) {
    if (request.storesDetails) {
      sessionApprovals = sessionApprovals.map((row) =>
        row.id === existing.id
          ? { ...row, storesDetails: { ...request.storesDetails } }
          : row,
      );
      const updated = sessionApprovals.find((row) => row.id === existing.id);
      return cloneApproval(updated);
    }
    return cloneApproval(existing);
  }

  const typeMeta =
    REQUEST_TYPE_TO_APPROVAL[request.requestType]
    || {
      label: (request.requestType || "Request").toString().replace(/_/g, " "),
      category: "general_requests",
    };

  const requesterName =
    request.vehicleRequestDetails?.driverName
    || request.leaveDetails?.employeeName
    || request.requestedBy
    || "Current User";
  const requesterDept =
    request.leaveDetails?.department
    || request.costCenter
    || "—";

  const submittedAt = request.submittedDate || request.createdAt || new Date().toISOString();
  const created = {
    id: `ap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sourceRequestId: request.id,
    requestNumber: request.requestNumber,
    requestType: typeMeta.label,
    approvalCategory: typeMeta.category,
    requester: requesterName,
    requesterDept,
    costCenter: request.costCenter || "—",
    amount: Number(request.amount) || 0,
    date: formatApprovalQueueDate(submittedAt),
    submittedAt,
    decision: null,
    decisionDate: null,
    comment: "",
    status: "Pending",
    queue: "pending",
    purpose: request.purpose || request.expenseCategory || "—",
    supportingDocuments: null,
    paymentDetails: null,
    storesDetails: request.storesDetails ?? null,
    leaveDetails: request.leaveDetails ?? null,
    vehicleRequestDetails: request.vehicleRequestDetails ?? null,
    spendingDetails: null,
    fundingDetails: null,
    approvalHistory: [
      {
        status: "Pending",
        isCurrent: true,
        approvers: [
          { name: "Primary Approver", status: "Pending", date: null, comment: "" },
        ],
      },
    ],
  };

  sessionApprovals = [created, ...sessionApprovals];
  return cloneApproval(created);
}

function firstAttachmentFileName(attachments) {
  if (!attachments || typeof attachments !== "object") return null;
  const value = Object.values(attachments).find((item) => typeof item === "string" && item.trim());
  return value || null;
}

function isSpendingApprovalRow(row) {
  return (
    row?.sourceKind === "spending_request"
    || row?.requestType === "Spending Request"
    || Boolean(row?.spendingDetails)
  );
}

function spendingRequestNumber(request) {
  return request?.requestNumber || getSpendingRequestNumber(request);
}

function findSpendingApproval(request) {
  const requestNumber = spendingRequestNumber(request);
  return sessionApprovals.find((row) => {
    if (!isSpendingApprovalRow(row)) return false;
    if (request?.id && row.sourceRequestId === request.id) return true;
    return Boolean(requestNumber) && row.requestNumber === requestNumber;
  });
}

function reconcileSpendingApprovals(spendingRows = getSpendingRequests()) {
  const byId = new Map((spendingRows || []).map((row) => [row.id, row]));
  const historyKeys = new Set();

  sessionApprovals = sessionApprovals.map((row) => {
    if (!isSpendingApprovalRow(row) || row.queue !== "pending") return row;
    const source = byId.get(row.sourceRequestId);
    const sourceStatus = (source?.status ?? "").toString().toUpperCase();
    if (sourceStatus === "APPROVED") {
      return {
        ...row,
        queue: "history",
        status: "Approved",
        decision: "Approved",
        decisionDate: row.decisionDate || formatApprovalQueueDate(),
      };
    }
    if (sourceStatus === "REJECTED") {
      return {
        ...row,
        queue: "history",
        status: "Rejected For Resubmission",
        decision: "Rejected For Resubmission",
        decisionDate: row.decisionDate || formatApprovalQueueDate(),
        rejectionReason: source.rejectionReason || row.rejectionReason,
      };
    }
    return row;
  });

  sessionApprovals.forEach((row) => {
    if (isSpendingApprovalRow(row) && row.queue === "history") {
      historyKeys.add(row.sourceRequestId || row.requestNumber);
    }
  });

  const seenPending = new Set();
  sessionApprovals = sessionApprovals.filter((row) => {
    if (!isSpendingApprovalRow(row)) return true;
    const key = row.sourceRequestId || row.requestNumber;
    if (row.queue === "pending" && historyKeys.has(key)) return false;
    if (row.queue === "pending") {
      if (seenPending.has(key)) return false;
      seenPending.add(key);
    }
    return true;
  });
}

/**
 * Push a submitted spending request into Pending Approvals under General requests.
 */
export function enqueueApprovalFromSpendingRequest(request) {
  if (!request) return null;

  const existing = findSpendingApproval(request);
  if (existing) return cloneApproval(existing);

  const status = (request.status ?? "").toString().toUpperCase();
  if (status !== "PENDING_APPROVAL") return null;

  const typeMeta = REQUEST_TYPE_TO_APPROVAL.spending_request;
  const costCenterPath = getCostCenterPath(getCostCenterTree(), request.costCenterId).join(" / ");
  const category = getExpenseCategoriesCatalog().find((row) => row.id === request.expenseCategoryId);
  const purpose = getPurposes().find((row) => row.id === request.purposeId);
  const payee = getPayees().find((row) => row.id === request.payeeId);
  const account = payee?.accounts?.find((row) => row.id === request.payeeAccountId);
  const funding = getFundingRequests().find((row) => row.id === request.fundingRequestId);
  const requestNumber = spendingRequestNumber(request);
  const fileName = firstAttachmentFileName(request.attachments);

  const created = {
    id: `ap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sourceKind: "spending_request",
    sourceRequestId: request.id,
    requestNumber,
    requestType: typeMeta.label,
    approvalCategory: typeMeta.category,
    requester: "Current User",
    requesterDept: costCenterPath || "—",
    costCenter: costCenterPath || "—",
    amount: Number(request.amount) || 0,
    date: formatApprovalQueueDate(request.createdAt),
    decision: null,
    decisionDate: null,
    comment: "",
    status: "Pending",
    queue: "pending",
    purpose: request.justification || purpose?.purpose || "—",
    supportingDocuments: fileName
      ? { receiptNumber: "—", purchaseDate: "—", fileName }
      : null,
    paymentDetails: null,
    storesDetails: null,
    leaveDetails: null,
    spendingDetails: {
      expenseCategory: category?.name || "—",
      fundingRequest: funding ? getFundingRequestNumber(funding) : "—",
      payee: payee?.name || "—",
      payeeAccount: account?.label || "—",
      attachments: request.attachments && typeof request.attachments === "object"
        ? { ...request.attachments }
        : {},
    },
    fundingDetails: null,
    approvalHistory: [
      {
        status: "Pending",
        isCurrent: true,
        approvers: [
          { name: "Primary Approver", status: "Pending", date: null, comment: "" },
        ],
      },
    ],
  };

  sessionApprovals = [created, ...sessionApprovals];
  return cloneApproval(created);
}

export function syncApprovalsFromSpendingRequests(requests) {
  const rows = Array.isArray(requests) ? requests : getSpendingRequests();
  reconcileSpendingApprovals(rows);
  rows
    .filter((request) => (request?.status ?? "").toString().toUpperCase() === "PENDING_APPROVAL")
    .forEach((request) => enqueueApprovalFromSpendingRequest(request));
  reconcileSpendingApprovals(rows);
  return getApprovals();
}

function isFundingApprovalRow(row) {
  return (
    row?.sourceKind === "funding_request"
    || row?.requestType === "Funding Request"
    || Boolean(row?.fundingDetails)
  );
}

function fundingRequestNumber(request) {
  return request?.requestNumber || getFundingRequestNumber(request);
}

function findFundingApproval(request) {
  const requestNumber = fundingRequestNumber(request);
  return sessionApprovals.find((row) => {
    if (!isFundingApprovalRow(row)) return false;
    if (request?.id && row.sourceRequestId === request.id) return true;
    return Boolean(requestNumber) && row.requestNumber === requestNumber;
  });
}

function reconcileFundingApprovals(fundingRows = getFundingRequests()) {
  const byId = new Map((fundingRows || []).map((row) => [row.id, row]));
  const historyKeys = new Set();

  sessionApprovals = sessionApprovals.map((row) => {
    if (!isFundingApprovalRow(row) || row.queue !== "pending") return row;
    const source = byId.get(row.sourceRequestId);
    const sourceStatus = (source?.status ?? "").toString().toUpperCase();
    if (sourceStatus === "APPROVED") {
      return {
        ...row,
        queue: "history",
        status: "Approved",
        decision: "Approved",
        decisionDate: row.decisionDate || formatApprovalQueueDate(),
      };
    }
    if (sourceStatus === "REJECTED") {
      return {
        ...row,
        queue: "history",
        status: "Rejected For Resubmission",
        decision: "Rejected For Resubmission",
        decisionDate: row.decisionDate || formatApprovalQueueDate(),
        rejectionReason: source.rejectionReason || row.rejectionReason,
      };
    }
    return row;
  });

  sessionApprovals.forEach((row) => {
    if (isFundingApprovalRow(row) && row.queue === "history") {
      historyKeys.add(row.sourceRequestId || row.requestNumber);
    }
  });

  const seenPending = new Set();
  sessionApprovals = sessionApprovals.filter((row) => {
    if (!isFundingApprovalRow(row)) return true;
    const key = row.sourceRequestId || row.requestNumber;
    if (row.queue === "pending" && historyKeys.has(key)) return false;
    if (row.queue === "pending") {
      if (seenPending.has(key)) return false;
      seenPending.add(key);
    }
    return true;
  });
}

/**
 * Push a submitted funding request into Pending Approvals under General requests.
 */
export function enqueueApprovalFromFundingRequest(request) {
  if (!request) return null;

  const existing = findFundingApproval(request);
  if (existing) return cloneApproval(existing);

  const status = (request.status ?? "").toString().toUpperCase();
  if (status !== "PENDING") return null;

  const typeMeta = REQUEST_TYPE_TO_APPROVAL.funding_request;
  const costCenterPath = getCostCenterPath(getCostCenterTree(), request.costCenterId).join(" / ");
  const lineItem = getBudgetLineItems().find((row) => row.id === request.budgetLineItemId);
  const purpose = getPurposes().find((row) => row.id === request.purposeId);
  const requestNumber = fundingRequestNumber(request);

  const created = {
    id: `ap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sourceKind: "funding_request",
    sourceRequestId: request.id,
    requestNumber,
    requestType: typeMeta.label,
    approvalCategory: typeMeta.category,
    requester: "Current User",
    requesterDept: costCenterPath || "—",
    costCenter: costCenterPath || "—",
    amount: Number(request.amount) || 0,
    date: formatApprovalQueueDate(request.createdAt),
    decision: null,
    decisionDate: null,
    comment: "",
    status: "Pending",
    queue: "pending",
    purpose: request.justification || purpose?.purpose || "—",
    supportingDocuments: null,
    paymentDetails: null,
    storesDetails: null,
    leaveDetails: null,
    spendingDetails: null,
    fundingDetails: {
      budgetLineItem: lineItem?.name || "—",
      purpose: purpose?.purpose || "—",
    },
    approvalHistory: [
      {
        status: "Pending",
        isCurrent: true,
        approvers: [
          { name: "Primary Approver", status: "Pending", date: null, comment: "" },
        ],
      },
    ],
  };

  sessionApprovals = [created, ...sessionApprovals];
  return cloneApproval(created);
}

export function syncApprovalsFromFundingRequests(requests) {
  const rows = Array.isArray(requests) ? requests : getFundingRequests();
  reconcileFundingApprovals(rows);
  rows
    .filter((request) => (request?.status ?? "").toString().toUpperCase() === "PENDING")
    .forEach((request) => enqueueApprovalFromFundingRequest(request));
  reconcileFundingApprovals(rows);
  return getApprovals();
}

export function syncApprovalsFromSupplyRequisitions() {
  getRequisitions()
    .filter((row) => (row.status || "").toString().toUpperCase() === "PENDING_SUPPLY_REQUEST")
    .forEach((row) => enqueueApprovalFromRequest(requestPayloadFromRequisition(row)));
}

/** Ensure every PENDING request and pending supply requisition appears in the approval queue. */
export function syncApprovalsFromRequests(requests = []) {
  syncApprovalsFromSpendingRequests();
  syncApprovalsFromFundingRequests();
  (Array.isArray(requests) ? requests : [])
    .filter((request) => (request?.status ?? "").toString().toUpperCase() === "PENDING")
    .forEach((request) => enqueueApprovalFromRequest(request));
  syncApprovalsFromSupplyRequisitions();
  return getApprovals();
}

export function decideApproval(id, { type, comments = "", rejectionReason = "", sourceRequestId } = {}) {
  const now = formatApprovalQueueDate();
  let updated = null;

  sessionApprovals = sessionApprovals.map((row) => {
    const matches =
      row.id === id
      || (
        Boolean(sourceRequestId)
        && row.queue === "pending"
        && row.sourceRequestId === sourceRequestId
      );
    if (!matches) return row;
    if (updated && row.id !== id) return row;
    if (type === "approve") {
      updated = {
        ...row,
        queue: "history",
        status: "Approved",
        decision: "Approved",
        decisionDate: now,
        comment: comments,
        rejectionReason: undefined,
        approvalHistory: (row.approvalHistory || []).map((level) =>
          level.isCurrent
            ? {
                ...level,
                status: "Approved",
                isCurrent: false,
                approvers: (level.approvers || []).map((approver, index) =>
                  index === 0
                    ? {
                        ...approver,
                        status: "Approved",
                        date: now,
                        comment: comments,
                      }
                    : approver,
                ),
              }
            : level,
        ),
      };
      return updated;
    }

    updated = {
      ...row,
      queue: "history",
      status: "Rejected For Resubmission",
      decision: "Rejected For Resubmission",
      decisionDate: now,
      comment: comments,
      rejectionReason,
      approvalHistory: (row.approvalHistory || []).map((level) =>
        level.isCurrent
          ? {
              ...level,
              status: "Rejected",
              isCurrent: false,
              approvers: (level.approvers || []).map((approver, index) =>
                index === 0
                  ? {
                      ...approver,
                      status: "Rejected",
                      date: now,
                      comment: [rejectionReason, comments].filter(Boolean).join(" — "),
                    }
                  : approver,
              ),
            }
          : level,
      ),
    };
    return updated;
  });

  return updated ? cloneApproval(updated) : null;
}

export function formatApprovalAmount(amount) {
  if (amount == null || Number(amount) === 0) return "—";
  return `GH₵ ${Number(amount).toLocaleString()}`;
}
