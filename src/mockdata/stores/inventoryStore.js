import { SEED_INVENTORY_PARTS, SEED_SUPPLIERS } from "./inventoryParts";
import { SEED_PURCHASE_ORDERS } from "./purchaseOrders";

const PARTS_KEY = "fleetly_mock_inventory_parts";
const PO_KEY = "fleetly_mock_purchase_orders";
const VERSION_KEY = "fleetly_inventory_store_version";
const STORE_VERSION = 1;

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function delay(ms = 120) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function syncStoreVersion() {
  const current = localStorage.getItem(VERSION_KEY);
  if (current === String(STORE_VERSION)) return;

  localStorage.setItem(PARTS_KEY, JSON.stringify(SEED_INVENTORY_PARTS));
  localStorage.setItem(PO_KEY, JSON.stringify(SEED_PURCHASE_ORDERS));
  localStorage.setItem(VERSION_KEY, String(STORE_VERSION));
}

function readParts() {
  syncStoreVersion();
  try {
    const raw = localStorage.getItem(PARTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* fall through */
  }
  localStorage.setItem(PARTS_KEY, JSON.stringify(SEED_INVENTORY_PARTS));
  return [...SEED_INVENTORY_PARTS];
}

function writeParts(parts) {
  localStorage.setItem(PARTS_KEY, JSON.stringify(parts));
}

function readPurchaseOrders() {
  syncStoreVersion();
  try {
    const raw = localStorage.getItem(PO_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* fall through */
  }
  localStorage.setItem(PO_KEY, JSON.stringify(SEED_PURCHASE_ORDERS));
  return [...SEED_PURCHASE_ORDERS];
}

function writePurchaseOrders(orders) {
  localStorage.setItem(PO_KEY, JSON.stringify(orders));
}

function findPoIndex(orders, id) {
  const key = String(id ?? "").toLowerCase();
  return orders.findIndex(
    (o) =>
      String(o.id ?? "").toLowerCase() === key ||
      String(o.poNumber ?? "").toLowerCase() === key,
  );
}

function paginate(list, { page = 0, size = 10 } = {}) {
  const safeSize = Math.max(1, Number(size) || 10);
  const safePage = Math.max(0, Number(page) || 0);
  const totalElements = list.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / safeSize));
  const start = safePage * safeSize;
  const content = list.slice(start, start + safeSize);

  return {
    content,
    page: safePage,
    size: safeSize,
    totalElements,
    totalPages,
  };
}

function resolveSupplierName(supplierId) {
  if (!supplierId) return "General Supplier";
  return SEED_SUPPLIERS.find((s) => s.id === supplierId)?.name ?? supplierId;
}

function applyLineItemsToStock(parts, lineItems = []) {
  const next = parts.map((p) => ({ ...p }));
  for (const line of lineItems) {
    const idx = next.findIndex(
      (p) =>
        p.id === line.partId ||
        (line.sku && p.sku === line.sku),
    );
    if (idx >= 0) {
      next[idx] = {
        ...next[idx],
        quantity: (next[idx].quantity ?? 0) + (Number(line.quantity) || 0),
        updatedAt: new Date().toISOString(),
      };
    }
  }
  return next;
}

/** GET /inventory/parts */
export async function getInventoryParts(params = {}) {
  await delay();
  const parts = readParts().sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? ""),
  );
  return paginate(parts, params);
}

/** GET /purchase-orders */
export async function getPurchaseOrders(params = {}) {
  await delay();
  const orders = readPurchaseOrders().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return paginate(orders, params);
}

/** POST /inventory/parts/add-part-manual */
export async function addPartManual(data = {}) {
  await delay();
  const parts = readParts();
  const created = {
    id: createId(),
    name: data.name?.trim() ?? "Unnamed Part",
    sku: data.sku?.trim() || undefined,
    quantity: Number(data.quantity) || 0,
    unitCost: data.unitCost != null ? Number(data.unitCost) : undefined,
    category: data.category ?? "General",
    minStock: data.minStock ?? 0,
    location: data.location ?? "Main Store",
    updatedAt: new Date().toISOString(),
  };
  parts.unshift(created);
  writeParts(parts);
  return created;
}

/** POST /purchase-orders */
export async function createPurchaseOrder(data = {}) {
  await delay();
  const orders = readPurchaseOrders();
  const seq = orders.length + 1;
  const created = {
    id: createId(),
    poNumber: `PO-2026-${String(200 + seq).padStart(4, "0")}`,
    supplierId: data.supplierId || undefined,
    supplierName: resolveSupplierName(data.supplierId),
    status: "PENDING",
    notes: data.notes?.trim() || undefined,
    totalAmount: data.totalAmount ?? null,
    createdAt: new Date().toISOString(),
    lineItems: data.lineItems ?? [],
  };
  orders.unshift(created);
  writePurchaseOrders(orders);
  return created;
}

/** POST /purchase-orders/:id/receive */
export async function receivePurchaseOrder(poId) {
  await delay();
  const orders = readPurchaseOrders();
  const idx = findPoIndex(orders, poId);
  if (idx < 0) {
    const err = new Error("Purchase order not found");
    err.response = { status: 404, data: { message: "Purchase order not found" } };
    throw err;
  }

  const po = orders[idx];
  if (po.status === "RECEIVED") {
    const err = new Error("Purchase order already received");
    err.response = { status: 400, data: { message: "Purchase order already received" } };
    throw err;
  }
  if (po.status === "CANCELLED") {
    const err = new Error("Cannot receive a cancelled purchase order");
    err.response = { status: 400, data: { message: "Cannot receive a cancelled purchase order" } };
    throw err;
  }

  orders[idx] = {
    ...po,
    status: "RECEIVED",
    receivedAt: new Date().toISOString(),
  };
  writePurchaseOrders(orders);

  if (po.lineItems?.length) {
    writeParts(applyLineItemsToStock(readParts(), po.lineItems));
  }

  return orders[idx];
}

/** Reset store to seed data (dev helper). */
export function resetInventoryStore() {
  localStorage.setItem(PARTS_KEY, JSON.stringify(SEED_INVENTORY_PARTS));
  localStorage.setItem(PO_KEY, JSON.stringify(SEED_PURCHASE_ORDERS));
  localStorage.setItem(VERSION_KEY, String(STORE_VERSION));
}

export { SEED_INVENTORY_PARTS, SEED_PURCHASE_ORDERS, SEED_SUPPLIERS };
