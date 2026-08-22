/** Catalog of fields for Approve Supply Request — one Main section. */

export const APPROVE_SUPPLY_REQUEST_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Configure request comment, approval comment, and extra fields on the approve supply modal.",
    columns: 1,
  },
];

export const APPROVE_SUPPLY_REQUEST_FORM_GROUPS = [];

export const APPROVE_SUPPLY_REQUEST_FORM_FIELD_CATALOG = [
  {
    id: "asr_requestComment",
    key: "requestComment",
    title: "Request comment",
    fieldType: "textarea",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
  },
  {
    id: "asr_approvalComment",
    key: "approvalComment",
    title: "Approval comment",
    fieldType: "textarea",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Add an approval comment",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  APPROVE_SUPPLY_REQUEST_FORM_SECTIONS.map((section) => [
    section.id,
    APPROVE_SUPPLY_REQUEST_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  APPROVE_SUPPLY_REQUEST_FORM_SECTIONS.map((section) => [
    section.id,
    APPROVE_SUPPLY_REQUEST_FORM_FIELD_CATALOG.filter(
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
