/** Catalog of fields for Add Fuel Vendor — one Main section. */

export const ADD_FUEL_VENDOR_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Configure the add fuel vendor form.",
    columns: 2,
  },
];

export const ADD_FUEL_VENDOR_FORM_GROUPS = [];

export const ADD_FUEL_VENDOR_FORM_FIELD_CATALOG = [
  {
    id: "afv_name",
    key: "name",
    title: "Vendor name",
    fieldType: "text",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "e.g. Shell Accra Central",
  },
  {
    id: "afv_specialty",
    key: "specialty",
    title: "Specialty",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Select specialty",
  },
  {
    id: "afv_address",
    key: "address",
    title: "Address",
    fieldType: "text",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "e.g. Independence Ave, Accra",
  },
  {
    id: "afv_phone",
    key: "phone",
    title: "Phone",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "+233 30 000 0000",
  },
  {
    id: "afv_email",
    key: "email",
    title: "Email",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "fleet@vendor.gh",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  ADD_FUEL_VENDOR_FORM_SECTIONS.map((section) => [
    section.id,
    ADD_FUEL_VENDOR_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  ADD_FUEL_VENDOR_FORM_SECTIONS.map((section) => [
    section.id,
    ADD_FUEL_VENDOR_FORM_FIELD_CATALOG.filter(
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
