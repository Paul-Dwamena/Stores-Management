/** Catalog of fields for Schedule Training — one Main section. */

const FULL = 2;
const HALF = 1;

export const SCHEDULE_TRAINING_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Schedule a training session for a driver.",
    columns: 2,
  },
];

/** No default subfolders — add nested groups under Main if needed. */
export const SCHEDULE_TRAINING_FORM_GROUPS = [];

export const SCHEDULE_TRAINING_FORM_FIELD_CATALOG = [
  {
    id: "stf_driver",
    key: "driverId",
    title: "Driver",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "Select driver…",
    options: null,
  },
  {
    id: "stf_name",
    key: "name",
    title: "Training Name",
    fieldType: "text",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "e.g. Hazmat Endorsement",
    minLength: 2,
    maxLength: 80,
  },
  {
    id: "stf_scheduled_date",
    key: "scheduledDate",
    title: "Scheduled Date",
    fieldType: "date",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
  },
  {
    id: "stf_location",
    key: "location",
    title: "Location",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "Accra",
    maxLength: 80,
  },
  {
    id: "stf_instructor",
    key: "instructor",
    title: "Instructor / Assessor",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "e.g. SafeFleet Inc.",
    maxLength: 80,
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  SCHEDULE_TRAINING_FORM_SECTIONS.map((section) => [
    section.id,
    SCHEDULE_TRAINING_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  SCHEDULE_TRAINING_FORM_SECTIONS.map((section) => [
    section.id,
    SCHEDULE_TRAINING_FORM_FIELD_CATALOG.filter(
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
