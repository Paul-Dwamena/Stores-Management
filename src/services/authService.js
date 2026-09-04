import api from "./api";
import { extractApiErrorDetail } from "../utils/apiResponseHelpers";
import { formatRoleName } from "./rolesService";

const toSession = ({ access_token, token_type, user }) => ({
  id: user.id,
  firstName: user.first_name,
  lastName: user.last_name,
  name: `${user.first_name} ${user.last_name}`.trim(),
  email: user.email,
  phone: user.phone,
  isActive: user.is_active,
  role: formatRoleName(user.role.name),
  roleId: user.role.id,
  roleName: user.role.name,
  store: user.store,
  permissions: [],
  token: access_token,
  tokenType: token_type,
});

/** Derive resource from dotted name when API omits resource (e.g. users.create). */
export const toPermission = (row) => {
  const name = String(row?.name || "").trim();
  const action = row?.action || (name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : "");
  const resource =
    row?.resource
    || (name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : "");

  return {
    id: row?.id,
    name: name || undefined,
    resource: resource || undefined,
    action: action || undefined,
    description: row?.description ?? null,
  };
};

const toProfile = (data) => ({
  id: data.id,
  firstName: data.first_name,
  lastName: data.last_name,
  name: `${data.first_name} ${data.last_name}`.trim(),
  email: data.email,
  phone: data.phone,
  isActive: data.is_active,
  roleId: data.role_id,
  createdAt: data.created_at,
  permissions: (data.permissions || []).map(toPermission),
});

export const loginUser = async (email, password) => {
  try {
    const { data } = await api.post("/auth/login", { email, password });
    return toSession(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to sign in."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const getMe = async () => {
  try {
    const { data } = await api.get("/auth/me");
    return toProfile(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load profile."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const changePassword = async (current_password, new_password) => {
  try {
    const { data } = await api.post("/auth/change-password", {
      current_password,
      new_password,
    });
    return data;
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to change password."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const requestPasswordReset = async (phone_number) => {
  try {
    const { data } = await api.post("/auth/reset-password/request", { phone_number });
    return data;
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to request password reset."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const confirmPasswordReset = async ({ email, otp, new_password }) => {
  try {
    const { data } = await api.post("/auth/reset-password/confirm", {
      email,
      otp,
      new_password,
    });
    return data;
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to reset password."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const updateProfile = async ({ first_name, last_name }) => {
  try {
    const { data } = await api.put("/auth/profile", {
      first_name,
      last_name,
    });
    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      name: `${data.first_name} ${data.last_name}`.trim(),
      email: data.email,
      phone: data.phone,
    };
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to update profile."));
    error.status = err?.response?.status;
    throw error;
  }
};
