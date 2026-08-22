/**
 * Compatibility re-exports for vehicle specification fields.
 * Source of truth is the open-ended vehicle spec tree.
 */

export {
  VEHICLE_SPEC_LEVEL_1,
  VEHICLE_SPEC_SECTIONS,
} from "./vehicleSpecTree";

export {
  getVehicleSpecFields,
  getVehicleSpecFieldsBySection,
  getVehicleSpecFieldByApiKey,
  getInitialSpecFormValues,
  formatSpecFieldValue,
  buildSpecificationsPayload,
} from "./vehicleSpecSetups";

/** @deprecated Visibility is now controlled by leaf isActive on the tree. */
export const DEFAULT_VISIBLE_SPEC_FIELD_IDS_BY_SECTION = {};

/** @deprecated Catalog replaced by vehicle spec tree leaves. */
export const VEHICLE_SPEC_FIELD_CATALOG = [];
