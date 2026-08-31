import {
  getAllDropdownOptions,
  getDropdownOptionBySlug,
} from "../../pages/setups/dropdownOptions/dropdownOptionCatalog";
import {
  isManagedDropdownOption,
  listManagedDropdownItems,
} from "./dropdownOptionsStore";

function toChoice(value, label) {
  const nextValue = String(value ?? "").trim();
  if (!nextValue) return null;
  return {
    value: nextValue,
    label: String(label ?? nextValue).trim() || nextValue,
  };
}

function fromNamedRows(rows = []) {
  return rows
    .filter((row) => row && row.active !== false)
    .map((row) => toChoice(row.name, row.name))
    .filter(Boolean);
}

/** Catalog entries available as a select field options source. */
export function getDropdownOptionSourceChoices() {
  return getAllDropdownOptions().map((option) => ({
    value: option.id,
    label: option.title,
  }));
}

/**
 * Resolve active dropdown-option rows into `{ value, label }` choices for forms.
 * Returns [] when the source is unknown or empty.
 */
export function resolveDropdownOptionChoices(optionId) {
  if (!optionId) return [];

  if (isManagedDropdownOption(optionId)) {
    return fromNamedRows(listManagedDropdownItems(optionId));
  }

  return [];
}

export function getDropdownOptionSourceLabel(optionId) {
  return getDropdownOptionBySlug(optionId)?.title ?? optionId ?? "";
}

export { toChoice };
