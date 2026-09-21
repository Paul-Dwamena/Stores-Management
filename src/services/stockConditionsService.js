import api from "./api";
import { extractApiErrorDetail, parsePaginatedList } from "../utils/apiResponseHelpers";
import { getItemStoreStock } from "./inventoryService";
import { listUsers } from "./usersService";

export const STOCK_CONDITION_OPTIONS = [
  { value: "GOOD", label: "Good" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "EXPIRED", label: "Expired" },
  { value: "DEFECTIVE", label: "Defective" },
  { value: "UNUSABLE", label: "Unusable" },
];

export const STOCK_CONDITION_REASON_OPTIONS = [
  { value: "DAMAGE", label: "Damage" },
  { value: "EXPIRY", label: "Expiry" },
  { value: "DEFECT", label: "Defect" },
  { value: "CONTAMINATION", label: "Contamination" },
  { value: "QUALITY_ISSUE", label: "Quality issue" },
  { value: "OTHER", label: "Other" },
];

const personName = (person) =>
  [person?.first_name, person?.last_name].filter(Boolean).join(" ").trim();

export function formatStockCondition(value) {
  if (!value) return "";
  const match = STOCK_CONDITION_OPTIONS.find((option) => option.value === value);
  return match?.label || String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatStockConditionReason(value) {
  if (!value) return "";
  const match = STOCK_CONDITION_REASON_OPTIONS.find((option) => option.value === value);
  return match?.label || String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export const toStockItemCondition = (row = {}) => ({
  id: row.id,
  storeItemId: row.store_item_id ?? null,
  condition: row.condition || "",
  quantity: row.quantity ?? 0,
  changedBy: row.changed_by ?? null,
  createdAt: row.created_at || null,
});

export const toStockConditionChange = (row = {}, storeName = "") => {
  const rawChangedBy = row.changed_by;
  const nestedUser =
    row.changed_by_user
    || row.changer
    || (rawChangedBy && typeof rawChangedBy === "object" ? rawChangedBy : null);
  const changedById =
    nestedUser?.id
    ?? (typeof rawChangedBy === "number" || typeof rawChangedBy === "string"
      ? rawChangedBy
      : null);
  const changedByName =
    (nestedUser ? personName(nestedUser) || nestedUser.email || nestedUser.name : "")
    || row.changed_by_name
    || "";

  return {
    id: row.id,
    itemId: row.item_id ?? null,
    storeId: row.store_id ?? null,
    storeName: storeName || "",
    quantity: row.quantity ?? 0,
    previousCondition: row.previous_condition || "",
    newCondition: row.new_condition || "",
    reason: row.reason || "",
    changedById,
    changedBy: changedByName || changedById,
    createdAt: row.created_at || null,
  };
};

const withResolvedChangedByNames = async (rows) => {
  const needsLookup = rows.some(
    (row) => row.changedById != null && String(row.changedBy) === String(row.changedById),
  );
  if (!needsLookup) return rows;

  try {
    const users = await listUsers();
    const byId = new Map(users.map((user) => [Number(user.id), user.name]));
    return rows.map((row) => {
      if (row.changedById == null) return row;
      if (String(row.changedBy) !== String(row.changedById)) return row;
      const name = byId.get(Number(row.changedById));
      return name ? { ...row, changedBy: name } : row;
    });
  } catch {
    return rows;
  }
};

/** GET /stock-conditions/store-items/{storeItemId} */
export const getStoreItemConditions = async (storeItemId) => {
  if (storeItemId == null || storeItemId === "") {
    const error = new Error("Missing store item id for condition lookup.");
    error.status = 400;
    throw error;
  }
  try {
    const { data } = await api.get(`/stock-conditions/store-items/${storeItemId}`);
    return parsePaginatedList(data).map(toStockItemCondition);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load stock conditions."));
    error.status = err?.response?.status;
    throw error;
  }
};

/** GET /stock-conditions/stores/{storeId}/items/{itemId}/history */
export const listStoreItemConditionHistory = async (storeId, itemId) => {
  try {
    const { data } = await api.get(
      `/stock-conditions/stores/${storeId}/items/${itemId}/history`,
    );
    return parsePaginatedList(data).map((row) => toStockConditionChange(row));
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load condition history."));
    error.status = err?.response?.status;
    throw error;
  }
};

/**
 * Load condition-change history for an item across all stores it appears in.
 * History API is per store+item, so we fan out from store stock.
 */
export const listItemConditionHistory = async (itemId) => {
  const { stores } = await getItemStoreStock(itemId);
  if (!stores.length) return [];

  const batches = await Promise.all(
    stores.map(async (store) => {
      try {
        const rows = await listStoreItemConditionHistory(store.id, itemId);
        return rows.map((row) => ({
          ...row,
          storeId: row.storeId ?? store.id,
          storeName: store.name || row.storeName || "",
        }));
      } catch {
        return [];
      }
    }),
  );

  const sorted = batches
    .flat()
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

  return withResolvedChangedByNames(sorted);
};

/** POST /stock-conditions/change */
export const changeStockCondition = async ({
  storeId,
  itemId,
  quantity,
  previousCondition,
  newCondition,
  reason,
}) => {
  try {
    const { data } = await api.post("/stock-conditions/change", {
      store_id: Number(storeId),
      item_id: Number(itemId),
      quantity: Number(quantity),
      previous_condition: previousCondition,
      new_condition: newCondition,
      reason,
    });
    const mapped = toStockConditionChange(data);
    const [resolved] = await withResolvedChangedByNames([mapped]);
    return resolved;
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to change stock condition."));
    error.status = err?.response?.status;
    throw error;
  }
};
