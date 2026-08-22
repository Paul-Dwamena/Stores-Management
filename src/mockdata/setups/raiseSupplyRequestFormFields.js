/** Catalog of fields for Raise Supply Request — one Main section. */

export const RAISE_SUPPLY_REQUEST_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Configure store allocation fields on the raise supply modal.",
    columns: 1,
  },
];

export const RAISE_SUPPLY_REQUEST_FORM_GROUPS = [];

export const RAISE_SUPPLY_REQUEST_FORM_FIELD_CATALOG = [
  {
    id: "rsq_storeLocations",
    key: "storeLocations",
    title: "Store locations",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Select store locations",
  },
  {
    id: "rsq_comment",
    key: "comment",
    title: "Comment",
    fieldType: "textarea",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Add a supply request comment…",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  RAISE_SUPPLY_REQUEST_FORM_SECTIONS.map((section) => [
    section.id,
    RAISE_SUPPLY_REQUEST_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  RAISE_SUPPLY_REQUEST_FORM_SECTIONS.map((section) => [
    section.id,
    RAISE_SUPPLY_REQUEST_FORM_FIELD_CATALOG.filter(
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
