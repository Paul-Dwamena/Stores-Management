import api from "./api";
import { extractApiErrorDetail } from "../utils/apiResponseHelpers";

export const formatRoleName = (name) =>
  String(name || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const roleKey = (name) =>
  String(name || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

/** Match backend role names like RECEIVER / Receiver / Reciever (API spelling). */
export const isReceiverRoleName = (name) => {
  const key = roleKey(name);
  if (!key) return false;
  if (key === "RECEIVER" || key === "RECEIVERS") return true;
  // Backend schemas often use the "reciever" spelling.
  if (key === "RECIEVER" || key === "RECIEVERS") return true;
  return key.includes("RECEIVER") || key.includes("RECIEVER");
};

export const findReceiverRole = (roles = []) =>
  roles.find((role) => isReceiverRoleName(role?.name) || isReceiverRoleName(role?.label));

/** Match backend role names like DISPATCHER / Dispatcher. */
export const isDispatcherRoleName = (name) => {
  const key = roleKey(name);
  if (!key) return false;
  if (key === "DISPATCHER" || key === "DISPATCHERS") return true;
  return key.includes("DISPATCHER");
};

export const findDispatcherRole = (roles = []) =>
  roles.find((role) => isDispatcherRoleName(role?.name) || isDispatcherRoleName(role?.label));

const BUILTIN_ROLE_NAMES = new Set(["SUPER_ADMIN", "STAFF", "STORE_MANAGER"]);

const roleNameKey = (role) =>
  String(role?.name || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

/** Only Super Admin permissions are locked in the UI. */
export const isSuperAdminSystemRole = (role) => roleNameKey(role) === "SUPER_ADMIN";

/**
 * Built-in / system roles (name cannot be changed; Super Admin also cannot
 * edit permissions or be deleted).
 */
export const isBuiltInRole = (role) => {
  if (BUILTIN_ROLE_NAMES.has(roleNameKey(role))) return true;
  return (
    isReceiverRoleName(role?.name)
    || isReceiverRoleName(role?.label)
    || isDispatcherRoleName(role?.name)
    || isDispatcherRoleName(role?.label)
  );
};

/** @deprecated Prefer isSuperAdminSystemRole / isBuiltInRole. */
export const isProtectedRole = isSuperAdminSystemRole;

const toPermission = (row) => ({
  id: row.id,
  name: row.name,
  resource: row.resource,
  action: row.action,
  description: row.description,
  createdAt: row.created_at,
});

const toRole = (row) => ({
  id: row.id,
  name: row.name,
  label: formatRoleName(row.name),
  description: row.description,
  createdAt: row.created_at,
  permissionCount: row.permission_count,
});

const toSingleRole = (row) => ({
  id: row.id,
  name: row.name,
  label: formatRoleName(row.name),
  description: row.description,
  createdAt: row.created_at,
  permissionCount: row.permission_count,
  permissions: (row.permissions || []).map((permission) => ({
    id: permission.id,
    name: permission.name,
    resource: permission.resource,
    action: permission.action,
  })),
});

export const listRoles = async () => {
  try {
    const { data } = await api.get("/roles");
    return data.map(toRole);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load roles."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const createRole = async ({ name, description }) => {
  try {
    const { data } = await api.post("/roles", { name, description });
    return toRole(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to create role."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const getRole = async (roleId) => {
  try {
    const { data } = await api.get(`/roles/${roleId}`);
    return toSingleRole(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load role."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const updateRole = async (roleId, { name, description, permission_ids }) => {
  try {
    const { data } = await api.patch(`/roles/${roleId}`, {
      name,
      description,
      permission_ids,
    });
    return toSingleRole(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to update role."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const deleteRole = async (roleId) => {
  try {
    await api.delete(`/roles/${roleId}`);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to delete role."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const listPermissions = async () => {
  try {
    const { data } = await api.get("/permissions");
    return data.map(toPermission);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load permissions."));
    error.status = err?.response?.status;
    throw error;
  }
};
