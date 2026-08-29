import api from "./api";
import {
  EMPTY_DISPLAY,
  extractApiErrorDetail,
  formatApiDateTime,
  formatStatusLabel,
} from "../utils/apiResponseHelpers";

export const AUDIT_PAGE_SIZE = 10;

const userDisplayName = (user) => {
  if (!user) return "System";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || user.email || "Unknown user";
};

const toAuditUser = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    name: userDisplayName(user),
  };
};

const formatResourceLabel = (resource) => {
  if (!resource) return EMPTY_DISPLAY;
  return formatStatusLabel(resource);
};

const formatActionLabel = (action) => {
  if (!action) return EMPTY_DISPLAY;
  return formatStatusLabel(action);
};

/** Best-effort field changes from free-form audit_metadata. */
const toChanges = (metadata) => {
  if (metadata == null) return [];
  if (Array.isArray(metadata)) {
    return metadata
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const field = row.field ?? row.key ?? row.name;
        if (!field) return null;
        return {
          field: String(field),
          before: row.before != null ? String(row.before) : EMPTY_DISPLAY,
          after: row.after != null ? String(row.after) : EMPTY_DISPLAY,
        };
      })
      .filter(Boolean);
  }
  if (typeof metadata === "object") {
    return Object.entries(metadata).map(([field, value]) => ({
      field,
      before: EMPTY_DISPLAY,
      after:
        value == null
          ? EMPTY_DISPLAY
          : typeof value === "object"
            ? JSON.stringify(value)
            : String(value),
    }));
  }
  return [{ field: "audit_metadata", before: EMPTY_DISPLAY, after: String(metadata) }];
};

export const toAuditEvent = (row = {}) => {
  const resource = row.resource || "";
  const resourceId = row.resource_id ?? null;

  return {
    id: row.id,
    createdAt: row.created_at || null,
    user: toAuditUser(row.user),
    action: row.action || "",
    actionLabel: formatActionLabel(row.action),
    description: row.description || "",
    resource,
    resourceLabel: formatResourceLabel(resource),
    resourceId,
    auditMetadata: row.audit_metadata ?? null,
    ipAddress: row.ip_address || EMPTY_DISPLAY,
    userAgent: row.user_agent || EMPTY_DISPLAY,
    changes: toChanges(row.audit_metadata),
    resourceTarget:
      resourceId != null && resourceId !== ""
        ? `${formatResourceLabel(resource)} #${resourceId}`
        : formatResourceLabel(resource),
  };
};

export const formatAuditWhen = (iso) => {
  if (!iso) return EMPTY_DISPLAY;
  const formatted = formatApiDateTime(iso);
  if (formatted !== EMPTY_DISPLAY) return formatted;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const listAuditLogs = async () => {
  try {
    const { data } = await api.get("/audit");
    return (Array.isArray(data) ? data : []).map(toAuditEvent);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load audit trail."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const getResourceAudit = async (resource, resourceId) => {
  try {
    const { data } = await api.get(`/audit/${encodeURIComponent(resource)}/${resourceId}`);
    return (Array.isArray(data) ? data : []).map(toAuditEvent);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load resource audit."));
    error.status = err?.response?.status;
    throw error;
  }
};
