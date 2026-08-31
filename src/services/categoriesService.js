import api from "./api";
import { extractApiErrorDetail } from "../utils/apiResponseHelpers";

const toCategory = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description || "",
  isActive: row.is_active !== false,
  active: row.is_active !== false,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const listCategories = async () => {
  try {
    const { data } = await api.get("/categories");
    return data.map(toCategory);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load categories."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const getCategory = async (categoryId) => {
  try {
    const { data } = await api.get(`/categories/${categoryId}`);
    return toCategory(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load category."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const createCategory = async ({ name, description }) => {
  try {
    const { data } = await api.post("/categories", {
      name: String(name || "").trim(),
      description: description?.trim() || null,
    });
    return toCategory(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to create category."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const updateCategory = async (categoryId, { name, description, is_active }) => {
  try {
    const body = {};
    if (name != null) body.name = String(name).trim();
    if (description != null) body.description = description?.trim() || null;
    if (is_active != null) body.is_active = is_active;

    const { data } = await api.put(`/categories/${categoryId}`, body);
    return toCategory(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to update category."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const deleteCategory = async (categoryId) => {
  try {
    await api.delete(`/categories/${categoryId}`);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to delete category."));
    error.status = err?.response?.status;
    throw error;
  }
};
