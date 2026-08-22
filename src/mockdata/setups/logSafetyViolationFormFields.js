/** Catalog of fields for Log Safety Violation — one Main section. */

const FULL = 2;
const HALF = 1;

export const LOG_SAFETY_VIOLATION_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description:
      "Driver must be assigned to the vehicle — an assignment will be created automatically if needed.",
    columns: 2,
  },
];

/** No default subfolders — add nested groups under Main if needed. */
export const LOG_SAFETY_VIOLATION_FORM_GROUPS = [];

export const LOG_SAFETY_VIOLATION_FORM_FIELD_CATALOG = [
  {
    id: "lsv_driver",
    key: "driverId",
    title: "Driver",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "Select driver…",
    options: null,
  },
  {
    id: "lsv_vehicle",
    key: "vehicleId",
    title: "Vehicle",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "Select vehicle…",
    options: null,
  },
  {
    id: "lsv_infraction",
    key: "infractionType",
    title: "Infraction Type",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "",
    options: null,
    defaultValue: "SPEEDING",
  },
  {
    id: "lsv_severity",
    key: "severity",
    title: "Severity",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "",
    options: [
      { value: "CRITICAL", label: "Critical" },
      { value: "HIGH", label: "High" },
      { value: "MEDIUM", label: "Medium" },
      { value: "LOW", label: "Low" },
    ],
    defaultValue: "HIGH",
  },
  {
    id: "lsv_penalty",
    key: "proposedPenalty",
    title: "Proposed Penalty",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "e.g. Written Warning",
    maxLength: 80,
    defaultValue: "Written Warning",
  },
  {
    id: "lsv_notes",
    key: "notes",
    title: "Notes",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "Investigation notes…",
    maxLength: 500,
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  LOG_SAFETY_VIOLATION_FORM_SECTIONS.map((section) => [
    section.id,
    LOG_SAFETY_VIOLATION_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  LOG_SAFETY_VIOLATION_FORM_SECTIONS.map((section) => [
    section.id,
    LOG_SAFETY_VIOLATION_FORM_FIELD_CATALOG.filter(
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
