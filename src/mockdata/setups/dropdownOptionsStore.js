/** In-memory master lists for Setups → Dropdown Options. */

function item(id, name, description = "", active = true) {
  return { id, name, description, active };
}

export const MANAGED_DROPDOWN_SEEDS = {
  "item-categories": [
    item("ic-1", "Inverters", "Power inverters and related electrical conversion accessories."),
    item("ic-2", "Batteries", "Vehicle and portable batteries."),
    item("ic-3", "Chargers", "Battery chargers and charging accessories."),
    item("ic-4", "Jump Starters", "Portable jump-start and booster packs."),
    item("ic-5", "Floor Mats", "Floor mats and cabin protection."),
    item("ic-6", "Cables & Adapters", "Power cables, adapters, and connectors."),
    item("ic-7", "Tools", "Hand tools and workshop equipment."),
    item("ic-8", "Safety Equipment", "PPE and fleet safety accessories."),
  ],
  brands: [
    item("br-1", "AutoGuard", "AutoGuard accessory line."),
    item("br-2", "Anker", "Anker electronics and power accessories."),
    item("br-3", "Bosch", "Bosch automotive and workshop products."),
    item("br-4", "NOCO", "NOCO battery and jump-start products."),
    item("br-5", "RoadSafe", "RoadSafe safety and fleet accessories."),
    item("br-6", "SafeFleet", "SafeFleet branded fleet supplies."),
  ],
  "base-units": [
    item("bu-1", "Piece", "Countable items such as chargers and accessories."),
    item("bu-2", "Liter", "Fluids such as engine oil and coolant."),
    item("bu-3", "Kilogram", "Weight-based items."),
    item("bu-4", "Meter", "Length-based items such as cable."),
  ],
};

const store = Object.fromEntries(
  Object.entries(MANAGED_DROPDOWN_SEEDS).map(([key, items]) => [
    key,
    items.map((row) => ({ ...row })),
  ]),
);

const API_BACKED_OPTION_IDS = new Set(["brands", "item-categories"]);

export function isManagedDropdownOption(optionId) {
  if (API_BACKED_OPTION_IDS.has(optionId)) return false;
  return Object.prototype.hasOwnProperty.call(store, optionId);
}

export function ensureManagedDropdownOption(optionId) {
  if (!optionId || isManagedDropdownOption(optionId)) return;
  store[optionId] = [];
}

export function listManagedDropdownItems(optionId) {
  return (store[optionId] ?? []).map((row) => ({ ...row }));
}

export function replaceManagedDropdownItems(optionId, items) {
  if (!optionId) return;
  ensureManagedDropdownOption(optionId);
  store[optionId] = items.map((row) => ({ ...row }));
}

export function summarizeManagedDropdownItems(optionId) {
  const items = store[optionId] ?? [];
  let active = 0;
  let inactive = 0;
  items.forEach((row) => {
    if (row.active === false) inactive += 1;
    else active += 1;
  });
  return { active, inactive, total: items.length };
}
