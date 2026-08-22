/** Catalog of fields for Quick Add Vehicle — one Main section. */

const FULL = 2;
const HALF = 1;

export const QUICK_ADD_VEHICLE_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Quickly add a vehicle with catalog make, model, body type, and trim.",
    columns: 2,
  },
];

/** No default subfolders — add nested groups under Main if needed. */
export const QUICK_ADD_VEHICLE_FORM_GROUPS = [];

export const QUICK_ADD_VEHICLE_FORM_FIELD_CATALOG = [
  {
    id: "qav_vin",
    key: "vin",
    title: "VIN (Vehicle Identification Number)",
    fieldType: "text",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    isPositionLocked: true,
    colSpan: FULL,
    placeholder: "e.g. 1FUBGADV8CLBJ9848",
  },
  {
    id: "qav_make",
    key: "makeId",
    title: "Make",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    isPositionLocked: true,
    colSpan: HALF,
    options: [],
    placeholder: "Select make…",
  },
  {
    id: "qav_model",
    key: "modelId",
    title: "Model",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    isPositionLocked: true,
    colSpan: HALF,
    options: [],
    placeholder: "Select model…",
  },
  {
    id: "qav_body_type",
    key: "bodyTypeId",
    title: "Body type",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    options: [],
    placeholder: "Select body type…",
  },
  {
    id: "qav_trim",
    key: "trimId",
    title: "Trim",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    options: [],
    placeholder: "Select trim…",
  },
  {
    id: "qav_name",
    key: "name",
    title: "Vehicle name",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    isPositionLocked: true,
    colSpan: FULL,
    placeholder: "Auto-filled from make + model",
    description: "Filled automatically from the selected make and model.",
  },
  {
    id: "qav_license_plate",
    key: "licensePlate",
    title: "License plate",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: false,
    isActive: true,
    colSpan: FULL,
    placeholder: "e.g. ABC-1234",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  QUICK_ADD_VEHICLE_FORM_SECTIONS.map((section) => [
    section.id,
    QUICK_ADD_VEHICLE_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  QUICK_ADD_VEHICLE_FORM_SECTIONS.map((section) => [
    section.id,
    QUICK_ADD_VEHICLE_FORM_FIELD_CATALOG.filter(
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
