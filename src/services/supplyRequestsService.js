import api from "./api";
import { extractApiErrorDetail } from "../utils/apiResponseHelpers";

const requesterName = (requester) =>
  [requester?.first_name, requester?.last_name].filter(Boolean).join(" ").trim();

const statusKey = (status) =>
  String(status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

export const PENDING_APPROVAL_STATUS = "PENDING_SUPPLY_APPROVAL";
export const PENDING_ISSUANCE_STATUS = "PENDING_ISSUANCE";
const PENDING_QUEUE_STATUSES = new Set([
  PENDING_APPROVAL_STATUS,
  PENDING_ISSUANCE_STATUS,
]);

export const toPendingSupplyLine = (row) => ({
  id: row.general_request_item_id,
  generalRequestId: row.general_request_id,
  generalRequestItemId: row.general_request_item_id,
  requestNumber: row.request_number,
  requestedBy: requesterName(row.requester) || "",
  requesterName: requesterName(row.requester) || "",
  reason: row.reason || "",
  justification: row.reason || "",
  itemId: row.item_id,
  itemName: row.item_name || "",
  itemCode: row.item_code || "",
  description: row.description || "",
  quantity: row.quantity,
  quantityRequested: row.quantity,
  quantityRemaining: 0,
  status: statusKey(row.item_status || "pending_supply_request"),
  createdAt: row.created_at,
  kind: "accessories",
});

const toSupplyItem = (row) => ({
  id: row.id,
  generalRequestItemId: row.general_request_item_id,
  itemId: row.item?.id,
  itemName: row.item?.name || "",
  itemCode: row.item?.code || "",
  brand: row.item?.brand || "",
  description: row.item?.description || "",
  storeId: row.store?.id,
  storeName: row.store?.name || row.store?.code || "",
  quantityRequested: row.quantity_requested,
});

export const toSupplyRequest = (row) => ({
  id: row.id,
  generalRequestId: row.general_request_id,
  totalQuantityRequested: row.total_quantity_requested,
  requesterName: requesterName(row.requester) || "",
  requestedBy: row.requester?.id,
  status: statusKey(row.status),
  comment: row.comment,
  approvalComment: row.approval_comment,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  items: (row.items || []).map(toSupplyItem),
  queue: PENDING_QUEUE_STATUSES.has(statusKey(row.status)) ? "pending" : "history",
});

export const toRequisitionFromSupplyRequest = (request) => {
  if (!request) return null;
  const items = request.items || [];
  const first = items[0] || {};
  return {
    ...request,
    requestNumber: `Supply #${request.id}`,
    itemId: first.itemId,
    itemCode: first.itemCode,
    itemName:
      items.length > 1
        ? items.map((item) => item.itemName).filter(Boolean).join(", ")
        : first.itemName,
    description: first.description,
    quantity: request.totalQuantityRequested,
    quantityRequested: request.totalQuantityRequested,
    requestedBy: request.requesterName,
    storeAllocations: items.map((item) => ({
      location: item.storeName || "—",
      quantity: item.quantityRequested,
      quantityIssued: 0,
    })),
  };
};

export const listPendingSupplyLines = async () => {
  try {
    const { data } = await api.get("/supply-requests/pending-general-request");
    return (Array.isArray(data) ? data : []).map(toPendingSupplyLine);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load pending supply requests."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const listSupplyRequests = async () => {
  try {
    const { data } = await api.get("/supply-requests");
    return (Array.isArray(data) ? data : []).map(toSupplyRequest);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load supply requests."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const getSupplyRequest = async (supplyRequestId) => {
  try {
    const { data } = await api.get(`/supply-requests/${supplyRequestId}`);
    return toSupplyRequest(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load supply request."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const createSupplyRequest = async ({ general_request_id, comment, items }) => {
  try {
    const { data } = await api.post("/supply-requests", {
      general_request_id,
      comment: comment?.trim() ? comment.trim() : null,
      items,
    });
    return toSupplyRequest(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to raise supply request."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const approveSupplyRequest = async (supplyRequestId, approvalComment) => {
  try {
    const { data } = await api.post(`/supply-requests/${supplyRequestId}/approve`, {
      approval_comment: approvalComment,
    });
    return toSupplyRequest(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to approve supply request."));
    error.status = err?.response?.status;
    throw error;
  }
};
