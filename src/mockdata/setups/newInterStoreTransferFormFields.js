/** Catalog of fields for New Inter-store Transfer — one Main section. */

export const NEW_INTER_STORE_TRANSFER_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Configure transfer header fields. The item lines table always remains on the form.",
    columns: 1,
  },
];

export const NEW_INTER_STORE_TRANSFER_FORM_GROUPS = [];

export const NEW_INTER_STORE_TRANSFER_FORM_FIELD_CATALOG = [
  {
    id: "ist_fromStore",
    key: "fromStore",
    title: "From store",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Select originating store",
  },
  {
    id: "ist_notes",
    key: "notes",
    title: "Notes",
    fieldType: "textarea",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Why is this stock moving between stores?",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  NEW_INTER_STORE_TRANSFER_FORM_SECTIONS.map((section) => [
    section.id,
    NEW_INTER_STORE_TRANSFER_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  NEW_INTER_STORE_TRANSFER_FORM_SECTIONS.map((section) => [
    section.id,
    NEW_INTER_STORE_TRANSFER_FORM_FIELD_CATALOG.filter(
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
