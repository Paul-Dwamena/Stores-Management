/** Catalog of fields for Add Warranty — one Main section. */

export const ADD_WARRANTY_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Configure the create warranty form.",
    columns: 2,
  },
];

export const ADD_WARRANTY_FORM_GROUPS = [];

export const ADD_WARRANTY_FORM_FIELD_CATALOG = [
  {
    id: "awr_vehicleId",
    key: "vehicleId",
    title: "Vehicle",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "Select vehicle…",
  },
  {
    id: "awr_warrantyType",
    key: "warrantyType",
    title: "Warranty type",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    options: [{"value": "standard", "label": "Standard Warranty"}, {"value": "extended", "label": "Extended Warranty"}],
  },
  {
    id: "awr_title",
    key: "title",
    title: "Warranty Title",
    fieldType: "text",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "e.g. Factory Bumper-to-Bumper",
  },
  {
    id: "awr_details",
    key: "details",
    title: "Details & Terms",
    fieldType: "textarea",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "Outline key inclusions and exclusions...",
  },
  {
    id: "awr_provider",
    key: "provider",
    title: "Provider / OEM",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
  },
  {
    id: "awr_vendor",
    key: "vendor",
    title: "Servicing Vendor",
    fieldType: "select",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Select certified vendor",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  ADD_WARRANTY_FORM_SECTIONS.map((section) => [
    section.id,
    ADD_WARRANTY_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  ADD_WARRANTY_FORM_SECTIONS.map((section) => [
    section.id,
    ADD_WARRANTY_FORM_FIELD_CATALOG.filter(
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
