import api from "./api";
import { extractApiErrorDetail } from "../utils/apiResponseHelpers";

export const formatRoleName = (name) =>
  String(name || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const PROTECTED_ROLE_NAMES = new Set(["SUPER_ADMIN", "STAFF", "STORE_MANAGER"]);

export const isProtectedRole = (role) =>
  PROTECTED_ROLE_NAMES.has(String(role?.name || "").toUpperCase());

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
