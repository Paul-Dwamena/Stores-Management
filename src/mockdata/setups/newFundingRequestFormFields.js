/** Catalog of fields for New Funding Request — one Main section. */

export const NEW_FUNDING_REQUEST_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Configure the funding request form.",
    columns: 2,
  },
];

export const NEW_FUNDING_REQUEST_FORM_GROUPS = [];

export const NEW_FUNDING_REQUEST_FORM_FIELD_CATALOG = [
  {
    id: "nfr_costCenterId",
    key: "costCenterId",
    title: "Cost center",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Select cost center",
  },
  {
    id: "nfr_budgetLineItemId",
    key: "budgetLineItemId",
    title: "Budget line item",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Select line item",
  },
  {
    id: "nfr_amount",
    key: "amount",
    title: "Amount (GHS)",
    fieldType: "number",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "e.g. 10000",
  },
  {
    id: "nfr_purposeId",
    key: "purposeId",
    title: "Purpose",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "Select purpose",
  },
  {
    id: "nfr_justification",
    key: "justification",
    title: "Justification",
    fieldType: "textarea",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "Explain why this funding is needed",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  NEW_FUNDING_REQUEST_FORM_SECTIONS.map((section) => [
    section.id,
    NEW_FUNDING_REQUEST_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  NEW_FUNDING_REQUEST_FORM_SECTIONS.map((section) => [
    section.id,
    NEW_FUNDING_REQUEST_FORM_FIELD_CATALOG.filter(
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
