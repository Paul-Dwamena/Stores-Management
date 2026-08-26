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

export function isDraftRequest(status) {
  const key = requestStatusKey(status);
  return !key || key === "DRAFT";
}

export function isRejectedRequest(status) {
  return requestStatusKey(status) === "REJECTED";
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
