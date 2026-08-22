/** Catalog of fields for New Spending Request — one Main section. */

export const NEW_SPENDING_REQUEST_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Configure the spending request form.",
    columns: 2,
  },
];

export const NEW_SPENDING_REQUEST_FORM_GROUPS = [];

export const NEW_SPENDING_REQUEST_FORM_FIELD_CATALOG = [
  {
    id: "nsr_costCenterId",
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
    id: "nsr_expenseCategoryId",
    key: "expenseCategoryId",
    title: "Expense category",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Select category",
  },
  {
    id: "nsr_fundingRequestId",
    key: "fundingRequestId",
    title: "Funding request",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "Select funding request",
  },
  {
    id: "nsr_amount",
    key: "amount",
    title: "Amount (GHS)",
    fieldType: "number",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
  },
  {
    id: "nsr_purposeId",
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
    id: "nsr_justification",
    key: "justification",
    title: "Justification",
    fieldType: "textarea",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "Explain this spend",
  },
  {
    id: "nsr_payeeId",
    key: "payeeId",
    title: "Payee",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Select payee",
  },
  {
    id: "nsr_payeeAccountId",
    key: "payeeAccountId",
    title: "Payee account",
    fieldType: "select",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Select account",
  },
  {
    id: "nsr_driverIds",
    key: "driverIds",
    title: "Driver(s)",
    fieldType: "select",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Select driver(s) — optional",
  },
  {
    id: "nsr_vehicleIds",
    key: "vehicleIds",
    title: "Vehicle(s)",
    fieldType: "select",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Select vehicle(s) — optional",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  NEW_SPENDING_REQUEST_FORM_SECTIONS.map((section) => [
    section.id,
    NEW_SPENDING_REQUEST_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  NEW_SPENDING_REQUEST_FORM_SECTIONS.map((section) => [
    section.id,
    NEW_SPENDING_REQUEST_FORM_FIELD_CATALOG.filter(
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
