/** Catalog of fields for Leave Request — one Main section. */

export const LEAVE_REQUEST_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Configure the leave request form. Employee-derived fields stay locked.",
    columns: 2,
  },
];

export const LEAVE_REQUEST_FORM_GROUPS = [];

export const LEAVE_REQUEST_FORM_FIELD_CATALOG = [
  {
    id: "lrf_employeeId",
    key: "employeeId",
    title: "Employee",
    fieldType: "search_select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "Search employee",
  },
  {
    id: "lrf_department",
    key: "department",
    title: "Department",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
  },
  {
    id: "lrf_positionRole",
    key: "positionRole",
    title: "Position/Role",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
  },
  {
    id: "lrf_leaveType",
    key: "leaveType",
    title: "Leave Type",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Select leave type…",
  },
  {
    id: "lrf_startDate",
    key: "startDate",
    title: "Start Date",
    fieldType: "date",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
  },
  {
    id: "lrf_endDate",
    key: "endDate",
    title: "End Date",
    fieldType: "date",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
  },
  {
    id: "lrf_numberOfDays",
    key: "numberOfDays",
    title: "Number of Days",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
  },
  {
    id: "lrf_leaveYear",
    key: "leaveYear",
    title: "Leave Year",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
  },
  {
    id: "lrf_leaveBalance",
    key: "leaveBalance",
    title: "Leave Balance",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
  },
  {
    id: "lrf_expectedReturnDate",
    key: "expectedReturnDate",
    title: "Expected Return Date",
    fieldType: "date",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
  },
  {
    id: "lrf_reason",
    key: "reason",
    title: "Reason",
    fieldType: "textarea",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 2,
    placeholder: "Brief reason for this leave request",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  LEAVE_REQUEST_FORM_SECTIONS.map((section) => [
    section.id,
    LEAVE_REQUEST_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  LEAVE_REQUEST_FORM_SECTIONS.map((section) => [
    section.id,
    LEAVE_REQUEST_FORM_FIELD_CATALOG.filter(
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
