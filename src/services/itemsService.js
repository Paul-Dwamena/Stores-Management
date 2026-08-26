import api from "./api";
import { extractApiErrorDetail } from "../utils/apiResponseHelpers";

const toItemOption = (row) => ({
  id: row.id,
  name: row.name,
  code: row.code,
  itemCode: row.code,
  brand: row.brand || "",
  description: row.description || "",
  photo: row.photo_url || "",
  unit: row.unit || "",
  isActive: row.is_active !== false,
});

export const listItems = async () => {
  try {
    const { data } = await api.get("/items");
    return (Array.isArray(data) ? data : []).map(toItemOption);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load items."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const createItem = async ({ name, description, unit, brand, photo }) => {
  try {
    const body = new FormData();
    body.append("name", name);
    body.append("unit", unit);
    body.append("brand", brand);
    if (description) body.append("description", description);
    if (photo instanceof File) body.append("photo", photo);
    const { data } = await api.post("/items", body, {
      transformRequest: [
        (data, headers) => {
          if (headers && data instanceof FormData) {
            delete headers["Content-Type"];
          }
          return data;
        },
      ],
    });
    return toItemOption(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to create item."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const updateItem = async (itemId, { name, code, brand, description, unit, is_active }) => {
  try {
    const { data } = await api.put(`/items/${itemId}`, {
      name,
      code,
      brand,
      description,
      unit,
      is_active,
    });
    return toItemOption(data);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to update item."));
    error.status = err?.response?.status;
    throw error;
  }
};
