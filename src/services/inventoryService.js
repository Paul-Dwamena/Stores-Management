import api from "./api";
import { extractApiErrorDetail, parsePaginatedList } from "../utils/apiResponseHelpers";
import { formatMoneyGhs } from "../utils/displayFormatters";
import { catalogDisplayName, normalizeCatalogRef, toCatalogId } from "../utils/catalogRefHelpers";

const toStoreStock = (store) => ({
  id: store.store_id,
  name: store.store_name,
  quantity: store.quantity,
  shelfPosition: store.shelf_position || "",
  shelf: store.shelf || "",
  position: store.position || "",
});

const inventoryStatus = (row) => {
  if (row.is_active === false) return "INACTIVE";
  if (Number(row.total_quantity) <= 0) return "OUT_OF_STOCK";
  return "IN_STOCK";
};

export const toInventoryItem = (row) => {
  const brand = normalizeCatalogRef(row.brand, row.brand_id);
  const category = normalizeCatalogRef(row.category, row.category_id);

  return {
    id: row.id,
    name: row.name || "",
    itemCode: row.item_code || row.code || "",
    brandId: brand.id,
    brand: brand.name,
    categoryId: category.id,
    category: category.name,
    description: row.description || "",
    photo: row.image_url || row.photo_url || "",
    unit: row.unit || "",
    isActive: row.is_active !== false,
    quantity: row.total_quantity,
    totalQuantity: row.total_quantity,
    stores: (row.stores || []).map(toStoreStock),
    status: inventoryStatus(row),
  };
};

const toDeliveredByPayload = (payload = {}) => ({
  full_name: String(payload.deliveredByName || payload.full_name || "").trim(),
  phone: String(payload.deliveredByPhone || payload.phone || "").trim(),
  email: String(payload.deliveredByEmail || payload.email || "").trim(),
});

export const toStockReceipt = (row = {}) => {
  const unitPriceRaw = row.unit_price;
  const unitPrice =
    unitPriceRaw == null || unitPriceRaw === ""
      ? null
      : Number(unitPriceRaw);

  return {
    id: row.id,
    itemId: row.item_id ?? row.item?.id ?? null,
    itemCode: row.item?.code || "",
    itemName: row.item?.name || "",
    itemBrand: catalogDisplayName(row.item?.brand) || "",
    supplierId: row.supplier_id ?? row.supplier?.id ?? null,
    supplierName: row.supplier?.name || "",
    supplierPhone: row.supplier?.phone || "",
    supplierEmail: row.supplier?.email || "",
    storeId: row.store_id ?? row.store?.id ?? null,
    storeName: row.store?.name || "",
    storeCode: row.store?.code || "",
    condition: row.condition || "",
    quantity: row.quantity ?? 0,
    unitPrice: Number.isFinite(unitPrice) ? unitPrice : null,
    receivedAt: row.received_at || null,
    waybillNumber: row.waybill_number || "",
    notes: row.notes || "",
    deliveredByName: row.delivered_by_full_name || "",
    deliveredByPhone: row.delivered_by_phone || "",
    deliveredByEmail: row.delivered_by_email || "",
    receivedBy: row.reciever
      ? `${row.reciever.first_name || ""} ${row.reciever.last_name || ""}`.trim()
      : "",
  };
};

/** Maps UI receive payload → StockCreate body. */
export const toStockPayload = (payload = {}) => {
  const body = {
    supplier_id: Number(payload.supplier_id ?? payload.supplierId),
    store_id: Number(payload.store_id ?? payload.location ?? payload.storeId),
    condition: payload.condition,
    quantity: Number(payload.quantity),
    unit_price: Number(payload.unit_price ?? payload.unitCost ?? payload.unitPrice),
    delivered_by: toDeliveredByPayload(payload),
  };
  const waybill = String(payload.waybill_number ?? payload.waybillNumber ?? "").trim();
  if (waybill) body.waybill_number = waybill;
  const notes = String(payload.notes ?? "").trim();
  if (notes) body.notes = notes;
  return body;
};

/** Maps shared + lines → BulkStockCreate body. */
export const toBulkStockPayload = ({ shared = {}, lines = [], mode = "existing" } = {}) => {
  const stocks = lines.map((line) => {
    const item = {
      store_id: Number(line.location || line.store_id || line.storeId),
      condition: line.condition || shared.condition,
      quantity: Number(line.quantity),
      unit_price: Number(line.unitCost ?? line.unit_price ?? line.unitPrice),
    };
    if (mode === "existing" || line.itemId) {
      item.item_id = Number(line.itemId || line.item_id);
    } else {
      const name = line.name?.trim();
      const brandId = toCatalogId(line.brand ?? line.brandId);
      const categoryId = toCatalogId(line.category ?? line.categoryId);
      const description = line.description?.trim();
      const unit = line.unit?.trim();
      if (name) item.name = name;
      if (brandId != null) item.brand = brandId;
      if (categoryId != null) item.category = categoryId;
      if (description) item.description = description;
      if (unit) item.unit = unit;
    }
    return item;
  });

  const body = {
    supplier_id: Number(shared.supplierId ?? shared.supplier_id),
    delivered_by: toDeliveredByPayload(shared),
    stocks,
  };
  const waybill = String(shared.waybillNumber ?? shared.waybill_number ?? "").trim();
  if (waybill) body.waybill_number = waybill;
  const notes = String(shared.notes ?? "").trim();
  if (notes) body.notes = notes;
  return body;
};

export const listInventoryItems = async () => {
  try {
    const { data } = await api.get("/inventory/items");
    return (Array.isArray(data) ? data : []).map(toInventoryItem);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load inventory."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const getInventoryItem = async (itemId) => {
  try {
    const { data } = await api.get(`/inventory/items/${itemId}`);
    return toInventoryItem(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load inventory item."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const stockItem = async (itemId, payload) => {
  try {
    const { data } = await api.post(`/inventory/items/${itemId}/stock`, toStockPayload(payload));
    return data;
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to receive stock."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const stockItemsBulk = async (payload) => {
  try {
    const body = Array.isArray(payload)
      ? { stocks: payload }
      : toBulkStockPayload(payload);
    const { data } = await api.post("/inventory/stock", body);
    return data;
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to receive stock."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const listItemReceipts = async (itemId) => {
  try {
    const { data } = await api.get(`/inventory/items/${itemId}/receipts`);
    return parsePaginatedList(data).map(toStockReceipt);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load receipts."));
    error.status = err?.response?.status;
    throw error;
  }
};

const personName = (person) =>
  [person?.first_name, person?.last_name].filter(Boolean).join(" ").trim();

export const toItemSupply = (row = {}) => ({
  id: [
    row.item_id,
    row.store_id,
    row.date_supplied || row.date_requested || "",
    row.quantity_supplied,
    row.status,
  ].join("-"),
  itemId: row.item_id ?? null,
  itemCode: row.item_code || "",
  name: row.item_name || "",
  brand: row.brand || "",
  description: row.description || "",
  quantity: row.quantity_supplied,
  quantityRequested: row.quantity_requested,
  quantitySupplied: row.quantity_supplied,
  status: row.status || "",
  dateRequested: row.date_requested || null,
  dateSupplied: row.date_supplied || null,
  approvedAt: row.approved_at || null,
  storeId: row.store_id ?? null,
  location: row.store_name || "",
  shelfPosition: row.shelf_position || "",
  receivedBy: personName(row.received_by) || "",
  suppliedBy: personName(row.supplied_by) || "",
  requestedBy: personName(row.received_by) || "",
});

export const listItemSupplies = async (itemId) => {
  try {
    const { data } = await api.get(`/inventory/items/${itemId}/supplies`);
    return parsePaginatedList(data).map(toItemSupply);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load supplies."));
    error.status = err?.response?.status;
    throw error;
  }
};

/** GET /items/items/{id}/stores — qty + shelf/position per store for one item. */
export const getItemStoreStock = async (itemId) => {
  try {
    const { data } = await api.get(`/items/items/${itemId}/stores`);
    return {
      totalQuantity: data?.total_quantity ?? 0,
      stores: (data?.stores || []).map((store) => ({
        id: store.store_id,
        name: store.store_name || "",
        quantity: store.quantity ?? 0,
        shelf: store.shelf || "",
        position: store.position || "",
        shelfPosition: [store.shelf, store.position].filter(Boolean).join(" / "),
      })),
    };
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load store stock."));
    error.status = err?.response?.status;
    throw error;
  }
};

/** GET /stores/{storeId}/items/{itemId}/location */
export const getStoreItemLocation = async (storeId, itemId) => {
  try {
    const { data } = await api.get(`/stores/${storeId}/items/${itemId}/location`);
    return {
      id: data.id,
      storeId: data.store_id,
      itemId: data.item_id,
      shelf: data.shelf || "",
      position: data.position || "",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load item location."));
    error.status = err?.response?.status;
    throw error;
  }
};

/** PUT /stores/{storeId}/items/{itemId}/location */
export const updateStoreItemLocation = async (storeId, itemId, { shelf, position }) => {
  try {
    const { data } = await api.put(`/stores/${storeId}/items/${itemId}/location`, {
      shelf: shelf?.trim() ? shelf.trim() : null,
      position: position?.trim() ? position.trim() : null,
    });
    return {
      id: data.id,
      storeId: data.store_id,
      itemId: data.item_id,
      shelf: data.shelf || "",
      position: data.position || "",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to update item location."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const OTP_TYPE = {
  STOCK_DELIVERY: "STOCK_DELIVERY",
};

export const sendDeliveryOtp = async (phone, otpType = OTP_TYPE.STOCK_DELIVERY) => {
  try {
    const { data } = await api.post("/inventory/stock/delivery/send-otp", {
      phone: String(phone || "").trim(),
      otp_type: String(otpType || "").trim(),
    });
    return data;
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to send delivery OTP."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const verifyDeliveryOtp = async ({ phone, otp }) => {
  try {
    const { data } = await api.post("/inventory/stock/delivery/verify-otp", {
      phone: String(phone || "").trim(),
      otp: String(otp || "").trim(),
    });
    return data;
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to verify delivery OTP."));
    error.status = err?.response?.status;
    throw error;
  }
};

export function formatInventoryMoney(amount) {
  return formatMoneyGhs(amount);
}

export function formatInventoryStatus(status) {
  const labels = {
    IN_STOCK: "In stock",
    OUT_OF_STOCK: "Out of stock",
    INACTIVE: "Inactive",
    ACTIVE: "Active",
    LOW_STOCK: "Low stock",
  };
  return labels[status] || status || "—";
}
