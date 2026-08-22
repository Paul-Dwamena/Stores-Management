/** Accessory suppliers used on receipts and inventory. */

const SEED_SUPPLIERS = [
  {
    id: "sup-accra-auto",
    name: "Accra Auto Spares Ltd.",
    phone: "030 276 4410",
    email: "sales@accraauto.gh",
    city: "Accra",
    status: "Active",
  },
  {
    id: "sup-tema-parts",
    name: "Tema Parts Hub",
    phone: "030 310 8802",
    email: "hello@temapartshub.gh",
    city: "Tema",
    status: "Active",
  },
  {
    id: "sup-kumasi-fleet",
    name: "Kumasi Fleet Supplies",
    phone: "032 202 1190",
    email: "orders@kumasifleet.gh",
    city: "Kumasi",
    status: "Active",
  },
  {
    id: "sup-golden-lube",
    name: "Golden Lube Ghana",
    phone: "030 255 6701",
    email: "info@goldenlube.gh",
    city: "Accra",
    status: "Active",
  },
  {
    id: "sup-tyre-masters",
    name: "Tyre Masters Ghana",
    phone: "030 244 9088",
    email: "sales@tyremasters.gh",
    city: "Tema",
    status: "Inactive",
  },
];

let sessionSuppliers = SEED_SUPPLIERS.map((row) => ({ ...row }));

export function getSuppliers() {
  return sessionSuppliers.map((row) => ({ ...row }));
}

export function getActiveSuppliers() {
  return getSuppliers().filter((row) => row.status === "Active");
}

export function getSupplierById(id) {
  if (!id) return null;
  return getSuppliers().find((row) => row.id === id) ?? null;
}

export function getSupplierContact(id) {
  const supplier = getSupplierById(id);
  return {
    supplierPhone: supplier?.phone || "",
    supplierEmail: supplier?.email || "",
  };
}

export function saveSupplier(payload, { id } = {}) {
  const name = String(payload.name || "").trim();
  const phone = String(payload.phone || "").trim();
  const email = String(payload.email || "").trim();
  const city = String(payload.city || "").trim();
  const status = payload.status === "Inactive" ? "Inactive" : "Active";

  if (!name) throw new Error("Enter the supplier name.");
  if (!phone) throw new Error("Enter a phone number.");
  if (!email) throw new Error("Enter an email address.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  const duplicate = sessionSuppliers.some(
    (row) => row.id !== id && row.name.toLowerCase() === name.toLowerCase(),
  );
  if (duplicate) throw new Error("A supplier with this name already exists.");

  const next = { name, phone, email, city, status };

  if (id) {
    sessionSuppliers = sessionSuppliers.map((row) => (row.id === id ? { ...row, ...next } : row));
    return getSuppliers().find((row) => row.id === id);
  }

  const created = { id: `sup-${Date.now().toString(36)}`, ...next };
  sessionSuppliers = [created, ...sessionSuppliers];
  return { ...created };
}

export function setSupplierStatus(id, status) {
  sessionSuppliers = sessionSuppliers.map((row) =>
    row.id === id ? { ...row, status: status === "Inactive" ? "Inactive" : "Active" } : row,
  );
  return getSuppliers().find((row) => row.id === id) ?? null;
}

/** Compatibility shape used by existing inventory dropdowns. */
export const SEED_SUPPLIERS_MIN = () =>
  getActiveSuppliers().map((row) => ({ id: row.id, name: row.name }));
