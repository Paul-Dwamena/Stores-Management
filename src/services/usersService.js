import api from "./api";
import { extractApiErrorDetail } from "../utils/apiResponseHelpers";

const toUser = (row) => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  name: `${row.first_name} ${row.last_name}`.trim(),
  email: row.email,
  phone: row.phone,
  roleId: row.role_id,
  isActive: row.is_active,
  status: row.is_active ? "Active" : "Inactive",
  createdAt: row.created_at,
});

export const listUsers = async () => {
  try {
    const { data } = await api.get("/users");
    return data.map(toUser);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load users."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const getUser = async (userId) => {
  try {
    const { data } = await api.get(`/users/${userId}`);
    return toUser(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load user."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const createUser = async ({
  first_name,
  last_name,
  email,
  phone,
  password,
  role_id,
}) => {
  try {
    const body = {
      first_name,
      last_name,
      email,
      phone,
      role_id,
    };
    if (password) body.password = password;

    const { data } = await api.post("/users", body);
    return toUser(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to create user."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const updateUser = async (
  userId,
  { first_name, last_name, email, phone, role_id, is_active },
) => {
  try {
    const { data } = await api.put(`/users/${userId}`, {
      first_name,
      last_name,
      email,
      phone,
      role_id,
      is_active,
    });
    return toUser(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to update user."));
    error.status = err?.response?.status;
    throw error;
  }
};
