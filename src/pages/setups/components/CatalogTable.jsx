import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import Button from "../../../components/common/base/Button";
import SearchInput from "../../../components/common/fields/SearchInput";
import Pagination from "../../../components/common/Pagination";
import SectionLoadState from "../../../components/common/SectionLoadState";
import { TableIconAction, TableRowActions } from "../../../components/common/tableActions";
import { cn } from "../../../utils/cn";

const PAGE_SIZE = 8;

export function StatusBadge({ status }) {
  const active = status === "Active";
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border",
        active ? "bg-brand-muted text-brand border-brand/20" : "bg-slate-50 text-slate-500 border-slate-200",
      )}
    >
      {status || "—"}
    </span>
  );
}

export default function CatalogTable({
  rows,
  columns,
  searchKeys = [],
  searchPlaceholder = "Search...",
  emptyLabel = "No records yet.",
  addLabel,
  onAdd,
  renderActions,
  loading = false,
  error = null,
  onRetry,
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      searchKeys.some((key) => String(row[key] || "").toLowerCase().includes(q)),
    );
  }, [rows, search, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const colSpan = columns.length + (renderActions ? 1 : 0);
  const showBodyState = loading || Boolean(error);

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <SearchInput
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
        {onAdd ? (
          <Button onClick={onAdd} size="sm">
            <Plus size={14} />
            {addLabel || "Add"}
          </Button>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[640px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase"
                >
                  {column.label}
                </th>
              ))}
              {renderActions ? (
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase text-right">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {showBodyState ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-2">
                  <SectionLoadState
                    loading={loading}
                    error={error}
                    onRetry={onRetry}
                    loadingLabel="Loading…"
                    errorTitle="Couldn’t load this table"
                  />
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-6 py-12 text-center text-[13px] text-slate-400"
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-[12px] text-slate-700">
                      {column.render ? column.render(row) : row[column.key] || "—"}
                    </td>
                  ))}
                  {renderActions ? (
                    <td className="px-4 py-3 text-right">
                      <TableRowActions>{renderActions(row)}</TableRowActions>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!showBodyState ? (
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100">
          <Pagination
            page={safePage}
            size={PAGE_SIZE}
            totalElements={filtered.length}
            onPageChange={setPage}
            showWhenEmpty={false}
          />
        </div>
      ) : null}
    </div>
  );
}

export { TableIconAction };
