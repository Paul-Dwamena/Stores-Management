import api from "./api";
import { extractApiErrorDetail } from "../utils/apiResponseHelpers";

const toBrand = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description || "",
  isActive: row.is_active !== false,
  active: row.is_active !== false,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const listBrands = async () => {
  try {
    const { data } = await api.get("/brands");
    return data.map(toBrand);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load brands."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const getBrand = async (brandId) => {
  try {
    const { data } = await api.get(`/brands/${brandId}`);
    return toBrand(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load brand."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const createBrand = async ({ name, description }) => {
  try {
    const { data } = await api.post("/brands", {
      name: String(name || "").trim(),
      description: description?.trim() || null,
    });
    return toBrand(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to create brand."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const updateBrand = async (brandId, { name, description, is_active }) => {
  try {
    const body = {};
    if (name != null) body.name = String(name).trim();
    if (description != null) body.description = description?.trim() || null;
    if (is_active != null) body.is_active = is_active;

    const { data } = await api.put(`/brands/${brandId}`, body);
    return toBrand(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to update brand."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const deleteBrand = async (brandId) => {
  try {
    await api.delete(`/brands/${brandId}`);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to delete brand."));
    error.status = err?.response?.status;
    throw error;
  }
};
