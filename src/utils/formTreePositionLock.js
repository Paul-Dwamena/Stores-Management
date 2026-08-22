/**
 * Fields whose value unlocks or fills later fields must stay at the top of
 * their sibling list (e.g. Driver + Date on start/end trip, Vehicle on inspection).
 */

export const POSITION_LOCKED_REORDER_MESSAGE =
  "This field’s position is locked because later fields depend on it.";

/** Catalog keys that gate other fields across forms. */
export const POSITION_LOCKED_FIELD_KEYS = new Set([
  "vehicleId",
  "driverId",
  "requestType",
  "make",
]);

/** Trip date fields share the generic `date` key, so lock them by id. */
export const POSITION_LOCKED_FIELD_IDS = new Set([
  "tf_start_driver",
  "tf_start_date",
  "tf_end_driver",
  "tf_end_date",
]);

export function isPositionLockedFormNode(node) {
  if (!node || node.isLocked) return false;
  if (node.isPositionLocked === true) return true;
  if (node.id && POSITION_LOCKED_FIELD_IDS.has(node.id)) return true;
  const isTripField =
    typeof node.id === "string"
    && (node.id.startsWith("tf_start_") || node.id.startsWith("tf_end_"));
  if (isTripField) return false;
  if (node.key && POSITION_LOCKED_FIELD_KEYS.has(node.key)) return true;
  return false;
}

export function canReorderFormNode(node) {
  if (!node) return false;
  if (node.isLocked) return false;
  if (isPositionLockedFormNode(node)) return false;
  return true;
}

export function getPositionLockedPrefixCount(siblings = []) {
  let count = 0;
  for (const node of siblings) {
    if (isPositionLockedFormNode(node)) count += 1;
    else break;
  }
  return count;
}

export function getFormNodeReorderTitle(node, dragEnabled) {
  if (!dragEnabled) return "Clear search to reorder by drag";
  if (node?.isLocked) return "This section cannot be reordered";
  if (isPositionLockedFormNode(node)) return POSITION_LOCKED_REORDER_MESSAGE;
  return "Drag to reorder";
}
