/** Dashboard users — Super Admin, Store Manager, Staff, plus custom roles. */

import { getRoleNames } from "./roles";

export const USER_ROLES = ["Super Admin", "Store Manager", "Staff"];
export const USER_STATUSES = ["Active", "Inactive"];

export function splitFullName(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

export function joinFullName(firstName = "", lastName = "") {
  return [firstName, lastName].map((part) => String(part).trim()).filter(Boolean).join(" ");
}

const SEED_USERS = [
  {
    id: "usr-001",
    firstName: "Store",
    lastName: "Administrator",
    email: "admin@stores.local",
    phone: "024 000 0001",
    role: "Super Admin",
    store: "All stores",
    status: "Active",
  },
  {
    id: "usr-002",
    firstName: "Ama",
    lastName: "Serwaa",
    email: "ama.serwaa@stores.local",
    phone: "024 111 0002",
    role: "Store Manager",
    store: "Accra Central Store — Ringway Estates",
    status: "Active",
  },
  {
    id: "usr-003",
    firstName: "Kwesi",
    lastName: "Mensah",
    email: "kwesi.mensah@stores.local",
    phone: "024 111 0001",
    role: "Store Manager",
    store: "Tema Fleet Store — Community 12",
    status: "Active",
  },
  {
    id: "usr-004",
    firstName: "Esi",
    lastName: "Nyarko",
    email: "esi.nyarko@stores.local",
    phone: "024 111 0003",
    role: "Staff",
    store: "Accra Central Store — Ringway Estates",
    status: "Active",
  },
  {
    id: "usr-005",
    firstName: "Kojo",
    lastName: "Owusu",
    email: "kojo.owusu@stores.local",
    phone: "024 111 0004",
    role: "Staff",
    store: "Kumasi Regional Store — Asokwa",
    status: "Inactive",
  },
  {
    id: "usr-006",
    firstName: "Yaw",
    lastName: "Mensah",
    email: "yaw.mensah@stores.local",
    phone: "024 111 0005",
    role: "Store Manager",
    store: "Kumasi Regional Store — Asokwa",
    status: "Active",
  },
  {
    id: "usr-007",
    firstName: "Akosua",
    lastName: "Boateng",
    email: "akosua.boateng@stores.local",
    phone: "024 111 0006",
    role: "Store Manager",
    store: "Takoradi Regional Store — Effia",
    status: "Active",
  },
  {
    id: "usr-008",
    firstName: "Ibrahim",
    lastName: "Fuseini",
    email: "ibrahim.fuseini@stores.local",
    phone: "024 111 0007",
    role: "Store Manager",
    store: "Tamale Regional Store — Industrial Area",
    status: "Active",
  },
  {
    id: "usr-009",
    firstName: "Selorm",
    lastName: "Gbeho",
    email: "selorm.gbeho@stores.local",
    phone: "024 111 0008",
    role: "Staff",
    store: "Accra Central Store — Ringway Estates",
    status: "Active",
  },
  {
    id: "usr-010",
    firstName: "Kofi",
    lastName: "Ansah",
    email: "kofi.ansah@stores.local",
    phone: "024 111 0009",
    role: "Staff",
    store: "Tema Fleet Store — Community 12",
    status: "Active",
  },
  {
    id: "usr-011",
    firstName: "Nana",
    lastName: "Osei",
    email: "nana.osei@stores.local",
    phone: "024 111 0010",
    role: "Staff",
    store: "Accra Central Store — Ringway Estates",
    status: "Active",
  },
  {
    id: "usr-012",
    firstName: "Adjei",
    lastName: "Boateng",
    email: "adjei.boateng@stores.local",
    phone: "024 111 0011",
    role: "Staff",
    store: "Kumasi Regional Store — Asokwa",
    status: "Active",
  },
  {
    id: "usr-013",
    firstName: "Kwame",
    lastName: "Frimpong",
    email: "kwame.frimpong@stores.local",
    phone: "024 111 0012",
    role: "Staff",
    store: "Tema Fleet Store — Community 12",
    status: "Active",
  },
  {
    id: "usr-014",
    firstName: "Efua",
    lastName: "Darko",
    email: "efua.darko@stores.local",
    phone: "024 111 0013",
    role: "Staff",
    store: "Accra Central Store — Ringway Estates",
    status: "Active",
  },
  {
    id: "usr-015",
    firstName: "Akosua",
    lastName: "Dede",
    email: "akosua.dede@stores.local",
    phone: "024 111 0014",
    role: "Staff",
    store: "Kumasi Regional Store — Asokwa",
    status: "Active",
  },
  {
    id: "usr-016",
    firstName: "Michael",
    lastName: "Addo",
    email: "michael.addo@stores.local",
    phone: "024 111 0015",
    role: "Staff",
    store: "Accra Central Store — Ringway Estates",
    status: "Active",
  },
  {
    id: "usr-017",
    firstName: "Fiifi",
    lastName: "Bentum",
    email: "fiifi.bentum@stores.local",
    phone: "024 111 0016",
    role: "Staff",
    store: "Tema Fleet Store — Community 12",
    status: "Active",
  },
];

function withDisplayName(row) {
  const firstName = String(row.firstName || "").trim() || splitFullName(row.name).firstName;
  const lastName = String(row.lastName || "").trim() || splitFullName(row.name).lastName;
  return {
    ...row,
    firstName,
    lastName,
    name: joinFullName(firstName, lastName),
  };
}

let sessionUsers = SEED_USERS.map((row) => withDisplayName(row));

export function getUsers() {
  return sessionUsers.map((row) => withDisplayName(row));
}

export function getActiveUsers() {
  return getUsers().filter((row) => row.status === "Active");
}

export function getStoreManagers({ includeInactive = false } = {}) {
  return getUsers().filter(
    (row) =>
      row.role === "Store Manager" && (includeInactive || row.status === "Active"),
  );
}

export function getUserByName(name) {
  const label = String(name || "").trim().toLowerCase();
  if (!label) return null;
  return getUsers().find((row) => row.name.toLowerCase() === label) ?? null;
}

export function getUserContact(name) {
  const row = getUserByName(name);
  return {
    name: row?.name || String(name || "").trim(),
    email: row?.email || "",
    phone: row?.phone || "",
    store: row?.store || "",
    role: row?.role || "",
  };
}

export function saveUser(payload, { id } = {}) {
  const firstName = String(payload.firstName || "").trim();
  const lastName = String(payload.lastName || "").trim();
  const email = String(payload.email || "").trim();
  const phone = String(payload.phone || "").trim();
  const role = String(payload.role || "").trim();
  const store = role === "Super Admin" ? "All stores" : String(payload.store || "").trim();
  const status = payload.status === "Inactive" ? "Inactive" : "Active";

  if (!firstName) throw new Error("Enter a first name.");
  if (!lastName) throw new Error("Enter a last name.");
  if (!email) throw new Error("Enter an email address.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  if (!phone) throw new Error("Enter a phone number.");
  if (!getRoleNames().includes(role)) throw new Error("Select a role.");
  if (role !== "Super Admin" && !store) throw new Error("Assign a store.");

  const duplicate = sessionUsers.some(
    (row) => row.id !== id && row.email.toLowerCase() === email.toLowerCase(),
  );
  if (duplicate) throw new Error("A user with this email already exists.");

  const next = withDisplayName({ firstName, lastName, email, phone, role, store, status });

  if (id) {
    sessionUsers = sessionUsers.map((row) => (row.id === id ? { ...row, ...next } : row));
    return getUsers().find((row) => row.id === id);
  }

  const created = { id: `usr-${Date.now().toString(36)}`, ...next };
  sessionUsers = [created, ...sessionUsers];
  return { ...created };
}

export function setUserStatus(id, status) {
  sessionUsers = sessionUsers.map((row) =>
    row.id === id ? { ...row, status: status === "Inactive" ? "Inactive" : "Active" } : row,
  );
  return getUsers().find((row) => row.id === id) ?? null;
}
