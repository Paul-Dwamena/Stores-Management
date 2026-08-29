import { cn } from "../../../utils/cn";
import { EMPTY_DISPLAY } from "../../../utils/apiResponseHelpers";
import { STATUS_BADGE_CLASS } from "../../../utils/workflowStatusBadge";

/** Badge colours for audit log action values. */
export function auditActionBadgeClass(action) {
  const key = String(action || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (!key) return "bg-slate-50 text-slate-600 border-slate-200";
  if (/(^|_)(create|created|add|added|insert)(_|$)/.test(key) || key.includes("create")) {
    return "bg-success-muted text-success border-[#b7d4c8]";
  }
  if (/(^|_)(update|updated|edit|edited|modify|modified|patch)(_|$)/.test(key) || key.includes("update")) {
    return "bg-sky-50 text-sky-700 border-sky-200";
  }
  if (/(^|_)(delete|deleted|remove|removed)(_|$)/.test(key) || key.includes("delete")) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  if (/(^|_)(approve|approved)(_|$)/.test(key) || key.includes("approve")) {
    return "bg-success-muted text-success border-[#b7d4c8]";
  }
  if (/(^|_)(reject|rejected|cancel|cancelled)(_|$)/.test(key) || key.includes("reject") || key.includes("cancel")) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  if (key.includes("dispatch") || key.includes("issue") || key.includes("supply") || key.includes("stock")) {
    return "bg-violet-50 text-violet-700 border-violet-200";
  }
  if (key.includes("status") || key.includes("change")) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (key.includes("export")) {
    return "bg-teal-50 text-teal-700 border-teal-200";
  }
  if (key.includes("login") || key.includes("auth")) {
    return "bg-slate-100 text-slate-600 border-slate-200";
  }
  return "bg-slate-50 text-slate-600 border-slate-200";
}

export function AuditActionBadge({ action, actionLabel, className }) {
  return (
    <span
      className={cn(
        STATUS_BADGE_CLASS,
        auditActionBadgeClass(action),
        className,
      )}
    >
      {actionLabel || action || EMPTY_DISPLAY}
    </span>
  );
}
