/** Catalog of fields for Vehicle Request — one Main section. */

export const VEHICLE_REQUEST_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Configure the vehicle request form.",
    columns: 1,
  },
];

export const VEHICLE_REQUEST_FORM_GROUPS = [];

export const VEHICLE_REQUEST_FORM_FIELD_CATALOG = [
  {
    id: "vreq_driverId",
    key: "driverId",
    title: "Driver",
    fieldType: "search_select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Search driver…",
  },
  {
    id: "vreq_vehicleId",
    key: "vehicleId",
    title: "Vehicle",
    fieldType: "search_select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Search vehicle…",
  },
  {
    id: "vreq_reason",
    key: "reason",
    title: "Reason",
    fieldType: "textarea",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Why this driver needs the vehicle…",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  VEHICLE_REQUEST_FORM_SECTIONS.map((section) => [
    section.id,
    VEHICLE_REQUEST_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  VEHICLE_REQUEST_FORM_SECTIONS.map((section) => [
    section.id,
    VEHICLE_REQUEST_FORM_FIELD_CATALOG.filter(
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
