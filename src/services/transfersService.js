import api from "./api";
import { extractApiErrorDetail } from "../utils/apiResponseHelpers";
import {
  TRANSFER_STATUS,
  transferStatusKey,
} from "../pages/stores/transfers/utils/transferStatus";

const personName = (person) =>
  [person?.first_name, person?.last_name].filter(Boolean).join(" ").trim();

const toStatusHistory = (row) => {
  const rawChangedBy = row.changed_by;
  const nestedUser =
    row.changed_by_user
    || row.changer
    || (rawChangedBy && typeof rawChangedBy === "object" ? rawChangedBy : null);

  return {
    id: row.id,
    fromStatus: row.from_status ? transferStatusKey(row.from_status) : null,
    toStatus: transferStatusKey(row.to_status),
    changedBy:
      nestedUser?.id
      ?? (typeof rawChangedBy === "number" || typeof rawChangedBy === "string"
        ? rawChangedBy
        : null),
    changedByName:
      (nestedUser ? personName(nestedUser) || nestedUser.email : "")
      || row.changed_by_name
      || "",
    comment: row.comment || "",
    createdAt: row.created_at,
  };
};

const sortStatusHistory = (entries = []) =>
  [...entries].sort(
    (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
  );

const latestHistoryComment = (entries = [], status) => {
  const match = [...entries]
    .filter((entry) => entry.toStatus === status && entry.comment)
    .sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    );
  return match[0]?.comment || "";
};

const toTransferLine = (row, fromStore = "") => ({
  id: row.id,
  itemId: row.item_id,
  itemCode: row.item?.code || "",
  itemName: row.item?.name || "",
  description: row.item?.name || "",
  quantityRequested: row.quantity,
  quantityApproved: row.quantity_reserved,
  fromStore,
  toStoreId: row.to_store_id,
  toStore: row.to_store?.name || "",
  movingQuantity: row.quantity,
});

const summarizeLines = (lines = []) => {
  const firstLine = lines[0];
  const uniqueToStores = [...new Set(lines.map((line) => line.toStore).filter(Boolean))];

  return {
    itemCode: firstLine?.itemCode || "",
    itemName: firstLine?.itemName || "",
    quantity: lines.reduce(
      (sum, line) => sum + (Number(line.quantityRequested ?? line.movingQuantity) || 0),
      0,
    ),
    itemCount: lines.length,
    toStore: uniqueToStores.length === 1 ? uniqueToStores[0] : "Multiple stores",
    toStoreLabel:
      uniqueToStores.length === 1
        ? uniqueToStores[0]
        : uniqueToStores.length > 1
          ? `${uniqueToStores.length} stores`
          : "",
  };
};

const toTransferItemDetail = (row) => ({
  id: row.id,
  itemId: row.item_id,
  itemCode: row.item_code || "",
  itemName: row.item_name || "",
  description: row.item_description || "",
  quantityRequested: row.quantity_requested,
  quantityApproved: row.quantity_approved,
  supplyingStoreId: row.supplying_store_id,
  supplyingStoreName: row.supplying_store_name,
  requestedAt: row.requested_at,
  approvedAt: row.approved_at,
});

export const toTransfer = (row) => {
  const fromStore = row.from_store?.name || "";
  const lines = (row.items || []).map((item) => toTransferLine(item, fromStore));
  const summary = summarizeLines(lines);
  const statusHistory = sortStatusHistory((row.status_history || []).map(toStatusHistory));

  return {
    id: row.id,
    transferNumber: `TR-${String(row.id).padStart(4, "0")}`,
    fromStoreId: row.from_store?.id,
    fromStore: row.from_store?.name || "",
    status: transferStatusKey(row.status),
    notes: row.notes || "",
    requestedBy: personName(row.creator),
    requestedById: row.creator?.id,
    dispatcher: personName(row.dispatcher),
    dispatcherId: row.dispatcher?.id,
    dispatcherEmail: row.dispatcher?.email || "",
    dispatcherPhone: row.dispatcher?.phone || "",
    receiver: personName(row.receiver),
    receiverId: row.receiver?.id,
    receiverEmail: row.receiver?.email || "",
    receiverPhone: row.receiver?.phone || "",
    canceller: personName(row.canceller),
    cancellerId: row.canceller?.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    statusHistory,
    rejectionReason: latestHistoryComment(statusHistory, TRANSFER_STATUS.REJECTED),
    cancelReason: latestHistoryComment(statusHistory, TRANSFER_STATUS.CANCELLED),
    lines,
    ...summary,
  };
};

const mergeItemDetails = (transfer, itemDetails = []) => {
  if (!Array.isArray(itemDetails) || itemDetails.length === 0) return transfer;

  const detailByItemId = new Map(itemDetails.map((row) => [row.item_id, row]));
  const mergedLines = transfer.lines.map((line) => {
    const detail = detailByItemId.get(line.itemId);
    if (!detail) return line;
    return {
      ...line,
      itemCode: detail.item_code || line.itemCode,
      itemName: detail.item_name || line.itemName,
      description: detail.item_description || line.description,
      quantityRequested: detail.quantity_requested ?? line.quantityRequested,
      quantityApproved: detail.quantity_approved ?? line.quantityApproved,
      fromStore: detail.supplying_store_name || line.fromStore,
      requestedAt: detail.requested_at,
      approvedAt: detail.approved_at,
    };
  });

  return {
    ...transfer,
    ...summarizeLines(mergedLines),
    lines: mergedLines,
    approvedAt: itemDetails.find((row) => row.approved_at)?.approved_at || null,
  };
};

export const listTransfers = async () => {
  try {
    const { data } = await api.get("/transfers");
    return (Array.isArray(data) ? data : []).map(toTransfer);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load transfers."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const getTransfer = async (transferId) => {
  try {
    const [{ data }, itemsResult] = await Promise.all([
      api.get(`/transfers/${transferId}`),
      api.get(`/transfers/${transferId}/items`).catch(() => null),
    ]);
    const transfer = toTransfer(data);
    return mergeItemDetails(transfer, itemsResult?.data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load transfer."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const createTransfer = async ({ fromStoreId, dispatcherId, notes, lines }) => {
  try {
    await api.post("/transfers", {
      from_store_id: Number(fromStoreId),
      dispatched_by: Number(dispatcherId),
      notes: notes?.trim() || null,
      items: (lines || []).map((line) => ({
        item_id: Number(line.itemId),
        quantity: Number(line.movingQuantity),
        to_store_id: Number(line.toStoreId),
      })),
    });
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to create transfer."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const approveTransfer = async (transferId, { approvalComment } = {}) => {
  try {
    const body = {};
    const comment = String(approvalComment || "").trim();
    if (comment) body.approval_comment = comment;
    await api.post(`/transfers/${transferId}/approve`, body);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to approve transfer."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const cancelTransfer = async (transferId, { reason }) => {
  try {
    await api.post(`/transfers/${transferId}/cancel`, {
      reason: String(reason || "").trim(),
    });
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to cancel transfer."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const rejectTransferDispatch = async (transferId, { reason }) => {
  try {
    await api.post(`/transfers/${transferId}/reject-dispatch`, {
      reason: String(reason || "").trim(),
    });
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to reject transfer."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const dispatchTransfer = async (transferId) => {
  try {
    await api.post(`/transfers/${transferId}/dispatch`);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to dispatch transfer."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const holdTransfer = async (transferId) => {
  try {
    await api.post(`/transfers/${transferId}/hold`);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to mark transfer as arrived."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const acceptTransfer = async (transferId) => {
  try {
    await api.post(`/transfers/${transferId}/accept`);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to receive transfer."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const sendDispatcherConfirmationOtp = async (phone) => {
  try {
    const { data } = await api.post("/supply-requests/confirmation/send-otp", {
      phone: String(phone || "").trim(),
    });
    return data;
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to send dispatcher OTP."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const verifyDispatcherConfirmationOtp = async ({ phone, otp }) => {
  try {
    const { data } = await api.post("/supply-requests/confirmation/verify-otp", {
      phone: String(phone || "").trim(),
      otp: String(otp || "").trim(),
    });
    return data;
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to verify dispatcher OTP."));
    error.status = err?.response?.status;
    throw error;
  }
};
