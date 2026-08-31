import {
  isManagedDropdownOption,
  summarizeManagedDropdownItems,
} from "../../../mockdata/setups/dropdownOptionsStore";

const EMPTY_STATS = { active: 0, inactive: 0, total: 0 };

export async function loadDropdownOptionStats(optionId) {
  if (isManagedDropdownOption(optionId)) {
    return summarizeManagedDropdownItems(optionId);
  }
  return EMPTY_STATS;
}

export async function loadAllDropdownOptionStats(optionIds) {
  const entries = await Promise.all(
    optionIds.map(async (id) => [id, await loadDropdownOptionStats(id)]),
  );
  return Object.fromEntries(entries);
}
