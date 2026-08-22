import { collectCanonicalFieldErrors } from "../../../../components/common/fields/canonicalConfiguredField";
import { getLeaveTypes } from "../../../../mockdata/leaveTypes";
import {
  LEAVE_REQUEST_FORM_FIELD_CATALOG,
  VEHICLE_REQUEST_FORM_FIELD_CATALOG,
  getActiveLeaveRequestFormSections,
  getActiveVehicleRequestFormSections,
  getLeaveRequestFormSetup,
  getVehicleRequestFormSetup,
} from "../../../../mockdata/setups";
import { calculateNumberOfDays } from "./requestHelpers";

const SYSTEM_KEYS = new Set(LEAVE_REQUEST_FORM_FIELD_CATALOG.map((field) => field.key));
const VEHICLE_REQUEST_SYSTEM_KEYS = new Set(
  VEHICLE_REQUEST_FORM_FIELD_CATALOG.map((field) => field.key),
);

function visibleKeySet(sections) {
  return new Set(
    (sections || []).flatMap((section) => (section.fields || []).map((field) => field.key).filter(Boolean)),
  );
}

export function validateLeaveRequestForm(form, setup, formSetup = getLeaveRequestFormSetup()) {
  const errors = {};
  const sections = getActiveLeaveRequestFormSections(formSetup);
  const visible = visibleKeySet(sections);
  const show = (key) => visible.has(key);

  if (show("employeeId") && !form.employeeId) {
    errors.employeeId = "Select an employee.";
  }

  if (show("leaveType") && !form.leaveType) {
    errors.leaveType = "Select a leave type.";
  }

  if (show("startDate") && !form.startDate) {
    errors.startDate = "Enter a start date.";
  }

  if (show("endDate")) {
    if (!form.endDate) {
      errors.endDate = "Enter an end date.";
    } else if (form.startDate && form.endDate < form.startDate) {
      errors.endDate = "End date cannot be before start date.";
    }
  }

  if (show("leaveYear") && !form.leaveYear?.trim()) {
    errors.leaveYear = "Enter the leave year.";
  }

  if (show("reason")) {
    if (!form.reason?.trim()) {
      errors.reason = "Enter a reason for the leave request.";
    } else if (form.reason.trim().length < 5) {
      errors.reason = "Reason must be at least 5 characters.";
    }
  }

  const numberOfDays = calculateNumberOfDays(form.startDate, form.endDate);
  if (show("endDate") && form.startDate && form.endDate && numberOfDays == null) {
    errors.endDate = "Enter valid start and end dates.";
  }

  if (show("leaveType") && form.leaveType && numberOfDays != null) {
    const leaveType = getLeaveTypes().find((type) => type.value === form.leaveType);
    if (leaveType && numberOfDays > leaveType.maxDays) {
      errors.endDate = `This leave type allows a maximum of ${leaveType.maxDays} day${leaveType.maxDays !== 1 ? "s" : ""}.`;
    }
  }

  const customFields = sections
    .flatMap((section) => section.fields || [])
    .filter((field) => field.key && !SYSTEM_KEYS.has(field.key));
  Object.assign(errors, collectCanonicalFieldErrors(customFields, form));

  void setup;

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    numberOfDays,
  };
}

export function clearLeaveRequestFieldError(errors, field) {
  if (!errors[field] && field !== "optional") return errors;
  const next = { ...errors };
  delete next[field];
  if (field.startsWith("optional.")) {
    const optionalId = field.replace("optional.", "");
    if (next.optional) {
      const optional = { ...next.optional };
      delete optional[optionalId];
      next.optional = Object.keys(optional).length ? optional : undefined;
      if (!next.optional) delete next.optional;
    }
  }
  return next;
}

export function validateVehicleRequestForm(form, setup, formSetup = getVehicleRequestFormSetup()) {
  const errors = {};
  const sections = getActiveVehicleRequestFormSections(formSetup);
  const visible = new Set(
    (sections || []).flatMap((section) => (section.fields || []).map((field) => field.key).filter(Boolean)),
  );
  const show = (key) => visible.has(key);

  if (show("driverId") && !form.driverId) {
    errors.driverId = "Select a driver.";
  }

  if (show("vehicleId") && !form.vehicleId) {
    errors.vehicleId = "Select a vehicle.";
  }

  if (show("reason")) {
    if (!form.reason?.trim()) {
      errors.reason = "Enter a reason for this vehicle request.";
    } else if (form.reason.trim().length < 5) {
      errors.reason = "Reason must be at least 5 characters.";
    }
  }

  const customFields = sections
    .flatMap((section) => section.fields || [])
    .filter((field) => field.key && !VEHICLE_REQUEST_SYSTEM_KEYS.has(field.key));
  Object.assign(errors, collectCanonicalFieldErrors(customFields, form));

  void setup;

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

export function clearVehicleRequestFieldError(errors, field) {
  return clearLeaveRequestFieldError(errors, field);
}
