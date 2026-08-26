import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import SearchInput from "../../../components/common/fields/SearchInput";
import Pagination from "../../../components/common/Pagination";
import { TableRowActions, TableViewAction } from "../../../components/common/tableActions";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import { toast } from "../../../components/common/ToastNotification";
import { cn } from "../../../utils/cn";
import { formatApiDateTime, sortNewestFirst } from "../../../utils/apiResponseHelpers";
import { listSupplyRequests } from "../../../services/supplyRequestsService";
import { SupplyStatusBadge } from "../../stores/supplies/utils/SupplyStatusBadge";

const PAGE_SIZE = 10;

export default function ApprovalsList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const reload = async () => {
    setLoading(true);
    try {
      setRows(sortNewestFirst(await listSupplyRequests(), "createdAt"));
    } catch (err) {
      toast.error(err.message || "Unable to load supply requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (tab === "pending" ? row.queue !== "pending" : row.queue !== "history") return false;
      if (!q) return true;
      return [
        String(row.id),
        String(row.generalRequestId),
        row.requesterName,
        row.status,
        row.comment,
        row.approvalComment,
        ...(row.items || []).map((item) => item.itemName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [tab, search]);

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  const openOnStores = (row) => {
    navigate(`/stores?sub=requisition&supplyId=${row.id}`);
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="space-y-3">
        <PageHeader
          title="Approval Queue"
          description="Approve raised supply requests. Items still waiting to be raised stay in Stores → Supplies."
          className="mb-0"
        />

        <div className="tab-track">
          <button
            type="button"
            onClick={() => setTab("pending")}
            className={cn("tab-pill", tab === "pending" && "tab-pill-active")}
          >
            Pending Approvals
          </button>
          <button
            type="button"
            onClick={() => setTab("history")}
            className={cn("tab-pill", tab === "history" && "tab-pill-active")}
          >
            Approval History
          </button>
        </div>
      </div>

      <div className="card overflow-hidden relative min-h-[200px]">
        {loading ? <LoadingSpinner variant="overlay" size="sm" /> : null}
        <div className="p-4 border-b border-slate-100 bg-slate-50/30">
          <SearchInput
            placeholder="Search by supply id, requester, or item…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[880px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Supply #</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">General request</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Requester</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Qty</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">
                  {tab === "history" ? "Updated" : "Date"}
                </th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[13px] text-slate-400">
                    {tab === "pending" ? "No pending supply approvals" : "No approval history"}
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-[12px] font-bold text-slate-900 whitespace-nowrap">
                      #{row.id}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-700 whitespace-nowrap">
                      #{row.generalRequestId}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-slate-900">
                      {row.requesterName || "—"}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-bold text-slate-800 tabular-nums">
                      {row.totalQuantityRequested ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <SupplyStatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-600 whitespace-nowrap">
                      {formatApiDateTime(tab === "history" ? row.updatedAt : row.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <TableRowActions>
                        <TableViewAction title="View request" onClick={() => openOnStores(row)} />
                      </TableRowActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
          <Pagination
            page={safePage}
            size={PAGE_SIZE}
            totalElements={filtered.length}
            onPageChange={setPage}
            showWhenEmpty={false}
          />
        </div>
      </div>
    </div>
  );
}
