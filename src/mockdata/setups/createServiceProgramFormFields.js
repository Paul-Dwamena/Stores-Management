/** Catalog of fields for Create Service Program — one Main section. */

export const CREATE_SERVICE_PROGRAM_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Configure the create service program form.",
    columns: 2,
  },
];

export const CREATE_SERVICE_PROGRAM_FORM_GROUPS = [];

export const CREATE_SERVICE_PROGRAM_FORM_FIELD_CATALOG = [
  {
    id: "csp_name",
    key: "name",
    title: "Program Name",
    fieldType: "text",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "e.g. Heavy Duty PM A (Oil & Lube)",
  },
  {
    id: "csp_description",
    key: "description",
    title: "Description",
    fieldType: "textarea",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "Standard preventative maintenance",
  },
  {
    id: "csp_mileageInterval",
    key: "mileageInterval",
    title: "Mileage Interval (km)",
    fieldType: "number",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "e.g. 5000",
  },
  {
    id: "csp_serviceAction",
    key: "serviceAction",
    title: "Service Action",
    fieldType: "text",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "e.g. Oil Change",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  CREATE_SERVICE_PROGRAM_FORM_SECTIONS.map((section) => [
    section.id,
    CREATE_SERVICE_PROGRAM_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  CREATE_SERVICE_PROGRAM_FORM_SECTIONS.map((section) => [
    section.id,
    CREATE_SERVICE_PROGRAM_FORM_FIELD_CATALOG.filter(
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
