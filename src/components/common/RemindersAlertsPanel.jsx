import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";
import Button from "./base/Button";
import AlertListItem from "./AlertListItem";

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "maintenance", label: "Maintenance" },
  { id: "issue", label: "Issues" },
  { id: "workorder", label: "Works and Services" },
];

const RemindersAlertsPanel = ({
  alerts = [],
  loading = false,
  summary = {},
  counts = {},
  title = "Reminders & Alerts",
  compact = false,
  onViewAll,
  onClear,
  showFooter = true,
  showFilters = true,
  showSummary = true,
  className,
}) => {
  const [filter, setFilter] = useState("all");

  const filteredAlerts = useMemo(() => {
    if (filter === "all") return alerts;
    return alerts.filter((a) => a.category === filter);
  }, [alerts, filter]);

  const overdue = summary.criticalOverdue ?? 0;
  const dueSoon = summary.dueSoon ?? 0;
  const criticalCount = counts.critical ?? alerts.filter((a) => a.type === "critical").length;

  return (
    <div className={cn("card border-slate-200 bg-white overflow-hidden", compact ? "p-4" : "p-5", className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg">
            <Bell size={compact ? 15 : 16} />
          </div>
          <div>
            <h3 className="text-[12px] font-black text-slate-900 tracking-tight">{title}</h3>
            {!compact && (
              <p className="text-[10px] text-slate-500 mt-0.5">
                Maintenance, issues, and work orders
              </p>
            )}
          </div>
        </div>
        {!loading && alerts.length > 0 && (
          <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
            {alerts.length} active
          </span>
        )}
      </div>

      {/* Summary strip */}
      {showSummary && !loading && (
        <div className={cn("grid gap-2 mb-4", compact ? "grid-cols-3" : "grid-cols-3")}>
          <div className="rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-center">
            <p className="text-[15px] font-black text-rose-700 leading-none">{overdue}</p>
            <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wide mt-1">Overdue</p>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-center">
            <p className="text-[15px] font-black text-amber-700 leading-none">{dueSoon}</p>
            <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wide mt-1">Due Soon</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-center">
            <p className="text-[15px] font-black text-slate-800 leading-none">{criticalCount}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mt-1">Critical</p>
          </div>
        </div>
      )}

      {/* Category filters */}
      {showFilters && !loading && alerts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {FILTER_TABS.map((tab) => {
            const tabCount =
              tab.id === "all"
                ? alerts.length
                : alerts.filter((a) => a.category === tab.id).length;
            if (tab.id !== "all" && tabCount === 0) return null;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "px-2.5 py-1 text-[9px] font-bold rounded-md border transition-colors",
                  filter === tab.id
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-500 border-slate-200 hover:border-emerald-200 hover:text-emerald-700",
                )}
              >
                {tab.label}
                {tabCount > 0 && ` (${tabCount})`}
              </button>
            );
          })}
        </div>
      )}

      {/* Alert list */}
      {loading ? (
        <div className={cn("flex items-center justify-center gap-2 text-[12px] text-slate-400", compact ? "py-6" : "py-10")}>
          <Loader2 size={16} className="animate-spin text-emerald-500" />
          Loading alerts…
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className={cn("text-center", compact ? "py-6" : "py-10")}>
          <div className="mx-auto w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="text-[12px] font-bold text-slate-700">
            {filter === "all" ? "All clear" : "No alerts in this category"}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {filter === "all"
              ? "No reminders or alerts need attention right now."
              : "Try another filter or check back later."}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "space-y-2",
            compact ? "max-h-[280px] overflow-y-auto pr-0.5" : "max-h-[360px] overflow-y-auto pr-0.5",
          )}
        >
          {filteredAlerts.map((alert) => (
            <AlertListItem key={alert.id} alert={alert} compact={compact} />
          ))}
        </div>
      )}

      {/* Footer */}
      {showFooter && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
          {onClear && alerts.some((a) => a.category === "system") && (
            <Button variant="outline" size="sm" className="flex-1" onClick={onClear}>
              Clear system
            </Button>
          )}
          <Link to="/service-reminders" className="flex-1" onClick={onViewAll}>
            <Button variant="secondary" size="sm" className="w-full">
              View schedule
            </Button>
          </Link>
          {(counts.issues > 0 || alerts.some((a) => a.category === "issue")) && (
            <Link to="/issues" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                Open issues
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default RemindersAlertsPanel;
