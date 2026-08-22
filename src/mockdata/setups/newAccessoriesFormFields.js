/** Catalog of fields for New Accessories (Unregistered) — one Main section. */

export const NEW_ACCESSORIES_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Configure new unregistered accessories. Locked fields stay on the inventory form.",
    columns: 2,
  },
];

export const NEW_ACCESSORIES_FORM_GROUPS = [];

export const NEW_ACCESSORIES_FORM_FIELD_CATALOG = [
  {
    id: "nac_itemCode",
    key: "itemCode",
    title: "Item code",
    fieldType: "text",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
  },
  {
    id: "nac_name",
    key: "name",
    title: "Item name",
    fieldType: "text",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "Accessory name",
  },
  {
    id: "nac_brand",
    key: "brand",
    title: "Brand",
    fieldType: "select",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Select brand",
  },
  {
    id: "nac_description",
    key: "description",
    title: "Description",
    fieldType: "textarea",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "Item description",
  },
  {
    id: "nac_quantity",
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
    id: "nac_unitPrice",
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
    id: "nac_location",
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
    id: "nac_supplierId",
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
    id: "nac_waybillNumber",
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
    id: "nac_deliveredByName",
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
    id: "nac_supplierPhone",
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
    id: "nac_supplierEmail",
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
    id: "nac_condition",
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
    id: "nac_notes",
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
  NEW_ACCESSORIES_FORM_SECTIONS.map((section) => [
    section.id,
    NEW_ACCESSORIES_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  NEW_ACCESSORIES_FORM_SECTIONS.map((section) => [
    section.id,
    NEW_ACCESSORIES_FORM_FIELD_CATALOG.filter(
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
