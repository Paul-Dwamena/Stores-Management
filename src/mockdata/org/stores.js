/** Store locations catalog — source of truth for inventory, supplies, and transfers. */

import { getUsers } from "./users";

const SEED_STORES = [
  {
    id: "st-001",
    code: "ACS",
    name: "Accra Central Store",
    area: "Ringway Estates",
    city: "Accra",
    phone: "030 222 1100",
    manager: "Ama Serwaa",
    managerId: "usr-002",
    status: "Active",
  },
  {
    id: "st-002",
    code: "TFS",
    name: "Tema Fleet Store",
    area: "Community 12",
    city: "Tema",
    phone: "030 310 2210",
    manager: "Kwesi Mensah",
    managerId: "usr-003",
    status: "Active",
  },
  {
    id: "st-003",
    code: "KRS",
    name: "Kumasi Regional Store",
    area: "Asokwa",
    city: "Kumasi",
    phone: "032 202 3340",
    manager: "Yaw Mensah",
    managerId: "usr-006",
    status: "Active",
  },
  {
    id: "st-004",
    code: "TRS",
    name: "Takoradi Regional Store",
    area: "Effia",
    city: "Takoradi",
    phone: "031 202 4480",
    manager: "Akosua Boateng",
    managerId: "usr-007",
    status: "Active",
  },
  {
    id: "st-005",
    code: "TLS",
    name: "Tamale Regional Store",
    area: "Industrial Area",
    city: "Tamale",
    phone: "037 202 5510",
    manager: "Ibrahim Fuseini",
    managerId: "usr-008",
    status: "Active",
  },
];

let sessionStores = SEED_STORES.map((row) => ({ ...row }));

export function formatStoreLabel(store) {
  if (!store) return "";
  return store.area ? `${store.name} — ${store.area}` : store.name;
}

export function getStores() {
  return sessionStores.map((row) => ({ ...row, label: formatStoreLabel(row) }));
}

export function getActiveStores() {
  return getStores().filter((row) => row.status === "Active");
}

export function getStoreLocationOptions() {
  return getActiveStores().map((row) => row.label);
}

function uniqueStoreCode(name, existingId) {
  const initials = String(name)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4);
  const base = initials || "STR";
  const taken = (candidate) =>
    sessionStores.some(
      (row) => row.id !== existingId && String(row.code || "").toLowerCase() === candidate.toLowerCase(),
    );
  if (!taken(base)) return base;
  let n = 2;
  while (taken(`${base}${n}`)) n += 1;
  return `${base}${n}`;
}

export function saveStore(payload, { id } = {}) {
  const name = String(payload.name || "").trim();
  const area = String(payload.area || "").trim();
  const city = String(payload.city || "").trim();
  const phone = String(payload.phone || "").trim();
  const managerId = String(payload.managerId || "").trim();
  const managerUser = getUsers().find((user) => user.id === managerId);
  const manager = managerUser?.name || String(payload.manager || "").trim();
  const status = payload.status === "Inactive" ? "Inactive" : "Active";
  const existing = id ? sessionStores.find((row) => row.id === id) : null;
  const code = String(payload.code || existing?.code || "").trim().toUpperCase() || uniqueStoreCode(name, id);

  if (!name) throw new Error("Enter the store name.");
  if (!city) throw new Error("Enter the city.");
  if (!area) throw new Error("Enter the area or suburb.");

  const duplicate = sessionStores.some(
    (row) =>
      row.id !== id
      && (row.code.toLowerCase() === code.toLowerCase()
        || formatStoreLabel(row).toLowerCase() === formatStoreLabel({ name, area }).toLowerCase()),
  );
  if (duplicate) throw new Error("A store with this code or name already exists.");

  const next = { code, name, area, city, phone, managerId, manager, status };

  if (id) {
    sessionStores = sessionStores.map((row) => (row.id === id ? { ...row, ...next } : row));
    return getStores().find((row) => row.id === id);
  }

  const created = { id: `st-${Date.now().toString(36)}`, ...next };
  sessionStores = [created, ...sessionStores];
  return { ...created, label: formatStoreLabel(created) };
}

export function setStoreStatus(id, status) {
  sessionStores = sessionStores.map((row) =>
    row.id === id ? { ...row, status: status === "Inactive" ? "Inactive" : "Active" } : row,
  );
  return getStores().find((row) => row.id === id) ?? null;
}
