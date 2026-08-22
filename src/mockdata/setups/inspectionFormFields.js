/** Catalog of fields for vehicle inspection forms, grouped by section. */

export const INSPECTION_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main form",
    description: "System fields for starting an inspection. Add nested groups or custom leaves as needed.",
    columns: 1,
  },
];

const HALF = 1;
const FULL_2 = 2;
const FULL_3 = 3;

export const INSPECTION_FORM_FIELD_CATALOG = [
  {
    id: "if_vehicle",
    key: "vehicleId",
    title: "Vehicle",
    fieldType: "vehicle",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL_2,
    placeholder: "Select vehicle…",
  },
  {
    id: "if_operator",
    key: "operatorId",
    title: "Operator",
    fieldType: "operator",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL_2,
    placeholder: "Assigned from vehicle…",
  },
  {
    id: "if_template",
    key: "templateId",
    title: "Inspection type",
    fieldType: "inspection_template",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "Select inspection type…",
  },
  {
    id: "if_checklist",
    key: "checklist",
    title: "Checklist",
    fieldType: "inspection_checklist",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL_3,
    placeholder: "",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  INSPECTION_FORM_SECTIONS.map((section) => [
    section.id,
    INSPECTION_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  INSPECTION_FORM_SECTIONS.map((section) => [
    section.id,
    INSPECTION_FORM_FIELD_CATALOG.filter(
      (field) => field.sectionId === section.id && field.isDefaultLocked === true,
    ).map((field) => field.id),
  ]),
);

export function getLockedDefaultFieldIds(sectionId) {
  return LOCKED_DEFAULT_FIELD_IDS_BY_SECTION[sectionId] ?? [];
}

export function withLockedDefaultFields(visibleBySection = {}) {
  const next = { ...visibleBySection };
  for (const section of INSPECTION_FORM_SECTIONS) {
    const locked = getLockedDefaultFieldIds(section.id);
    const current = new Set(next[section.id] ?? []);
    locked.forEach((id) => current.add(id));
    next[section.id] = [...current];
  }
  return next;
}
