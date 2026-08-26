import api from "./api";
import { extractApiErrorDetail } from "../utils/apiResponseHelpers";

const toManager = (manager) => {
  if (!manager) return null;
  return {
    id: manager.id,
    firstName: manager.first_name,
    lastName: manager.last_name,
    email: manager.email,
    name: `${manager.first_name || ""} ${manager.last_name || ""}`.trim(),
  };
};

const toStore = (row) => {
  const manager = toManager(row.manager);
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    address: row.address,
    city: row.city,
    region: row.region,
    manager,
    managerName: manager?.name || "",
    isActive: row.is_active,
    status: row.is_active ? "Active" : "Inactive",
    createdAt: row.created_at,
  };
};

export const formatStoreManagerName = (manager) => {
  if (!manager) return "—";
  return manager.name || manager.email || "—";
};

export const listStores = async () => {
  try {
    const { data } = await api.get("/stores");
    return data.map(toStore);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load stores."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const getStore = async (storeId) => {
  try {
    const { data } = await api.get(`/stores/${storeId}`);
    return toStore(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load store."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const createStore = async ({
  name,
  address,
  city,
  region,
  manager_id,
  is_active,
}) => {
  try {
    const { data } = await api.post("/stores", {
      name,
      address,
      city,
      region,
      manager_id,
      is_active,
    });
    return toStore(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to create store."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const updateStore = async (
  storeId,
  { name, address, city, region, manager_id, is_active },
) => {
  try {
    const { data } = await api.put(`/stores/${storeId}`, {
      name,
      address,
      city,
      region,
      manager_id,
      is_active,
    });
    return toStore(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to update store."));
    error.status = err?.response?.status;
    throw error;
  }
};
