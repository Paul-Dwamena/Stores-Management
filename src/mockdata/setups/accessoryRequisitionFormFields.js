/** Catalog of fields for Accessory / Parts Requisition — one Main section. */

export const ACCESSORY_REQUISITION_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description:
      "Configure Request from Stores fields. Category and Number of items appear on the first step; item fields follow.",
    columns: 2,
  },
];

export const ACCESSORY_REQUISITION_FORM_GROUPS = [];

export const ACCESSORY_REQUISITION_FORM_FIELD_CATALOG = [
  {
    id: "arq_category",
    key: "category",
    title: "Category",
    fieldType: "radio",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isPositionLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "",
    options: [
      { value: "accessories", label: "Accessories" },
      { value: "vehicle_parts", label: "Vehicle parts" },
    ],
    description: "First-step choice: accessories or vehicle parts.",
  },
  {
    id: "arq_quantityMode",
    key: "quantityMode",
    title: "Number of items",
    fieldType: "radio",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isPositionLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "",
    options: [
      { value: "single", label: "Single" },
      { value: "multiple", label: "Multiple" },
    ],
    description: "First-step choice: single item or multiple items.",
  },
  {
    id: "arq_itemId",
    key: "itemId",
    title: "Item",
    fieldType: "search_select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "Search item",
  },
  {
    id: "arq_quantity",
    key: "quantity",
    title: "Quantity",
    fieldType: "number",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "e.g. 2",
  },
  {
    id: "arq_justification",
    key: "justification",
    title: "Justification",
    fieldType: "textarea",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "Why this item is needed",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  ACCESSORY_REQUISITION_FORM_SECTIONS.map((section) => [
    section.id,
    ACCESSORY_REQUISITION_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  ACCESSORY_REQUISITION_FORM_SECTIONS.map((section) => [
    section.id,
    ACCESSORY_REQUISITION_FORM_FIELD_CATALOG.filter(
      (field) => field.sectionId === section.id && field.isDefaultLocked === true,
    ).map((field) => field.id),
  ]),
);

export function getLockedDefaultFieldIds(sectionId) {
  return LOCKED_DEFAULT_FIELD_IDS_BY_SECTION[sectionId] ?? [];
}

export function withLockedDefaultFields(visibleBySection = {}) {
  const next = { ...visibleBySection };
  Object.entries(LOCKED_DEFAULT_FIELD_IDS_BY_SECTION).forEach(([sectionId, lockedIds]) => {
    const current = new Set(next[sectionId] ?? []);
    lockedIds.forEach((id) => current.add(id));
    next[sectionId] = [...current];
  });
  return next;
}
