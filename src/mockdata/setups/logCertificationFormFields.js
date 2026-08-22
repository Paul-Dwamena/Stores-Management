/** Catalog of fields for Log Certification — one Main section. */

const FULL = 2;
const HALF = 1;

export const LOG_CERTIFICATION_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Record a new certification for a driver.",
    columns: 2,
  },
];

/** No default subfolders — add nested groups under Main if needed. */
export const LOG_CERTIFICATION_FORM_GROUPS = [];

export const LOG_CERTIFICATION_FORM_FIELD_CATALOG = [
  {
    id: "lcf_driver",
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
    id: "lcf_name",
    key: "name",
    title: "Certification Name",
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
    id: "lcf_issue_date",
    key: "issueDate",
    title: "Issue Date",
    fieldType: "date",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
  },
  {
    id: "lcf_expiry_date",
    key: "expiryDate",
    title: "Expiry Date",
    fieldType: "date",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    description: "Optional. Leave blank if the certification does not expire.",
  },
  {
    id: "lcf_instructor",
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
  LOG_CERTIFICATION_FORM_SECTIONS.map((section) => [
    section.id,
    LOG_CERTIFICATION_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  LOG_CERTIFICATION_FORM_SECTIONS.map((section) => [
    section.id,
    LOG_CERTIFICATION_FORM_FIELD_CATALOG.filter(
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
