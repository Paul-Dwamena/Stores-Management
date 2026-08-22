/** Catalog of fields for Create Budget — one Main section. */

export const CREATE_BUDGET_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Configure the create budget form. Locked fields stay required.",
    columns: 2,
  },
];

export const CREATE_BUDGET_FORM_GROUPS = [];

export const CREATE_BUDGET_FORM_FIELD_CATALOG = [
  {
    id: "cbg_costCenterId",
    key: "costCenterId",
    title: "Cost center",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "Select cost center",
  },
  {
    id: "cbg_budgetLineItemId",
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
    id: "cbg_period",
    key: "period",
    title: "Budget period",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
  },
  {
    id: "cbg_classId",
    key: "classId",
    title: "Class",
    fieldType: "select",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Select class (optional)",
  },
  {
    id: "cbg_expenseCategoryId",
    key: "expenseCategoryId",
    title: "Expense category",
    fieldType: "select",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Select category (optional)",
  },
  {
    id: "cbg_amount",
    key: "amount",
    title: "Amount (GHS)",
    fieldType: "number",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "e.g. 50000",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  CREATE_BUDGET_FORM_SECTIONS.map((section) => [
    section.id,
    CREATE_BUDGET_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  CREATE_BUDGET_FORM_SECTIONS.map((section) => [
    section.id,
    CREATE_BUDGET_FORM_FIELD_CATALOG.filter(
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
