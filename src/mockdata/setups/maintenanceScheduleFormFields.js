/** Catalog of fields for Create Maintenance Schedule — one Main section. */

const FULL = 2;
const HALF = 1;

export const MAINTENANCE_SCHEDULE_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Create an adhoc or program-based maintenance schedule with mileage or period triggers.",
    columns: 2,
  },
];

/** No default subfolders — add nested groups under Main if needed. */
export const MAINTENANCE_SCHEDULE_FORM_GROUPS = [];

export const MAINTENANCE_SCHEDULE_TYPES = [
  { value: "ADHOC", label: "Adhoc" },
  { value: "SERVICE_PROGRAM", label: "Service Program" },
];

export const MAINTENANCE_SCHEDULE_TRIGGER_TYPES = [
  { value: "MILEAGE", label: "Mileage" },
  { value: "PERIOD", label: "Period" },
];

export const MAINTENANCE_SCHEDULE_PERIOD_MODES = [
  { value: "DATE", label: "Specific Date" },
  { value: "INTERVAL", label: "Days / Weeks / Months" },
];

export const MAINTENANCE_SCHEDULE_PERIOD_UNITS = [
  { value: "DAYS", label: "Days" },
  { value: "WEEKS", label: "Weeks" },
  { value: "MONTHS", label: "Months" },
];

export const MAINTENANCE_SCHEDULE_PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

export const MAINTENANCE_SCHEDULE_FORM_FIELD_CATALOG = [
  {
    id: "msf_vehicle",
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
  },
  {
    id: "msf_assigned_driver",
    key: "assignedDriver",
    title: "Assigned Driver",
    fieldType: "assigned_driver",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    description: "Shows the driver currently assigned to the selected vehicle.",
  },
  {
    id: "msf_maintenance_type",
    key: "maintenanceType",
    title: "Maintenance Type",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    options: [...MAINTENANCE_SCHEDULE_TYPES],
    defaultValue: "ADHOC",
  },
  {
    id: "msf_task_name",
    key: "taskName",
    title: "Maintenance Task",
    fieldType: "text",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "e.g. Oil change, brake inspection",
    minLength: 2,
    maxLength: 80,
    description: "Shown when Maintenance Type is Adhoc.",
  },
  {
    id: "msf_service_program",
    key: "serviceProgramId",
    title: "Service Program",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "Select program…",
    options: null,
    description: "Shown when Maintenance Type is Service Program.",
  },
  {
    id: "msf_trigger_type",
    key: "triggerType",
    title: "Trigger Type",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    options: [...MAINTENANCE_SCHEDULE_TRIGGER_TYPES],
    defaultValue: "MILEAGE",
    description: "Shown for Adhoc schedules.",
  },
  {
    id: "msf_mileage_value",
    key: "mileageValue",
    title: "Mileage Value (km)",
    fieldType: "number",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "e.g. 10000",
    description: "Shown when Trigger Type is Mileage.",
  },
  {
    id: "msf_period_mode",
    key: "periodMode",
    title: "Period Mode",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    options: [...MAINTENANCE_SCHEDULE_PERIOD_MODES],
    defaultValue: "DATE",
    description: "Shown when Trigger Type is Period.",
  },
  {
    id: "msf_due_date",
    key: "dueDate",
    title: "Due Date",
    fieldType: "date",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    description: "Shown when Period Mode is Specific Date.",
  },
  {
    id: "msf_period_value",
    key: "periodValue",
    title: "Value",
    fieldType: "number",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "e.g. 4",
    description: "Shown with Unit when Period Mode is Days / Weeks / Months.",
  },
  {
    id: "msf_period_unit",
    key: "periodUnit",
    title: "Unit",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    options: [...MAINTENANCE_SCHEDULE_PERIOD_UNITS],
    defaultValue: "WEEKS",
  },
  {
    id: "msf_priority",
    key: "priority",
    title: "Priority",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    options: [...MAINTENANCE_SCHEDULE_PRIORITIES],
    defaultValue: "MEDIUM",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  MAINTENANCE_SCHEDULE_FORM_SECTIONS.map((section) => [
    section.id,
    MAINTENANCE_SCHEDULE_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  MAINTENANCE_SCHEDULE_FORM_SECTIONS.map((section) => [
    section.id,
    MAINTENANCE_SCHEDULE_FORM_FIELD_CATALOG.filter(
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
