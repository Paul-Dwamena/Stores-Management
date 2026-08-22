/** Catalog of fields for Submit Store Receipt — one Main section. */

export const SUBMIT_STORE_RECEIPT_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Configure submit-store-receipt fields. Locked fields stay on the receipt modal.",
    columns: 2,
  },
];

export const SUBMIT_STORE_RECEIPT_FORM_GROUPS = [];

export const SUBMIT_STORE_RECEIPT_FORM_FIELD_CATALOG = [
  {
    id: "ssr_quantity",
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
    id: "ssr_unitCost",
    key: "unitCost",
    title: "Unit cost (GH₵)",
    fieldType: "number",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "e.g. 85.00",
  },
  {
    id: "ssr_location",
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
    id: "ssr_supplierId",
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
    id: "ssr_waybillNumber",
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
    id: "ssr_deliveredByName",
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
    id: "ssr_supplierPhone",
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
    id: "ssr_supplierEmail",
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
    id: "ssr_condition",
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
    id: "ssr_notes",
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
  SUBMIT_STORE_RECEIPT_FORM_SECTIONS.map((section) => [
    section.id,
    SUBMIT_STORE_RECEIPT_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  SUBMIT_STORE_RECEIPT_FORM_SECTIONS.map((section) => [
    section.id,
    SUBMIT_STORE_RECEIPT_FORM_FIELD_CATALOG.filter(
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
