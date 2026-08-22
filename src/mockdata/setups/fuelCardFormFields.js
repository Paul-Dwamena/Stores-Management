/** Catalog of fields for Link Fuel Card forms, grouped by section. */

export const FUEL_CARD_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main form",
    description:
      "System fields for linking a fuel card. Add nested groups or custom leaves as needed.",
    columns: 2,
  },
];

const HALF = 1;
const FULL = 2;

export const FUEL_CARD_FORM_FIELD_CATALOG = [
  {
    id: "fuelcard_vendor",
    key: "vendorId",
    title: "Vendor",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "Search vendors…",
    options: null,
    description: "Select the fuel vendor that issued the card.",
  },
  {
    id: "fuelcard_number",
    key: "number",
    title: "Card number",
    fieldType: "text",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "",
  },
  {
    id: "fuelcard_vehicle",
    key: "vehicleId",
    title: "Assign vehicle",
    fieldType: "select",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "Any vehicle",
    options: null,
  },
  {
    id: "fuelcard_driver",
    key: "driverId",
    title: "Assign driver",
    fieldType: "select",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "Any driver",
    options: null,
  },
  {
    id: "fuelcard_limit",
    key: "limit",
    title: "Monthly limit (GH₵)",
    fieldType: "number",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  FUEL_CARD_FORM_SECTIONS.map((section) => [
    section.id,
    FUEL_CARD_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  FUEL_CARD_FORM_SECTIONS.map((section) => [
    section.id,
    FUEL_CARD_FORM_FIELD_CATALOG.filter(
      (field) => field.sectionId === section.id && field.isDefaultLocked === true,
    ).map((field) => field.id),
  ]),
);

export function getLockedDefaultFieldIds(sectionId) {
  return LOCKED_DEFAULT_FIELD_IDS_BY_SECTION[sectionId] ?? [];
}

export function withLockedDefaultFields(visibleBySection = {}) {
  const next = { ...visibleBySection };
  for (const section of FUEL_CARD_FORM_SECTIONS) {
    const locked = getLockedDefaultFieldIds(section.id);
    const current = new Set(next[section.id] ?? []);
    locked.forEach((id) => current.add(id));
    next[section.id] = [...current];
  }
  return next;
}
