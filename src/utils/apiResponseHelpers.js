/** Shared parsers for paginated Fleetly API responses */

export function parsePaginatedList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export function getPaginationMeta(data) {
  if (!data || Array.isArray(data)) {
    const len = Array.isArray(data) ? data.length : 0;
    return { page: 0, size: len, totalElements: len, totalPages: 1 };
  }
  return {
    page: data.page ?? 0,
    size: data.size ?? parsePaginatedList(data).length,
    totalElements: data.totalElements ?? parsePaginatedList(data).length,
    totalPages: data.totalPages ?? 1,
  };
}

export function formatApiDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatApiDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Human-readable labels for API codes — e.g. DAILY_POST_TRIP → "Daily Post Trip" */
export function formatStatusLabel(status) {
  if (status == null || status === "") return "—";
  const raw = status.toString().trim();
  const upper = raw.toUpperCase().replace(/-/g, "_");

  const labels = {
    OUT_OF_SERVICE: "Out of Service",
    IN_PROGRESS: "In Progress",
    IN_SHOP: "In Shop",
    ON_LEAVE: "On Leave",
    DUE_SOON: "Due Soon",
    PENDING_REVIEW: "Pending Review",
    ACTIVE_PENALTY: "Active Penalty",
    OPEN: "Open",
    DRAFT: "Draft",
    COMPLETED: "Completed",
    SCHEDULED: "Scheduled",
    REJECTED: "Rejected",
    REPORTED: "Reported",
    CLOSED: "Closed",
    RESOLVED: "Resolved",
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    ARCHIVED: "Archived",
    UNASSIGNED: "Unassigned",
    OVERDUE: "Overdue",
    UPCOMING: "Upcoming",
    CONVERTED: "In WO",
    PENDING: "Pending",
    QUOTE_SUBMITTED: "Quote Submitted",
    QUOTE_APPROVED: "Recommended",
    RECOMMENDED: "Recommended",
    QUOTATION_REQUESTED: "Quotation Requested",
    REASSESSMENT_REQUESTED: "Reassessment Requested",
    ISSUED: "Issued",
    ORDER_ISSUED: "Order Issued",
    JOB_CARD: "Job Card",
    COMPLETION_CERTIFICATE: "Completion Certificate",
    PAYMENT_PENDING: "Payment Pending",
    PENDING_APPROVAL: "Pending Approval",
    READY_FOR_INSPECTION: "Ready for Inspection",
    INSPECTION_COMPLETE: "Inspection Complete",
    NOT_STARTED: "Not Started",
    APPROVED: "Approved",
    PAID: "Paid",
    COMPANY: "Company",
    UNDER_INVESTIGATION: "Under Investigation",
    POLICE_HANDLED: "Police Handled",
    REVIEWING: "Reviewing",
    VERIFIED: "Verified",
    IN_STOCK: "In Stock",
    LOW_STOCK: "Low Stock",
    OUT_OF_STOCK: "Out of Stock",
    MODERATE: "Moderate",
    MINOR: "Minor",
    MAJOR: "Major",
    CRITICAL: "Critical",
    HIGH: "High",
    MEDIUM: "Medium",
    LOW: "Low",
    DAILY_PRE_TRIP: "Daily Pre-Trip",
    DAILY_POST_TRIP: "Daily Post Trip",
    SAFETY_AUDIT: "Safety Audit",
    PERIODIC: "Periodic Inspection",
    SERVICE_PROGRAM: "Service Program",
    FAILED: "Failed",
    FAIL: "Failed",
    FAILURE: "Failed",
    PASSED: "Passed",
    PASS: "Passed",
    SUCCESS: "Success",
    SUCCEEDED: "Success",
    CANCELLED: "Cancelled",
    CANCELED: "Cancelled",
    ERROR: "Error",
    DENIED: "Denied",
    EXPIRED: "Expired",
    PARTIAL_DAMAGE: "Partial Damage",
    COMPLETE_DAMAGE: "Complete Damage",
    DRIVER: "Driver",
    FLEET_MANAGER: "Fleet Manager",
    TECHNICIAN: "Technician",
    INSPECTOR: "Inspector",
    VALID: "Valid",
    MISSING: "Missing",
    EXPIRING_SOON: "Expiring Soon",
    OTHER: "Other",
  };
  if (labels[upper]) return labels[upper];

  if (raw.includes("_")) {
    return raw
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  if (raw === raw.toLowerCase()) {
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  return raw;
}

/** Alias for enum/code fields shown in tables (inspection types, categories, etc.) */
export const formatCodeLabel = formatStatusLabel;

const STATUS_SUCCESS = new Set([
  "ACTIVE",
  "COMPLETED",
  "APPROVED",
  "QUOTE_APPROVED",
  "RECOMMENDED",
  "PAID",
  "PASSED",
  "PASS",
  "SUCCESS",
  "SUCCEEDED",
  "RESOLVED",
  "CLOSED",
  "VERIFIED",
  "DONE",
  "FULFILLED",
  "CONVERTED",
  "IN_STOCK",
  "VALID",
  "VERIFIED",
]);

const STATUS_FAILED = new Set([
  "FAILED",
  "FAIL",
  "FAILURE",
  "REJECTED",
  "CANCELLED",
  "CANCELED",
  "OVERDUE",
  "ACCIDENT",
  "ERROR",
  "OUT_OF_SERVICE",
  "MAINTENANCE",
  "IN_SHOP",
  "SHOP",
  "ARCHIVED",
  "INACTIVE",
  "REPORTED",
  "DENIED",
  "EXPIRED",
  "OUT_OF_STOCK",
  "LOW_STOCK",
  "CRITICAL",
  "COMPLETE_DAMAGE",
  "MISSING",
  "SUSPENDED",
]);

/** UI tone bucket: success (green), pending (blue), failed (red) */
export function getStatusTone(status) {
  const upper = (status ?? "").toString().trim().toUpperCase().replace(/-/g, "_");
  if (!upper) return "pending";
  if (STATUS_SUCCESS.has(upper)) return "success";
  if (STATUS_FAILED.has(upper)) return "failed";
  return "pending";
}

export const STATUS_TONE_BADGE_CLASSES = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-sky-50 text-sky-700 border-sky-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
};

export const STATUS_TONE_DOT_CLASSES = {
  success: "bg-emerald-500",
  pending: "bg-sky-500",
  failed: "bg-rose-500",
};

export function statusBadgeClass(status) {
  return STATUS_TONE_BADGE_CLASSES[getStatusTone(status)];
}

export function statusDotClass(status) {
  return STATUS_TONE_DOT_CLASSES[getStatusTone(status)];
}

/** Maps API status values to UI tone keys (success | pending | failed) */
export function getStatusColorKey(status) {
  return getStatusTone(status);
}

export function resolveVehicleLabel(vehicleId, vehicleMap = {}, fallback = {}) {
  const v = vehicleMap[vehicleId] ?? fallback;
  if (!v || Object.keys(v).length === 0) {
    if (fallback?.vehicleName) return fallback.vehicleName;
    return vehicleId ? `Vehicle ${String(vehicleId).slice(0, 8)}…` : "Unknown vehicle";
  }
  const name = v.vehicleName ?? v.name ?? v.makeName ?? v.make;
  const plate =
    v.plateNumber ?? v.licensePlate ?? v.registrationNumber ?? v.assetTag;
  if (name && plate) return `${name} (${plate})`;
  return name ?? plate ?? "Unknown vehicle";
}

/** 401/403 — stay on page; no error banners or forced logout */
export function isSilentApiError(err) {
  if (!err) return false;
  if (err.suppressUi) return true;
  const status = err?.response?.status;
  return status === 401 || status === 403;
}

/** Pull human-readable message from axios/API errors */
export function extractApiError(err, fallback = "Something went wrong. Please try again.") {
  if (isSilentApiError(err)) return null;
  return err?.response?.data?.message ?? err?.message ?? fallback;
}
