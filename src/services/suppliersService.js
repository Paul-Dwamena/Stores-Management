import api from "./api";
import { extractApiErrorDetail } from "../utils/apiResponseHelpers";

const toSupplier = (row) => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  email: row.email,
  address: row.address,
  isActive: row.is_active,
  status: row.is_active ? "Active" : "Inactive",
  createdAt: row.created_at,
});

export const listSuppliers = async () => {
  try {
    const { data } = await api.get("/suppliers");
    return data.map(toSupplier);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load suppliers."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const getSupplier = async (supplierId) => {
  try {
    const { data } = await api.get(`/suppliers/${supplierId}`);
    return toSupplier(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load supplier."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const createSupplier = async ({ name, phone, email, address }) => {
  try {
    const { data } = await api.post("/suppliers", {
      name,
      phone,
      email,
      address,
    });
    return toSupplier(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to create supplier."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const updateSupplier = async (
  supplierId,
  { name, phone, email, address, is_active },
) => {
  try {
    const { data } = await api.put(`/suppliers/${supplierId}`, {
      name,
      phone,
      email,
      address,
      is_active,
    });
    return toSupplier(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to update supplier."));
    error.status = err?.response?.status;
    throw error;
  }
};
