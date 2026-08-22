/** Catalog of fields available on Start Trip / End Trip forms, grouped by section. */

import { VEHICLE_COMPONENT_TREE } from "../maintenance/vehicleComponentTree";

export const TRIP_FORM_SECTIONS = [
  {
    id: "start_trip",
    label: "Start Trip",
    description: "Fields collected when a driver starts a trip.",
  },
  {
    id: "end_trip",
    label: "End Trip",
    description: "Fields collected when a driver ends a trip.",
  },
];

/** Half-width on the 2-column trip modal grid; everything else is full width. */
const HALF = 1;
const FULL = 2;

export const VEHICLE_CONDITION_GROUP_ID = "vehicle_condition";

export const VEHICLE_CONDITION_PASS_FAIL_OPTIONS = [
  { value: "pass", label: "Pass" },
  { value: "fail", label: "Fail" },
];

function slugifyPart(name = "") {
  return String(name)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function vehicleConditionParts() {
  return [...new Set(VEHICLE_COMPONENT_TREE.map((row) => row.level1).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }),
  );
}

function vehicleConditionCatalogFields(sectionId) {
  const prefix = sectionId === "start_trip" ? "start" : "end";
  const idPrefix = sectionId === "start_trip" ? "tf_start_vc" : "tf_end_vc";
  return vehicleConditionParts().map((part) => ({
    id: `${idPrefix}_${slugifyPart(part)}`,
    key: `${prefix}_${slugifyPart(part)}`,
    title: part,
    fieldType: "radio",
    sectionId,
    groupId: VEHICLE_CONDITION_GROUP_ID,
    required: true,
    isDefaultLocked: false,
    isActive: true,
    colSpan: FULL,
    placeholder: "",
    options: VEHICLE_CONDITION_PASS_FAIL_OPTIONS,
    optionsSource: "manual",
  }));
}

export const TRIP_FORM_GROUPS = [
  {
    id: VEHICLE_CONDITION_GROUP_ID,
    sectionId: "start_trip",
    label: "Vehicle Condition",
    description: "Rate each item as Pass or Fail before starting the trip.",
    columns: 1,
  },
  {
    id: VEHICLE_CONDITION_GROUP_ID,
    sectionId: "end_trip",
    label: "Vehicle Condition",
    description: "Rate each item as Pass or Fail before completing the trip.",
    columns: 1,
  },
];

export const TRIP_FORM_FIELD_CATALOG = [
  // —— Start Trip ——
  {
    id: "tf_start_driver",
    key: "driverId",
    title: "Driver",
    fieldType: "driver",
    sectionId: "start_trip",
    required: true,
    isDefaultLocked: true,
    isPositionLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "Search by name, email, or employee ID…",
  },
  {
    id: "tf_start_date",
    key: "date",
    title: "Start Date & Time",
    fieldType: "datetime",
    sectionId: "start_trip",
    required: true,
    isDefaultLocked: true,
    isPositionLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "",
  },
  {
    id: "tf_start_vehicle",
    key: "vehicleId",
    title: "Assigned Vehicle",
    fieldType: "vehicle",
    sectionId: "start_trip",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "",
  },
  {
    id: "tf_start_odometer",
    key: "odometer",
    title: "Odometer Reading (km)",
    fieldType: "number",
    sectionId: "start_trip",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "Auto-filled from assigned vehicle",
  },
  {
    id: "tf_start_location",
    key: "startLocation",
    title: "Start Location",
    fieldType: "location",
    sectionId: "start_trip",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "Capture via GPS or enter manually",
  },
  {
    id: "tf_proposed_end_location",
    key: "proposedEndLocation",
    title: "Proposed End Location",
    fieldType: "text",
    sectionId: "start_trip",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "e.g., Spintex, Accra Mall",
  },
  {
    id: "tf_start_purpose",
    key: "purpose",
    title: "Purpose of Journey",
    fieldType: "text",
    sectionId: "start_trip",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "e.g., Client delivery, depot transfer",
  },
  {
    id: "tf_start_distance",
    key: "distance",
    title: "Distance (km)",
    fieldType: "number",
    sectionId: "start_trip",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "Estimated distance if known",
  },
  ...vehicleConditionCatalogFields("start_trip"),

  // —— End Trip ——
  {
    id: "tf_end_driver",
    key: "driverId",
    title: "Driver",
    fieldType: "driver",
    sectionId: "end_trip",
    required: true,
    isDefaultLocked: true,
    isPositionLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "Search by name, email, or employee ID…",
  },
  {
    id: "tf_end_date",
    key: "date",
    title: "End Date & Time",
    fieldType: "datetime",
    sectionId: "end_trip",
    required: true,
    isDefaultLocked: true,
    isPositionLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "",
  },
  {
    id: "tf_end_actual_destination",
    key: "actualDestination",
    title: "Actual Destination",
    fieldType: "location",
    sectionId: "end_trip",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "Where did the journey end?",
  },
  {
    id: "tf_end_lodging_area",
    key: "lodgingArea",
    title: "Lodging Area",
    fieldType: "text",
    sectionId: "end_trip",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "e.g., Airport View Hotel",
  },
  {
    id: "tf_end_parking_area",
    key: "vehicleParkingArea",
    title: "Vehicle Parking Area",
    fieldType: "text",
    sectionId: "end_trip",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "e.g., Basement P2, Bay 14",
  },
  {
    id: "tf_end_final_odometer",
    key: "finalOdometer",
    title: "Final Odometer (km)",
    fieldType: "number",
    sectionId: "end_trip",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "Reading at trip end",
  },
  ...vehicleConditionCatalogFields("end_trip"),
  {
    id: "tf_end_driver_remarks",
    key: "driverRemarks",
    title: "Driver Remarks",
    fieldType: "textarea",
    sectionId: "end_trip",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "Any notes about the journey, delays, or vehicle behaviour",
  },
];

/** Default-visible field IDs per section (all catalog fields start visible). */
export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  TRIP_FORM_SECTIONS.map((section) => [
    section.id,
    TRIP_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  TRIP_FORM_SECTIONS.map((section) => [
    section.id,
    TRIP_FORM_FIELD_CATALOG.filter(
      (field) => field.sectionId === section.id && field.isDefaultLocked === true,
    ).map((field) => field.id),
  ]),
);

export function getLockedDefaultFieldIds(sectionId) {
  return LOCKED_DEFAULT_FIELD_IDS_BY_SECTION[sectionId] ?? [];
}

/** Ensure locked defaults stay in the visible set. */
export function withLockedDefaultFields(visibleBySection = {}) {
  const next = { ...visibleBySection };
  for (const section of TRIP_FORM_SECTIONS) {
    const locked = getLockedDefaultFieldIds(section.id);
    const current = new Set(next[section.id] ?? []);
    locked.forEach((id) => current.add(id));
    next[section.id] = [...current];
  }
  return next;
}
