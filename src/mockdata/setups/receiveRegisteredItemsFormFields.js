/** Catalog of fields for Receive Registered Items — one Main section. */

export const RECEIVE_REGISTERED_ITEMS_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Configure registered stock receipts. Locked fields stay on the receive form.",
    columns: 2,
  },
];

export const RECEIVE_REGISTERED_ITEMS_FORM_GROUPS = [];

export const RECEIVE_REGISTERED_ITEMS_FORM_FIELD_CATALOG = [
  {
    id: "rri_itemId",
    key: "itemId",
    title: "Registered item",
    fieldType: "search_select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "Search registered item",
  },
  {
    id: "rri_make",
    key: "make",
    title: "Make",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
  },
  {
    id: "rri_model",
    key: "model",
    title: "Model",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
  },
  {
    id: "rri_year",
    key: "year",
    title: "Year",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
  },
  {
    id: "rri_quantity",
    key: "quantity",
    title: "Quantity",
    fieldType: "number",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "e.g. 10",
  },
  {
    id: "rri_unitPrice",
    key: "unitPrice",
    title: "Unit price (GH₵)",
    fieldType: "number",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "e.g. 85.00",
  },
  {
    id: "rri_location",
    key: "location",
    title: "Store location",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "Select location",
  },
  {
    id: "rri_supplierId",
    key: "supplierId",
    title: "Supplier",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Select supplier",
  },
  {
    id: "rri_waybillNumber",
    key: "waybillNumber",
    title: "Waybill number",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "e.g. WB-2026-0041",
  },
  {
    id: "rri_deliveredByName",
    key: "deliveredByName",
    title: "Delivered by",
    fieldType: "text",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Full name",
  },
  {
    id: "rri_supplierPhone",
    key: "supplierPhone",
    title: "Supplier phone",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "e.g. +233 24 000 0000",
  },
  {
    id: "rri_supplierEmail",
    key: "supplierEmail",
    title: "Supplier email",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "e.g. receipts@supplier.com",
  },
  {
    id: "rri_condition",
    key: "condition",
    title: "Condition",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    options: [{"value": "GOOD", "label": "Good"}, {"value": "BAD", "label": "Bad"}, {"value": "BROKEN", "label": "Broken"}, {"value": "PARTIALLY_DAMAGED", "label": "Partially damaged"}, {"value": "DAMAGED", "label": "Damaged"}],
    placeholder: "Select condition",
  },
  {
    id: "rri_notes",
    key: "notes",
    title: "Notes",
    fieldType: "textarea",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "Optional notes",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  RECEIVE_REGISTERED_ITEMS_FORM_SECTIONS.map((section) => [
    section.id,
    RECEIVE_REGISTERED_ITEMS_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  RECEIVE_REGISTERED_ITEMS_FORM_SECTIONS.map((section) => [
    section.id,
    RECEIVE_REGISTERED_ITEMS_FORM_FIELD_CATALOG.filter(
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
