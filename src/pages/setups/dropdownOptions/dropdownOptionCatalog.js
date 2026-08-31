import { ensureManagedDropdownOption } from "../../../mockdata/setups/dropdownOptionsStore";

/** Master catalog for Setups → Dropdown Options hub cards. */
export const DROPDOWN_OPTIONS = [
  {
    id: "item-categories",
    title: "Item Categories",
    description: "Categories used when registering and organizing inventory items.",
    path: "/setups/dropdown-options/item-categories",
  },
  {
    id: "brands",
    title: "Brands",
    description: "Brands available when receiving accessories into a store.",
    path: "/setups/dropdown-options/brands",
  },
  {
    id: "base-units",
    title: "Base Units",
    description: "Canonical units used for inventory quantity (piece, liter, kilogram, etc.).",
    path: "/setups/dropdown-options/base-units",
  },
];

const customDropdownOptions = [];

function slugifyDropdownOptionId(title = "") {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getAllDropdownOptions() {
  return [...DROPDOWN_OPTIONS, ...customDropdownOptions];
}

export function getDropdownOptionBySlug(slug) {
  return getAllDropdownOptions().find((option) => option.id === slug) ?? null;
}

export function addCustomDropdownOption({ title, description = "" } = {}) {
  const trimmedTitle = String(title ?? "").trim();
  if (!trimmedTitle) {
    throw new Error("Enter a name for this dropdown list.");
  }

  const id = slugifyDropdownOptionId(trimmedTitle);
  if (!id) {
    throw new Error("Enter a name that includes letters or numbers.");
  }

  if (getDropdownOptionBySlug(id)) {
    throw new Error("A dropdown list with this name already exists.");
  }

  const option = {
    id,
    title: trimmedTitle,
    description: String(description ?? "").trim(),
    path: `/setups/dropdown-options/${id}`,
    custom: true,
  };
  customDropdownOptions.push(option);
  ensureManagedDropdownOption(id);
  return option;
}
