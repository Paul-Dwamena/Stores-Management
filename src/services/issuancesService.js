import api from "./api";
import { extractApiErrorDetail } from "../utils/apiResponseHelpers";

const personName = (person) =>
  [person?.first_name, person?.last_name].filter(Boolean).join(" ").trim();

const toIssuanceItem = (row) => ({
  id: row.id,
  itemName: row.item_name || "",
  itemCode: row.item_code || "",
  storeName: row.store_name || "",
  quantityIssued: row.quantity_issued,
});

export const toIssuance = (row) => ({
  id: row.id,
  supplyRequestId: row.supply_request_id,
  issuerName: personName(row.issuer) || "",
  issuerEmail: row.issuer?.email || "",
  receiverName: personName(row.receiver) || "",
  comment: row.comment || "",
  createdAt: row.created_at,
  generalRequestId: row.supply_request?.general_request_id,
  supplyRequestStatus: row.supply_request?.status || "",
  items: (row.items || []).map(toIssuanceItem),
});

export const createIssuance = async ({
  supply_request_id,
  supply_request_item_id,
  store_id,
  quantity_issued,
  comment,
  reciever_id,
}) => {
  try {
    const { data } = await api.post("/issuances", {
      supply_request_id: Number(supply_request_id),
      supply_request_item_id: Number(supply_request_item_id),
      store_id: Number(store_id),
      quantity_issued: Number(quantity_issued),
      comment: comment?.trim() ? comment.trim() : null,
      reciever_id: Number(reciever_id),
    });
    return toIssuance(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to create issuance."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const listIssuancesByGeneralRequest = async (generalRequestId) => {
  try {
    const { data } = await api.get(`/issuances/general-request/${generalRequestId}`);
    return (Array.isArray(data) ? data : []).map(toIssuance);
  } catch (err) {
    const error = new Error(
      extractApiErrorDetail(err, "Unable to load issuances for this request."),
    );
    error.status = err?.response?.status;
    throw error;
  }
};
