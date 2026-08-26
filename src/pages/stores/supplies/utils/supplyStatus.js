export function supplyStatusKey(status) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
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
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PARTIAL_SUPPLIED":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "REJECTED":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

export function getSupplyViewAction(status) {
  const key = supplyStatusKey(status);
  if (key === "PENDING_SUPPLY_REQUEST") return "raise_supply_request";
  if (key === "PENDING_SUPPLY_APPROVAL") return "approval_request";
  if (key === "PENDING_ISSUANCE" || key === "PARTIAL_SUPPLIED") return "issue_item";
  return "view_details";
}
