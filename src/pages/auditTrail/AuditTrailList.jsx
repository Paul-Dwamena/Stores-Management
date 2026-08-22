import React, { useEffect, useMemo, useState } from "react";
import { FiDownload } from "react-icons/fi";
import { ScrollText } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/base/Button";
import SearchInput from "../../components/common/fields/SearchInput";
import Pagination from "../../components/common/Pagination";
import { TableRowActions, TableViewAction } from "../../components/common/tableActions";
import { toast } from "../../components/common/ToastNotification";
import { cn } from "../../utils/cn";
import {
  AUDIT_ACTION_FILTERS,
  AUDIT_MODULE_FILTERS,
  AUDIT_PAGE_SIZE,
  formatAuditWhen,
  getAuditEvents,
} from "../../mockdata/administration/auditTrail";
import { AuditEventDetailModal } from "./components";

const filterLabelClassName =
  "text-[11px] font-medium text-slate-500 tracking-wider shrink-0";

const filterSelectClassName =
  "px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 outline-none focus:border-emerald-500";

function ActionBadge({ action }) {
  const styles = {
    Created: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Updated: "bg-sky-50 text-sky-700 border-sky-200",
    Deleted: "bg-rose-50 text-rose-700 border-rose-200",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200",
    "Status Change": "bg-amber-50 text-amber-800 border-amber-200",
    Exported: "bg-violet-50 text-violet-700 border-violet-200",
    Login: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap",
        styles[action] ?? "bg-slate-50 text-slate-600 border-slate-200",
      )}
    >
      {action}
    </span>
  );
}

export default function AuditTrailList() {
  const [events] = useState(() => getAuditEvents());
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((row) => {
      if (moduleFilter !== "ALL" && row.module !== moduleFilter) return false;
      if (actionFilter !== "ALL" && row.action !== actionFilter) return false;
      if (!q) return true;
      return (
        row.actor.toLowerCase().includes(q) ||
        row.actorEmail.toLowerCase().includes(q) ||
        row.action.toLowerCase().includes(q) ||
        row.module.toLowerCase().includes(q) ||
        row.target.toLowerCase().includes(q) ||
        row.summary.toLowerCase().includes(q) ||
        row.ipAddress.toLowerCase().includes(q)
      );
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
          onClick={() => toast.success("Audit trail exported successfully.")}
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
              >
                {AUDIT_MODULE_FILTERS.map((option) => (
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
              >
                {AUDIT_ACTION_FILTERS.map((option) => (
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
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[13px] text-slate-400">
                    No audit events match your filters.
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
                      <p className="text-[11px] text-slate-400">{row.actorEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={row.action} />
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

        <div className="flex justify-start border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <Pagination
            page={safePage}
            size={AUDIT_PAGE_SIZE}
            totalElements={totalElements}
            onPageChange={setPage}
            showWhenEmpty={false}
          />
        </div>
      </div>

      <AuditEventDetailModal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        event={selected}
      />
    </div>
  );
}
