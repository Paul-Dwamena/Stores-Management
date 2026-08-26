import api from "./api";
import { extractApiErrorDetail } from "../utils/apiResponseHelpers";

const requesterName = (requester) =>
  [requester?.first_name, requester?.last_name].filter(Boolean).join(" ").trim();

const toLine = (row) => ({
  id: row.id,
  itemId: row.item_id,
  name: row.name || row.item?.name || "",
  description: row.description || "",
  quantity: row.quantity,
  status: row.status || "",
  itemCode: row.item?.code || "",
  brand: row.item?.brand || "",
});

const toStatusHistory = (row) => ({
  id: row.id,
  status: row.status,
  changedBy: row.changed_by,
  comment: row.comment,
  createdAt: row.created_at,
});

const toRequest = (row) => ({
  id: row.id,
  requestNumber: row.request_number,
  requestedBy: row.requested_by,
  requesterName: requesterName(row.requester) || "",
  reason: row.reason,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  items: (row.items || []).map(toLine),
  statusHistory: (row.status_history || []).map(toStatusHistory),
});

const toItemPayload = (item) => {
  const itemId = item.item_id == null || item.item_id === "" ? null : Number(item.item_id);
  const quantity = Number(item.quantity);
  if (Number.isFinite(itemId)) {
    return { item_id: itemId, quantity };
  }
  const payload = { quantity };
  const name = item.name?.trim();
  const description = item.description?.trim();
  if (name) payload.name = name;
  if (description) payload.description = description;
  return payload;
};

const toWriteBody = ({ reason, items }) => ({
  reason: reason?.trim() ? reason.trim() : null,
  items: items.map(toItemPayload),
});

export const listGeneralRequests = async () => {
  try {
    const { data } = await api.get("/general-requests");
    return (Array.isArray(data) ? data : []).map(toRequest);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load requests."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const getGeneralRequest = async (requestId) => {
  try {
    const { data } = await api.get(`/general-requests/${requestId}`);
    return toRequest(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load request."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const createGeneralRequest = async (payload) => {
  try {
    const { data } = await api.post("/general-requests", toWriteBody(payload));
    return toRequest(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to create request."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const updateGeneralRequest = async (requestId, payload) => {
  try {
    const { data } = await api.put(`/general-requests/${requestId}`, toWriteBody(payload));
    return toRequest(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to update request."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const deleteGeneralRequest = async (requestId) => {
  try {
    await api.delete(`/general-requests/${requestId}`);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to delete request."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const rejectGeneralRequest = async (requestId) => {
  try {
    const { data } = await api.post(`/general-requests/${requestId}/reject`);
    return toRequest(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to reject request."));
    error.status = err?.response?.status;
    throw error;
  }
};
