export function supplyStatusKey(status) {
  const key = String(status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (key === "PARTIAL_SUPPLIED") return "PARTIALLY_SUPPLIED";
  return key;
}

export function supplyStatusBadgeClass(status) {
  switch (supplyStatusKey(status)) {
    case "PENDING_SUPPLY_REQUEST":
      return "bg-gray-100 text-gray-700 border-gray-300";
    case "PENDING_SUPPLY_APPROVAL":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "PENDING_ISSUANCE":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "SUPPLIED":
      return "bg-success-muted text-success border-[#b7d4c8]";
    case "PARTIALLY_SUPPLIED":
      return "bg-teal-50 text-teal-700 border-teal-200";
    case "REJECTED":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

/** Chart fill colors aligned with supply status badge text colors. */
const SUPPLY_STATUS_CHART_COLORS = {
  PENDING_SUPPLY_REQUEST: "#374151",
  PENDING_SUPPLY_APPROVAL: "#b45309",
  PENDING_ISSUANCE: "#6d28d9",
  SUPPLIED: "#205848",
  PARTIALLY_SUPPLIED: "#0f766e",
  REJECTED: "#be123c",
};

export function supplyStatusChartColor(status) {
  return SUPPLY_STATUS_CHART_COLORS[supplyStatusKey(status)] || "#64748b";
}

export function getSupplyViewAction(status) {
  const key = supplyStatusKey(status);
  if (key === "PENDING_SUPPLY_REQUEST") return "raise_supply_request";
  if (key === "PENDING_SUPPLY_APPROVAL") return "approval_request";
  if (key === "PENDING_ISSUANCE" || key === "PARTIALLY_SUPPLIED") {
    return "issue_item";
  }
  return "view_details";
}

/**
 * Same as getSupplyViewAction, but falls back to view-only details when the
 * user lacks the matching mutate permission.
 */
export function resolveSupplyViewAction(
  status,
  { canRaise = true, canApprove = true, canReject = true, canIssue = true } = {},
) {
  const action = getSupplyViewAction(status);
  if (action === "raise_supply_request" && !canRaise) return "view_details";
  if (action === "approval_request" && !canApprove && !canReject) return "view_details";
  if (action === "issue_item" && !canIssue) return "view_details";
  return action;
}
