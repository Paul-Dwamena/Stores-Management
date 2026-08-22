/** Catalog of fields for Issue Item — one Main section. */

export const ISSUE_ITEM_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Configure issue-from-store fields. OTP confirmation stays on the modal.",
    columns: 2,
  },
];

export const ISSUE_ITEM_FORM_GROUPS = [];

export const ISSUE_ITEM_FORM_FIELD_CATALOG = [
  {
    id: "isi_issueStore",
    key: "issueStore",
    title: "Issue from",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Select store",
  },
  {
    id: "isi_itemState",
    key: "itemState",
    title: "Item state",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
  },
  {
    id: "isi_remainingQuantity",
    key: "remainingQuantity",
    title: "Quantity remaining",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
  },
  {
    id: "isi_quantityToIssue",
    key: "quantityToIssue",
    title: "Quantity to issue",
    fieldType: "number",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
  },
  {
    id: "isi_suppliedTo",
    key: "suppliedTo",
    title: "Receiver",
    fieldType: "search_select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "Select receiver",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  ISSUE_ITEM_FORM_SECTIONS.map((section) => [
    section.id,
    ISSUE_ITEM_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  ISSUE_ITEM_FORM_SECTIONS.map((section) => [
    section.id,
    ISSUE_ITEM_FORM_FIELD_CATALOG.filter(
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
