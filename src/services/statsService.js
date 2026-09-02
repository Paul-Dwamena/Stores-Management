import api from "./api";
import { extractApiErrorDetail, formatStatusLabel } from "../utils/apiResponseHelpers";

const toGeneralStats = (row = {}) => ({
  numberOfItems: Number(row.number_of_items) || 0,
  lowOutOfStock: Number(row.low_out_of_stock) || 0,
  openSupplies: Number(row.open_supplies) || 0,
  openTransfers: Number(row.open_transfers) || 0,
  itemCategories: Number(row.item_categories) || 0,
  categoriesInStock: Number(row.categories_in_stock) || 0,
  itemsInStock: Number(row.items_in_stock) || 0,
  unitsReceived: Number(row.units_received) || 0,
  unitsSupplied: Number(row.units_supplied) || 0,
  unitsInStock: Number(row.units_in_stock) || 0,
  storeTransfers: Number(row.store_transfers) || 0,
});

const toStockByStore = (row = {}) => ({
  storeId: row.store_id,
  label: row.store_name || "Unassigned",
  value: Number(row.total_quantity) || 0,
  skuCount: Number(row.sku_count) || 0,
});

const toCategoriesInStockByStore = (row = {}) => ({
  storeId: row.store_id,
  label: row.store_name || "Unassigned",
  value: Number(row.categories_in_stock) || 0,
});

const toReceivedSuppliedByStore = (row = {}) => ({
  storeId: row.store_id,
  label: row.store_name || "Unassigned",
  unitsReceived: Number(row.units_received) || 0,
  unitsSupplied: Number(row.units_supplied) || 0,
});

const statusKey = (status) =>
  String(status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

const statusLabel = (status) => formatStatusLabel(statusKey(status)) || "Unknown";

const toSupplyStatus = (row = {}) => {
  const key = statusKey(row.status);
  return {
    status: key,
    label: statusLabel(key),
    value: Number(row.count) || 0,
  };
};

const mergeSupplyStatus = (rows = []) => {
  const totals = new Map();
  rows.forEach((row) => {
    const mapped = toSupplyStatus(row);
    if (!mapped.status) return;
    const current = totals.get(mapped.status);
    if (current) {
      current.value += mapped.value;
      return;
    }
    totals.set(mapped.status, mapped);
  });
  return [...totals.values()].sort((a, b) => b.value - a.value);
};

const toLowStockItem = (row = {}) => ({
  id: row.item_id,
  name: row.item_name || "",
  quantity: Number(row.quantity) || 0,
  status: String(row.status || "").toUpperCase(),
  itemCode: row.item_code || "",
  minStock: row.min_stock ?? null,
});

export const getDashboardStats = async ({ dateFrom, dateTo, storeId } = {}) => {
  try {
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (storeId !== undefined && storeId !== null && storeId !== "" && storeId !== "ALL") {
      params.store_id = Number(storeId);
    }

    const { data } = await api.get("/stats/dashboard", { params });
    return {
      general: toGeneralStats(data?.general),
      stockByStore: (data?.stock_by_store || []).map(toStockByStore),
      categoriesInStockByStore: (data?.categories_in_stock_by_store || []).map(
        toCategoriesInStockByStore,
      ),
      receivedSuppliedByStore: (data?.received_supplied_by_store || []).map(
        toReceivedSuppliedByStore,
      ),
      supplyStatus: mergeSupplyStatus(data?.supply_status),
      lowStockItems: (data?.low_stock_items || []).map(toLowStockItem),
    };
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load dashboard stats."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const getStoresGeneralStats = async () => {
  try {
    const { data } = await api.get("/stats/stores-general-stats");
    return toGeneralStats(data?.general);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load store stats."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const getInventoryStats = async () => {
  try {
    const { data } = await api.get("/stats/inventory-stats");
    const inventory = data?.inventory || {};
    return {
      totalQuantity: Number(inventory.total_quantity) || 0,
      purchaseValue: inventory.purchase_value ?? "0",
      attentionNeeded: Number(inventory.attention_needed) || 0,
      totalItems: Number(inventory.total_items) || 0,
    };
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load inventory stats."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const getSuppliesStats = async () => {
  try {
    const { data } = await api.get("/stats/supplies-stats");
    const supplies = data?.supplies || {};
    return {
      generalRequests: Number(supplies.general_requests) || 0,
      pending: Number(supplies.pending) || 0,
      supplied: Number(supplies.supplied) || 0,
      rejected: Number(supplies.rejected) || 0,
    };
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load supplies stats."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const getRequestMenuStats = async () => {
  try {
    const { data } = await api.get("/stats/request-menu");
    return mergeSupplyStatus(data?.request_status);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load request stats."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const getTransfersStats = async () => {
  try {
    const { data } = await api.get("/stats/transfers-stats");
    const transfers = data?.transfers || {};
    return {
      totalTransfers: Number(transfers.total_transfers) || 0,
      open: Number(transfers.open) || 0,
      completed: Number(transfers.completed) || 0,
      rejected: Number(transfers.rejected) || 0,
    };
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load transfer stats."));
    error.status = err?.response?.status;
    throw error;
  }
};
