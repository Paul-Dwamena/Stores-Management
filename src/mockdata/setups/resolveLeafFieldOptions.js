import { resolveDropdownOptionChoices } from "./dropdownOptionChoices";
import { normalizeFieldOptions } from "./vehicleSpecTree";

/** Resolve leaf options for runtime forms (manual list or dropdown-options source). */
export function resolveLeafFieldOptions(leaf) {
  if (!leaf) return null;
  if (
    (leaf.fieldType === "select" || leaf.fieldType === "search_select")
    && leaf.optionsSource === "dropdown"
  ) {
    const choices = resolveDropdownOptionChoices(leaf.dropdownOptionId);
    return choices.length ? choices : null;
  }
  return normalizeFieldOptions(leaf.options);
}
