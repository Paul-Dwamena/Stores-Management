/** Catalog of fields for Add Insurance Cover forms, grouped by section. */

export const INSURANCE_COVER_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main form",
    description:
      "System fields for adding an insurance cover. Add nested groups or custom leaves as needed.",
    columns: 2,
  },
];

const HALF = 1;
const FULL = 2;

export const INSURANCE_COVER_FORM_FIELD_CATALOG = [
  {
    id: "inscover_vehicle",
    key: "vehicleId",
    title: "Vehicle",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "Select vehicle…",
    options: null,
    description: "Fleet vehicle this cover applies to.",
  },
  {
    id: "inscover_insurer",
    key: "insurer",
    title: "Insurance company",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "Select insurer…",
    options: null,
    description: "Insurer that issued the policy.",
  },
  {
    id: "inscover_policy_number",
    key: "policyNumber",
    title: "Policy number",
    fieldType: "text",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "e.g. POL-88210",
  },
  {
    id: "inscover_policy_type",
    key: "policyType",
    title: "Policy type",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "",
    defaultValue: "Comprehensive",
    options: null,
  },
  {
    id: "inscover_sum_insured",
    key: "sumInsured",
    title: "Sum insured",
    fieldType: "number",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "",
    description: "Disabled automatically when policy type is Third Party Only.",
  },
  {
    id: "inscover_premium",
    key: "premium",
    title: "Premium",
    fieldType: "number",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "",
  },
  {
    id: "inscover_start_date",
    key: "startDate",
    title: "Start date",
    fieldType: "date",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "",
  },
  {
    id: "inscover_end_date",
    key: "endDate",
    title: "End / expiry date",
    fieldType: "date",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  INSURANCE_COVER_FORM_SECTIONS.map((section) => [
    section.id,
    INSURANCE_COVER_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  INSURANCE_COVER_FORM_SECTIONS.map((section) => [
    section.id,
    INSURANCE_COVER_FORM_FIELD_CATALOG.filter(
      (field) => field.sectionId === section.id && field.isDefaultLocked === true,
    ).map((field) => field.id),
  ]),
);

export function getLockedDefaultFieldIds(sectionId) {
  return LOCKED_DEFAULT_FIELD_IDS_BY_SECTION[sectionId] ?? [];
}

export function withLockedDefaultFields(visibleBySection = {}) {
  const next = { ...visibleBySection };
  for (const section of INSURANCE_COVER_FORM_SECTIONS) {
    const locked = getLockedDefaultFieldIds(section.id);
    const current = new Set(next[section.id] ?? []);
    locked.forEach((id) => current.add(id));
    next[section.id] = [...current];
  }
  return next;
}
