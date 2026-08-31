import { listBrands } from "./brandsService";
import { listCategories } from "./categoriesService";

const API_CATALOG_OPTION_IDS = new Set(["brands", "item-categories"]);

const cache = {
  brands: [],
  "item-categories": [],
};

function toManagedRow(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    active: row.isActive !== false,
  };
}

export function isApiBackedCatalogOption(optionId) {
  return API_CATALOG_OPTION_IDS.has(optionId);
}

export function getCachedCatalogOptions(optionId) {
  if (!isApiBackedCatalogOption(optionId)) return [];
  return (cache[optionId] ?? []).map((row) => ({ ...row }));
}

export async function refreshCatalogOptions(optionId) {
  if (optionId === "brands") {
    const rows = await listBrands();
    cache.brands = rows.map(toManagedRow);
    return cache.brands;
  }
  if (optionId === "item-categories") {
    const rows = await listCategories();
    cache["item-categories"] = rows.map(toManagedRow);
    return cache["item-categories"];
  }
  return [];
}

export function summarizeCachedCatalogOptions(optionId) {
  const items = getCachedCatalogOptions(optionId);
  let active = 0;
  let inactive = 0;
  items.forEach((row) => {
    if (row.active === false) inactive += 1;
    else active += 1;
  });
  return { active, inactive, total: items.length };
}
