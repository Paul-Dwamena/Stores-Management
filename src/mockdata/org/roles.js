import {
  createEmptyPermissions,
  createFullPermissions,
  normalizePermissions,
} from "../../pages/setups/roles/utils/roleHelpers";
import { PERMISSION_MODULES } from "../../pages/setups/roles/utils/roleConstants";

function setModulePermissions(target, moduleId, permissions) {
  target[moduleId] = { ...target[moduleId], ...permissions };
}

function applyViewOnly(target) {
  PERMISSION_MODULES.forEach((module) => {
    setModulePermissions(target, module.id, {
      view: true,
      add: false,
      edit: false,
      delete: false,
      print: module.id === "overview" || module.id === "auditTrail",
    });
  });
}

const full = createFullPermissions();

const manager = createEmptyPermissions();
applyViewOnly(manager);
[
  "inventory",
  "supplies",
  "transfers",
  "requests",
].forEach((moduleId) => {
  setModulePermissions(manager, moduleId, {
    view: true,
    add: true,
    edit: true,
    delete: false,
    print: true,
  });
});
setModulePermissions(manager, "approvals", {
  view: true,
  add: false,
  edit: true,
  delete: false,
  print: true,
});
setModulePermissions(manager, "storeManagement", {
  view: true,
  add: false,
  edit: true,
  delete: false,
  print: false,
});
setModulePermissions(manager, "suppliers", {
  view: true,
  add: true,
  edit: true,
  delete: false,
  print: false,
});
setModulePermissions(manager, "userManagement", {
  view: true,
  add: false,
  edit: false,
  delete: false,
  print: false,
});
setModulePermissions(manager, "settings", {
  view: true,
  add: false,
  edit: true,
  delete: false,
  print: false,
});

const staff = createEmptyPermissions();
applyViewOnly(staff);
["inventory", "supplies", "transfers"].forEach((moduleId) => {
  setModulePermissions(staff, moduleId, {
    view: true,
    add: moduleId !== "transfers",
    edit: moduleId === "supplies",
    delete: false,
    print: true,
  });
});
setModulePermissions(staff, "requests", {
  view: true,
  add: true,
  edit: false,
  delete: false,
  print: false,
});
setModulePermissions(staff, "approvals", {
  view: true,
  add: false,
  edit: false,
  delete: false,
  print: false,
});
setModulePermissions(staff, "settings", {
  view: true,
  add: false,
  edit: true,
  delete: false,
  print: false,
});

const ROLES = [
  {
    id: "role_super_admin",
    name: "Super Admin",
    description: "Full access across stores, setups, approvals, and settings.",
    permissions: full,
    isSystem: true,
    createdAt: "2026-01-10T08:00:00.000Z",
  },
  {
    id: "role_store_manager",
    name: "Store Manager",
    description: "Runs day-to-day inventory, supplies, transfers, and store requests.",
    permissions: manager,
    isSystem: true,
    createdAt: "2026-02-14T10:15:00.000Z",
  },
  {
    id: "role_staff",
    name: "Staff",
    description: "Handles receiving, issuing, and store requests for an assigned store.",
    permissions: staff,
    isSystem: true,
    createdAt: "2026-03-05T11:30:00.000Z",
  },
];

let roles = ROLES.map((role) => ({
  ...role,
  permissions: normalizePermissions(role.permissions),
}));

export function getRoles() {
  return roles.map((role) => ({
    ...role,
    permissions: normalizePermissions(role.permissions),
  }));
}

export function getRoleNames() {
  return getRoles().map((role) => role.name);
}

export function saveRole(payload, { id } = {}) {
  const entry = {
    name: payload.name.trim(),
    description: payload.description?.trim() ?? "",
    permissions: normalizePermissions(payload.permissions),
    isSystem: id ? roles.find((role) => role.id === id)?.isSystem ?? false : false,
    createdAt: id
      ? roles.find((role) => role.id === id)?.createdAt
      : new Date().toISOString(),
  };

  if (id) {
    roles = roles.map((role) => (role.id === id ? { ...role, ...entry } : role));
    return roles.find((role) => role.id === id);
  }

  const created = {
    id: `role_${Date.now()}`,
    ...entry,
  };
  roles = [created, ...roles];
  return created;
}

export function deleteRole(id) {
  const target = roles.find((role) => role.id === id);
  if (target?.isSystem) {
    throw new Error("System roles cannot be deleted.");
  }
  roles = roles.filter((role) => role.id !== id);
}
