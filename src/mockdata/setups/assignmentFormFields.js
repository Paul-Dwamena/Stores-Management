/** Catalog of fields for vehicle–driver assignment forms, grouped by section. */

export const ASSIGNMENT_FORM_SECTIONS = [
  {
    id: "driver",
    label: "Driver",
    description: "Driver selected for the assignment.",
    columns: 2,
  },
  {
    id: "vehicle",
    label: "Vehicle",
    description: "Vehicle allocated to the driver.",
    columns: 2,
  },
  {
    id: "location_assignment_type",
    label: "Location & assignment type",
    description: "Organisation location, assignment type, and effective dates.",
    columns: 3,
  },
  {
    id: "duties",
    label: "Duties",
    description: "Duties assigned with this vehicle allocation.",
    columns: 3,
  },
  {
    id: "others",
    label: "Others",
    description: "Any other details that do not fit in the sections above.",
    columns: 3,
  },
];

const HALF = 1;
/** Full-width within a 2-column section (Driver / Vehicle). */
const FULL_2 = 2;
/** Full-width within a 3-column section (Location / Duties / Others). */
const FULL_3 = 3;

export const ASSIGNMENT_FORM_FIELD_CATALOG = [
  // —— Driver ——
  {
    id: "af_driver",
    key: "driverId",
    title: "Driver",
    fieldType: "driver",
    sectionId: "driver",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL_2,
    placeholder: "Search by name, email, or employee ID…",
  },

  // —— Vehicle ——
  {
    id: "af_vehicle",
    key: "vehicleId",
    title: "Vehicle",
    fieldType: "vehicle",
    sectionId: "vehicle",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL_2,
    placeholder: "Select vehicle…",
  },

  // —— Location & assignment type ——
  {
    id: "af_division",
    key: "division",
    title: "Division / Department",
    fieldType: "select",
    sectionId: "location_assignment_type",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "Select…",
    options: null,
  },
  {
    id: "af_region",
    key: "region",
    title: "Region",
    fieldType: "region",
    sectionId: "location_assignment_type",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "Select…",
  },
  {
    id: "af_branch",
    key: "branch",
    title: "Branch / Workgroup",
    fieldType: "select",
    sectionId: "location_assignment_type",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "Select…",
    options: null,
  },
  {
    id: "af_assignment_type",
    key: "assignmentType",
    title: "Assignment type",
    fieldType: "select",
    sectionId: "location_assignment_type",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "",
    options: [
      { value: "PRIMARY", label: "Primary" },
      { value: "SECONDARY", label: "Secondary" },
    ],
    defaultValue: "PRIMARY",
  },
  {
    id: "af_effective_date",
    key: "effectiveDate",
    title: "Effective date",
    fieldType: "date",
    sectionId: "location_assignment_type",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "",
  },
  {
    id: "af_end_date",
    key: "endDate",
    title: "End date",
    fieldType: "date",
    sectionId: "location_assignment_type",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "",
  },

  // —— Duties ——
  {
    id: "af_duties",
    key: "duties",
    title: "Duties",
    fieldType: "duties",
    sectionId: "duties",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL_3,
    placeholder: "",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  ASSIGNMENT_FORM_SECTIONS.map((section) => [
    section.id,
    ASSIGNMENT_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  ASSIGNMENT_FORM_SECTIONS.map((section) => [
    section.id,
    ASSIGNMENT_FORM_FIELD_CATALOG.filter(
      (field) => field.sectionId === section.id && field.isDefaultLocked === true,
    ).map((field) => field.id),
  ]),
);

export function getLockedDefaultFieldIds(sectionId) {
  return LOCKED_DEFAULT_FIELD_IDS_BY_SECTION[sectionId] ?? [];
}

export function withLockedDefaultFields(visibleBySection = {}) {
  const next = { ...visibleBySection };
  for (const section of ASSIGNMENT_FORM_SECTIONS) {
    const locked = getLockedDefaultFieldIds(section.id);
    const current = new Set(next[section.id] ?? []);
    locked.forEach((id) => current.add(id));
    next[section.id] = [...current];
  }
  return next;
}
