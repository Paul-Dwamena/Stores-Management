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
  store: user.store,
  token: access_token,
  tokenType: token_type,
});

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
