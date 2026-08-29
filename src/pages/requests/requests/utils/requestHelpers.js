export function requestStatusKey(status) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function formatRequestStatus(status) {
  const key = requestStatusKey(status);
  if (!key) return "—";
  return key
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function isRejectedRequest(status) {
  return requestStatusKey(status) === "REJECTED";
}

export function isSuppliedRequest(status) {
  const key = requestStatusKey(status);
  return key === "SUPPLIED" || key === "PARTIALLY_SUPPLIED" || key === "PARTIAL_SUPPLIED";
}

export function isOpenRequest(status) {
  const key = requestStatusKey(status);
  if (!key || key === "DRAFT") return false;
  return !isRejectedRequest(status) && !isSuppliedRequest(status);
}

/** Build ordered status chain from history, e.g. [pending…, pending…, rejected]. */
export function buildStatusChangeChain(statusHistory = [], currentStatus = null) {
  const history = [...(statusHistory || [])].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return aTime - bTime;
  });

  const chain = [];
  const pushUnique = (status) => {
    const key = requestStatusKey(status);
    if (!key) return;
    if (chain.length && requestStatusKey(chain[chain.length - 1]) === key) return;
    chain.push(status);
  };

  history.forEach((entry) => {
    if (!chain.length) pushUnique(entry.fromStatus);
    pushUnique(entry.toStatus || entry.status);
  });

  if (!chain.length && currentStatus) pushUnique(currentStatus);
  return chain;
}

export function summarizeItems(items = []) {
  if (!items.length) return "No items";
  const first = items[0];
  const name = first.name || "Item";
  const qty = first.quantity != null ? ` × ${first.quantity}` : "";
  if (items.length === 1) return `${name}${qty}`;
  return `${name}${qty} + ${items.length - 1} more`;
}

export function isPositiveInt(value) {
  const quantity = Number(value);
  return value !== "" && Number.isInteger(quantity) && quantity > 0;
}

export function toGeneralRequestWriteBody(reason, lines = []) {
  return {
    reason,
    items: lines.map((line) =>
      line.source === "catalog"
        ? { item_id: line.accessoryId, quantity: line.quantity }
        : { name: line.name, description: line.description, quantity: line.quantity },
    ),
  };
}

export const UNREGISTERED_ITEM_DESCRIPTION_HELPER =
  "Give a thorough description so this item can be registered later. Include unit (e.g. carton, box), brand if known, size, model, specifications, and any other details that identify what is needed.";

export const UNREGISTERED_ITEM_DESCRIPTION_PLACEHOLDER =
  "Unit (carton or box), brand if known, size, model, specifications, and intended use…";
