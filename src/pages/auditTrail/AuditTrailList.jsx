import React, { useEffect, useMemo, useState } from "react";
import { FiDownload } from "react-icons/fi";
import { ScrollText } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/base/Button";
import SearchInput from "../../components/common/fields/SearchInput";
import Pagination from "../../components/common/Pagination";
import SectionLoadState from "../../components/common/SectionLoadState";
import { TableRowActions, TableViewAction } from "../../components/common/tableActions";
import { toast } from "../../components/common/ToastNotification";
import { cn } from "../../utils/cn";
import { EMPTY_DISPLAY, sortNewestFirst } from "../../utils/apiResponseHelpers";
import {
  AUDIT_PAGE_SIZE,
  formatAuditWhen,
  listAuditLogs,
} from "../../services/auditService";
import { AuditEventDetailModal } from "./components";

const filterLabelClassName =
  "text-[11px] font-medium text-slate-500 tracking-wider shrink-0";

const filterSelectClassName =
  "px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25";

function actionTone(action) {
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
  if (/(^|_)(reject|rejected)(_|$)/.test(key) || key.includes("reject")) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  if (key.includes("status") || key.includes("change")) {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }
  if (key.includes("export")) {
    return "bg-violet-50 text-violet-700 border-violet-200";
  }
  if (key.includes("login") || key.includes("auth")) {
    return "bg-slate-100 text-slate-600 border-slate-200";
  }
  if (key.includes("issue") || key.includes("supply") || key.includes("stock")) {
    return "bg-indigo-50 text-indigo-700 border-indigo-200";
  }
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function ActionBadge({ action, actionRaw }) {
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap",
        actionTone(actionRaw || action),
      )}
    >
      {action || EMPTY_DISPLAY}
    </span>
  );
}

export default function AuditTrailList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);

  const reload = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setEvents(sortNewestFirst(await listAuditLogs(), "at"));
    } catch (err) {
      const message = err.message || "Unable to load audit trail.";
      setEvents([]);
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const moduleFilters = useMemo(() => {
    const seen = new Map();
    events.forEach((row) => {
      const value = row.moduleRaw || row.module;
      if (!value || seen.has(value)) return;
      seen.set(value, row.module || value);
    });
    return [
      { value: "ALL", label: "All modules" },
      ...[...seen.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [events]);

  const actionFilters = useMemo(() => {
    const seen = new Map();
    events.forEach((row) => {
      const value = row.actionRaw || row.action;
      if (!value || seen.has(value)) return;
      seen.set(value, row.action || value);
    });
    return [
      { value: "ALL", label: "All actions" },
      ...[...seen.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [events]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((row) => {
      if (moduleFilter !== "ALL" && (row.moduleRaw || row.module) !== moduleFilter) {
        return false;
      }
      if (actionFilter !== "ALL" && (row.actionRaw || row.action) !== actionFilter) {
        return false;
      }
      if (!q) return true;
      return [
        row.actor,
        row.actorEmail,
        row.action,
        row.module,
        row.target,
        row.summary,
        row.ipAddress,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [events, search, moduleFilter, actionFilter]);

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / AUDIT_PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedRows = filtered.slice(
    safePage * AUDIT_PAGE_SIZE,
    safePage * AUDIT_PAGE_SIZE + AUDIT_PAGE_SIZE,
  );

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  useEffect(() => {
    setPage(0);
  }, [search, moduleFilter, actionFilter]);

  return (
    <div className="space-y-4 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader
        title="Audit Trail"
        description="Track who changed what across your store workspace — inventory, supplies, transfers, setups, and more."
        icon={ScrollText}
      >
        <Button
          variant="secondary"
          onClick={() => toast.warning("Not available")}
        >
          <FiDownload size={16} /> Export Audit Trail
        </Button>
      </PageHeader>

      <div className="card overflow-hidden">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/30 p-4 lg:flex-row lg:items-center">
          <SearchInput
            placeholder="Search actor, action, target, IP…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="auditModuleFilter" className={filterLabelClassName}>
                Module :
              </label>
              <select
                id="auditModuleFilter"
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className={filterSelectClassName}
                disabled={loading}
              >
                {moduleFilters.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="auditActionFilter" className={filterLabelClassName}>
                Action :
              </label>
              <select
                id="auditActionFilter"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className={filterSelectClassName}
                disabled={loading}
              >
                {actionFilters.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500">When</th>
                <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500">Actor</th>
                <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500">Action</th>
                <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500">Module</th>
                <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500">Target</th>
                <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500">Source</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase text-slate-500">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading || loadError ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4">
                    <SectionLoadState
                      loading={loading}
                      error={loadError}
                      onRetry={reload}
                      loadingLabel="Loading audit trail…"
                      errorTitle="Couldn’t load audit trail"
                    />
                  </td>
                </tr>
              ) : pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[13px] text-slate-400">
                    {events.length === 0
                      ? "No audit events yet."
                      : "No audit events match your filters."}
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer align-top transition-colors hover:bg-slate-50/50"
                    onClick={() => setSelected(row)}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] font-medium text-slate-600">
                      {formatAuditWhen(row.at)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-semibold text-slate-900">{row.actor}</p>
                      <p className="text-[11px] text-slate-400">{row.actorEmail || EMPTY_DISPLAY}</p>
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={row.action} actionRaw={row.actionRaw} />
                    </td>
                    <td className="px-4 py-3 text-[12px] font-medium text-slate-700">{row.module}</td>
                    <td className="max-w-[260px] px-4 py-3">
                      <p className="text-[12px] font-semibold text-slate-800">{row.target}</p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">{row.summary}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-slate-600">
                      {row.source}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <TableRowActions>
                        <TableViewAction
                          title="View event"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(row);
                          }}
                        />
                      </TableRowActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && !loadError ? (
          <div className="flex justify-start border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <Pagination
              page={safePage}
              size={AUDIT_PAGE_SIZE}
              totalElements={totalElements}
              onPageChange={setPage}
              showWhenEmpty={false}
            />
          </div>
        ) : null}
      </div>

      <AuditEventDetailModal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        event={selected}
      />
    </div>
  );
}
