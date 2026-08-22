import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import SearchInput from "../../../components/common/fields/SearchInput";
import Pagination from "../../../components/common/Pagination";
import { TableRowActions, TableViewAction } from "../../../components/common/tableActions";
import { toast } from "../../../components/common/ToastNotification";
import { cn } from "../../../utils/cn";
import {
  APPROVAL_PAGE_SIZE,
  APPROVAL_TYPE_FILTERS,
  decideApproval,
  formatApprovalAmount,
  syncApprovalsFromRequests,
} from "../../../mockdata/approvals";
import {
  getRequests,
  updateRequestApprovalStatus,
} from "../../../mockdata/requests";
import { applyInterStoreTransferApprovalDecision } from "../../../mockdata/stores";
import ApprovalDecisionModal from "./components/ApprovalDecisionModal";
import ApprovalRequestDetailModal from "./components/ApprovalRequestDetailModal";

const filterLabelClassName =
  "text-[11px] font-medium text-slate-500 tracking-wider shrink-0";

const filterSelectClassName =
  "px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 outline-none focus:border-brand";

function DecisionBadge({ decision }) {
  if (!decision) return <span className="text-slate-400 text-[12px]">—</span>;
  const approved = decision === "Approved";
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border",
        approved
          ? "bg-brand-muted text-brand border-brand/20"
          : "bg-rose-50 text-rose-700 border-rose-200",
      )}
    >
      {decision}
    </span>
  );
}

function formatDecisionComment(row) {
  if (row.rejectionReason && row.comment) {
    return `${row.rejectionReason} — ${row.comment}`;
  }
  return row.rejectionReason || row.comment || "—";
}

function approvalSortTime(row) {
  const iso = Date.parse(row.submittedAt || "");
  if (!Number.isNaN(iso)) return iso;
  const fromDate = Date.parse(row.date || "");
  return Number.isNaN(fromDate) ? 0 : fromDate;
}

export default function ApprovalsList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(() => syncApprovalsFromRequests(getRequests()));
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [approvalType, setApprovalType] = useState("ALL");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null);

  useEffect(() => {
    setRows(syncApprovalsFromRequests(getRequests()));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const next = rows.filter((row) => {
      const matchesTab = tab === "pending" ? row.queue === "pending" : row.queue === "history";
      if (!matchesTab) return false;
      if (approvalType !== "ALL" && row.approvalCategory !== approvalType) return false;
      if (!q) return true;
      return (
        row.requestNumber.toLowerCase().includes(q) ||
        row.requestType.toLowerCase().includes(q) ||
        row.requester.toLowerCase().includes(q) ||
        (row.purpose || "").toLowerCase().includes(q) ||
        (row.comment || "").toLowerCase().includes(q) ||
        (row.rejectionReason || "").toLowerCase().includes(q)
      );
    });

    if (tab !== "pending") return next;
    return [...next].sort((a, b) => approvalSortTime(b) - approvalSortTime(a));
  }, [rows, tab, search, approvalType]);

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / APPROVAL_PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedRows = filtered.slice(
    safePage * APPROVAL_PAGE_SIZE,
    safePage * APPROVAL_PAGE_SIZE + APPROVAL_PAGE_SIZE,
  );

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  useEffect(() => {
    setPage(0);
  }, [tab, search, approvalType]);

  const runDecision = ({ comments, rejectionReason }) => {
    if (!action) return;

    const updated = decideApproval(action.id, {
      type: action.type,
      comments,
      rejectionReason,
      sourceRequestId: action.sourceRequestId,
    });

    if (updated?.sourceRequestId) {
      const request = updateRequestApprovalStatus(updated.sourceRequestId, {
        status: action.type === "approve" ? "APPROVED" : "REJECTED",
        approvalStatus: action.type === "approve" ? "Approved" : "Rejected",
        approvedBy: action.type === "approve" ? "Current Approver" : null,
      });
      if (request?.storesDetails?.transferId) {
        applyInterStoreTransferApprovalDecision(request.storesDetails.transferId, {
          approved: action.type === "approve",
          reason: rejectionReason,
          by: action.type === "approve" ? "Current Approver" : "Current Approver",
        });
      }
    }

    setRows(syncApprovalsFromRequests(getRequests()));
    toast.success(
      action.type === "approve" ? "Request approved." : "Request rejected for resubmission.",
    );
    setAction(null);
    setSelected(null);
  };

  const openRaiseFromStores = (request) => {
    const details = request?.storesDetails || {};
    const raiseRef =
      details.requisitionId
      || details.requestNumber
      || request?.sourceRequestId
      || request?.requestNumber;
    navigate(`/stores?sub=requisition&raise=${encodeURIComponent(raiseRef || "store")}`, {
      state: {
        raiseStoresDetails: details,
        sourceRequestId: request?.sourceRequestId || null,
        approvalRequestNumber: request?.requestNumber || null,
      },
    });
  };

  const requestDecision = (type, request) => {
    if (!request) return;
    setAction({
      type,
      id: request.id,
      name: request.requestNumber,
      sourceKind: request.sourceKind,
      sourceRequestId: request.sourceRequestId,
      requestType: request.requestType,
    });
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="space-y-3">
        <PageHeader
          title="Approval Queue"
          description="Review and process pending requests."
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

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-col lg:flex-row justify-between gap-4">
          <SearchInput
            placeholder="Search by ID, requester, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="approvalTypeFilter" className={filterLabelClassName}>
                Approval type :
              </label>
              <select
                id="approvalTypeFilter"
                value={approvalType}
                onChange={(e) => setApprovalType(e.target.value)}
                className={filterSelectClassName}
              >
                {APPROVAL_TYPE_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[960px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Request #</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Type</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Requester</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Amount</th>
                {tab === "history" ? (
                  <>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Decision</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Decision Date</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Comment</th>
                  </>
                ) : (
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Date</th>
                )}
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pagedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={tab === "history" ? 8 : 6}
                    className="px-6 py-12 text-center text-[13px] text-slate-400"
                  >
                    {tab === "pending" ? "No pending approvals" : "No approval history"}
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 align-top">
                    <td className="px-4 py-3 text-[12px] font-bold text-slate-900 whitespace-nowrap">
                      {row.requestNumber}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-700">{row.requestType}</td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-semibold text-slate-900">{row.requester}</p>
                      <p className="text-[11px] text-slate-400">{row.requesterDept}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-bold text-slate-800 whitespace-nowrap">
                      {formatApprovalAmount(row.amount)}
                    </td>
                    {tab === "history" ? (
                      <>
                        <td className="px-4 py-3">
                          <DecisionBadge decision={row.decision} />
                        </td>
                        <td className="px-4 py-3 text-[12px] text-slate-600 whitespace-nowrap">
                          {row.decisionDate || "—"}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-slate-600 max-w-[220px]">
                          {formatDecisionComment(row)}
                        </td>
                      </>
                    ) : (
                      <td className="px-4 py-3 text-[12px] text-slate-600 whitespace-nowrap">{row.date}</td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <TableRowActions>
                        <TableViewAction title="View request" onClick={() => setSelected(row)} />
                      </TableRowActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-start">
          <Pagination
            page={safePage}
            size={APPROVAL_PAGE_SIZE}
            totalElements={totalElements}
            onPageChange={setPage}
            showWhenEmpty={false}
          />
        </div>
      </div>

      <ApprovalRequestDetailModal
        isOpen={Boolean(selected) && !action}
        onClose={() => setSelected(null)}
        request={selected}
        onApprove={(request) => requestDecision("approve", request)}
        onReject={(request) => requestDecision("reject", request)}
        onApproveFromStores={openRaiseFromStores}
      />

      <ApprovalDecisionModal
        isOpen={Boolean(action)}
        onClose={() => setAction(null)}
        onConfirm={runDecision}
        type={action?.type === "reject" ? "reject" : "approve"}
        requestLabel={action?.name}
      />
    </div>
  );
}
