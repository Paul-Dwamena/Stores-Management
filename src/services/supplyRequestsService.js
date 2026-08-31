import api from "./api";
import { extractApiErrorDetail } from "../utils/apiResponseHelpers";
import { toCatalogId } from "../utils/catalogRefHelpers";

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

const sumQuantityIssued = (items = []) =>
  items.reduce((sum, item) => sum + (Number(item.quantityIssued) || 0), 0);

const summarizeItemNames = (items = []) => {
  const names = [...new Set(items.map((item) => item.itemName).filter(Boolean))];
  if (names.length === 0) return items[0]?.itemName || "";
  if (names.length === 1) return names[0];
  return names.join(", ");
};

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
  supplyRequestItemId: row.id,
  generalRequestItemId: row.general_request_item_id,
  itemId: row.item?.id,
  itemName: row.item?.name || "",
  itemCode: row.item?.code || "",
  brand: row.item?.brand || "",
  description: row.item?.description || "",
  storeId: row.store?.id,
  storeName: row.store?.name || row.store?.code || "",
  storeCode: row.store?.code || "",
  quantityRequested: row.quantity_requested,
  quantityIssued: Number(row.quantity_issued) || 0,
  status: statusKey(row.status),
});

export const toSupplyRequest = (row) => {
  const items = (row.items || []).map(toSupplyItem);
  const totalQuantityRequested = row.total_quantity_requested;
  const quantitySupplied = sumQuantityIssued(items);

  return {
    id: row.id,
    generalRequestId: row.general_request_id,
    totalQuantityRequested,
    requesterName: requesterName(row.requester) || "",
    requestedBy: row.requester?.id,
    status: statusKey(row.status),
    comment: row.comment,
    approvalComment: row.approval_comment,
    rejectionReason: row.rejection_reason || null,
    approvedAt: row.approved_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items,
    quantitySupplied,
    quantityRemaining: Math.max(0, Number(totalQuantityRequested) - quantitySupplied),
    queue: PENDING_QUEUE_STATUSES.has(statusKey(row.status)) ? "pending" : "history",
  };
};

export const toRequisitionFromSupplyRequest = (request) => {
  if (!request) return null;
  const items = request.items || [];
  const first = items[0] || {};
  const totalRequested = request.totalQuantityRequested ?? request.quantityRequested;
  const quantitySupplied =
    request.quantitySupplied != null ? request.quantitySupplied : sumQuantityIssued(items);
  const quantityRemaining =
    request.quantityRemaining != null
      ? request.quantityRemaining
      : Math.max(0, Number(totalRequested) - quantitySupplied);

  return {
    ...request,
    requestNumber: request.requestNumber || `Supply #${request.id}`,
    itemId: first.itemId,
    itemCode: first.itemCode,
    itemName: summarizeItemNames(items),
    description: first.description,
    quantity: totalRequested,
    quantityRequested: totalRequested,
    quantitySupplied,
    quantityRemaining,
    requestedBy: request.requesterName,
    rejectionComment: request.rejectionReason || request.rejectionComment || null,
    approvalDate: request.approvedAt || request.approvalDate || null,
    storeAllocations: items.map((item) => ({
      location: item.storeName || "—",
      storeId: item.storeId,
      supplyRequestItemId: item.supplyRequestItemId ?? item.id,
      quantity: item.quantityRequested,
      quantityIssued: Number(item.quantityIssued) || 0,
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
    if (data && data.id != null) return toSupplyRequest(data);
    return getSupplyRequest(supplyRequestId);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to approve supply request."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const rejectSupplyRequest = async (supplyRequestId, reason) => {
  try {
    const { data } = await api.post(
      `/supply-requests/${supplyRequestId}/reject`,
      null,
      { params: { reason: String(reason || "").trim() || "Rejected" } },
    );
    if (data && data.id != null) return toSupplyRequest(data);
    return getSupplyRequest(supplyRequestId);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to reject supply request."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const rejectPendingIssuance = async (supplyRequestId, reason) => {
  try {
    const { data } = await api.post(
      `/supply-requests/${supplyRequestId}/reject-pending-issuance`,
      null,
      { params: { reason: String(reason || "").trim() || "Rejected" } },
    );
    if (data && data.id != null) return toSupplyRequest(data);
    return getSupplyRequest(supplyRequestId);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to reject pending issuance."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const registerItemForRequest = async (generalRequestItemId, payload) => {
  try {
    const { data } = await api.post(
      `/supply-requests/items/${generalRequestItemId}/register`,
      {
        name: String(payload.name || "").trim(),
        description: payload.description?.trim() || null,
        brand_id: toCatalogId(payload.brand_id ?? payload.brandId ?? payload.brand),
        category_id: toCatalogId(payload.category_id ?? payload.categoryId ?? payload.category),
        unit: payload.unit?.trim() || null,
      },
    );
    return {
      message: data.message,
      itemId: data.item_id,
      generalRequestItemId: data.general_request_item_id,
    };
  } catch (err) {
    const error = new Error(
      extractApiErrorDetail(err, "Unable to register item for this request."),
    );
    error.status = err?.response?.status;
    throw error;
  }
};

export const sendSupplyConfirmationOtp = async (phone) => {
  try {
    const { data } = await api.post("/supply-requests/confirmation/send-otp", {
      phone: String(phone || "").trim(),
    });
    return data;
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to send confirmation OTP."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const verifySupplyConfirmationOtp = async ({ phone, otp }) => {
  try {
    const { data } = await api.post("/supply-requests/confirmation/verify-otp", {
      phone: String(phone || "").trim(),
      otp: String(otp || "").trim(),
    });
    return data;
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to verify confirmation OTP."));
    error.status = err?.response?.status;
    throw error;
  }
};
