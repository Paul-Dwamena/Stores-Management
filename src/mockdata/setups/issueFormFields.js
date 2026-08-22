/** Catalog of fields for Report Issue forms, grouped by section. */

export const ISSUE_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main form",
    description: "System fields for reporting an issue. Add nested groups or custom leaves as needed.",
    columns: 2,
  },
];

const HALF = 1;
const FULL = 2;

export const ISSUE_FORM_FIELD_CATALOG = [
  {
    id: "iss_vehicle",
    key: "vehicleId",
    title: "Vehicle",
    fieldType: "vehicle",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "Search vehicle…",
  },
  {
    id: "iss_reporter_type",
    key: "reporterType",
    title: "Reporter Type",
    fieldType: "select",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "",
    options: [
      { value: "DRIVER", label: "Driver" },
      { value: "FLEET_MANAGER", label: "Fleet Manager" },
      { value: "TECHNICIAN", label: "Technician" },
      { value: "INSPECTOR", label: "Inspector" },
      { value: "OTHER", label: "Other" },
    ],
    defaultValue: "DRIVER",
  },
  {
    id: "iss_reporter",
    key: "reporter",
    title: "Reporter Name",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "",
  },
  {
    id: "iss_odometer",
    key: "odometerReading",
    title: "Odometer Reading (km)",
    fieldType: "number",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "0",
  },
  {
    id: "iss_drivable",
    key: "vehicleDrivable",
    title: "Vehicle drivable",
    fieldType: "vehicle_drivable",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "",
    description: "Can the vehicle still be driven safely?",
  },
  {
    id: "iss_component",
    key: "vehicleComponent",
    title: "Vehicle Component",
    fieldType: "vehicle_component",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "",
  },
  {
    id: "iss_issue_type",
    key: "issueType",
    title: "Issue Type",
    fieldType: "select",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "Select type…",
    options: null,
  },
  {
    id: "iss_priority",
    key: "priority",
    title: "Priority",
    fieldType: "select",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "",
    options: [
      { value: "HIGH", label: "High" },
      { value: "MEDIUM", label: "Medium" },
      { value: "LOW", label: "Low" },
    ],
    defaultValue: "MEDIUM",
  },
  {
    id: "iss_description",
    key: "description",
    title: "Description",
    fieldType: "textarea",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "Describe the issue…",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  ISSUE_FORM_SECTIONS.map((section) => [
    section.id,
    ISSUE_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  ISSUE_FORM_SECTIONS.map((section) => [
    section.id,
    ISSUE_FORM_FIELD_CATALOG.filter(
      (field) => field.sectionId === section.id && field.isDefaultLocked === true,
    ).map((field) => field.id),
  ]),
);

export function getLockedDefaultFieldIds(sectionId) {
  return LOCKED_DEFAULT_FIELD_IDS_BY_SECTION[sectionId] ?? [];
}

export function withLockedDefaultFields(visibleBySection = {}) {
  const next = { ...visibleBySection };
  for (const section of ISSUE_FORM_SECTIONS) {
    const locked = getLockedDefaultFieldIds(section.id);
    const current = new Set(next[section.id] ?? []);
    locked.forEach((id) => current.add(id));
    next[section.id] = [...current];
  }
  return next;
}
