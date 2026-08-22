import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Ban,
  CheckCircle2,
  Clock3,
  MapPin,
  PackageCheck,
  Plus,
  Truck,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import Button from "../../../components/common/base/Button";
import SummaryStatCard from "../../../components/common/SummaryStatCard";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import SearchInput from "../../../components/common/fields/SearchInput";
import Pagination from "../../../components/common/Pagination";
import {
  TableIconAction,
  TableRowActions,
  TableViewAction,
} from "../../../components/common/tableActions";
import { toast } from "../../../components/common/ToastNotification";
import {
  INTER_STORE_TRANSFER_KIND_TABS,
  INTER_STORE_TRANSFER_STATUS_OPTIONS,
  applyInterStoreTransferApprovalDecision,
  cancelInterStoreTransfer,
  createInterStoreTransfer,
  dispatchInterStoreTransfer,
  formatInterStoreTransferDate,
  formatInterStoreTransferStatus,
  getInterStoreTransfers,
  markInterStoreTransferArrived,
  receiveInterStoreTransfer,
  rejectInterStoreTransfer,
} from "../../../mockdata/stores";
import { saveRequest } from "../../../mockdata/requests";
import ArriveTransferChoiceModal from "./components/ArriveTransferChoiceModal";
import InterStoreTransferDetailsModal from "./components/InterStoreTransferDetailsModal";
import NewInterStoreTransferModal from "./components/NewInterStoreTransferModal";
import ReceiveTransferToStoreModal from "./components/ReceiveTransferToStoreModal";
import DispatchTransferModal from "./components/DispatchTransferModal";
import TransferCommentModal from "./components/TransferCommentModal";

const PAGE_SIZE = 10;

const filterLabelClassName =
  "text-[11px] font-medium text-slate-500 tracking-wider shrink-0";

const filterSelectClassName =
  "px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 outline-none focus:border-emerald-500";

function statusBadgeClass(status) {
  switch (status) {
    case "PENDING_APPROVAL":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "IN_TRANSIT":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "ARRIVED":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "REJECTED":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "CANCELLED":
      return "bg-slate-50 text-slate-500 border-slate-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

export default function InterStoresTransfersList({
  embedded = false,
  tabsSlot = null,
  view = "accessories",
}) {
  const isVehicleParts = view === "vehicle_parts";
  const [rows, setRows] = useState(() => getInterStoreTransfers());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [commentAction, setCommentAction] = useState(null);
  const [dispatchRow, setDispatchRow] = useState(null);
  const [arriveRow, setArriveRow] = useState(null);
  const [receiveRow, setReceiveRow] = useState(null);

  const refreshRows = () => setRows(getInterStoreTransfers());

  useEffect(() => {
    setPage(0);
    setSearchQuery("");
    setStatusFilter("ALL");
    setCreateOpen(false);
    setDetailRow(null);
    setConfirmAction(null);
    setCommentAction(null);
    setDispatchRow(null);
    setArriveRow(null);
    setReceiveRow(null);
    refreshRows();
  }, [view]);

  const kindRows = useMemo(
    () => rows.filter((row) => {
      const tabKind = isVehicleParts ? "vehicle_parts" : "accessories";
      if (row.kind === tabKind || row.kind === "mixed") return true;
      return (row.lines || []).some((line) => line.itemType === tabKind);
    }),
    [rows, isVehicleParts],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return kindRows.filter((row) => {
      if (statusFilter !== "ALL" && row.status !== statusFilter) return false;
      if (!q) return true;
      return [
        row.transferNumber,
        row.itemCode,
        row.itemName,
        row.fromStore,
        row.toStore,
        row.toStoreLabel,
        row.requestedBy,
        row.notes,
        ...(row.lines || []).flatMap((line) => [line.itemCode, line.itemName, line.description, line.toStore]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [kindRows, searchQuery, statusFilter]);

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  const stats = useMemo(() => {
    const pending = kindRows.filter((row) =>
      ["PENDING_APPROVAL", "PENDING", "IN_TRANSIT", "ARRIVED"].includes(row.status),
    ).length;
    const completed = kindRows.filter((row) => row.status === "COMPLETED").length;
    const rejected = kindRows.filter((row) =>
      ["REJECTED", "CANCELLED"].includes(row.status),
    ).length;
    return [
      {
        label: isVehicleParts ? "Vehicle part transfers" : "Accessory transfers",
        value: String(kindRows.length),
        icon: ArrowLeftRight,
        tone: "teal",
      },
      { label: "Open", value: String(pending), icon: Clock3, tone: "amber" },
      { label: "Completed", value: String(completed), icon: CheckCircle2, tone: "sky" },
      { label: "Closed without move", value: String(rejected), icon: AlertTriangle, tone: "rose" },
    ];
  }, [kindRows, isVehicleParts]);

  const liveDetailRow = detailRow
    ? rows.find((row) => row.id === detailRow.id) || detailRow
    : null;

  const handleCreate = (payload) => {
    try {
      const created = createInterStoreTransfer(payload);
      saveRequest({
        requestType: "inter_store_transfer",
        amount: 0,
        costCenter: "Parts Store",
        budgetLine: "Inter-store Transfer",
        requestClass: "Operating",
        expenseCategory: `${created.transferNumber} · ${created.itemCount} item${created.itemCount === 1 ? "" : "s"}`,
        purpose: created.notes || `Transfer stock from ${created.fromStore}.`,
        status: "PENDING",
        storesDetails: {
          transferId: created.id,
          requestNumber: created.transferNumber,
          kind: created.kind,
          fromStore: created.fromStore,
          itemName: created.itemName,
          itemCode: created.itemCode,
          quantity: created.quantity,
          lines: created.lines,
          justification: created.notes,
        },
      });
      refreshRows();
      setCreateOpen(false);
      toast.success(`${created.transferNumber} sent for approval.`);
    } catch (err) {
      toast.error(err.message || "Could not create the transfer.");
    }
  };

  const handleDispatch = (row, { dispatcher, comment } = {}) => {
    try {
      dispatchInterStoreTransfer(row.id, { note: comment, dispatcher });
      refreshRows();
      setDispatchRow(null);
      toast.success(`${row.transferNumber} is now in transit.`);
    } catch (err) {
      toast.error(err.message || "Could not dispatch the transfer.");
    }
  };

  const handleReceive = (row) => {
    try {
      receiveInterStoreTransfer(row.id);
      refreshRows();
      setReceiveRow(null);
      toast.success(`${row.transferNumber} received into store.`);
    } catch (err) {
      toast.error(err.message || "Could not receive the transfer.");
    }
  };

  const handleCancel = (row) => {
    try {
      cancelInterStoreTransfer(row.id);
      refreshRows();
      setConfirmAction(null);
      toast.success(`${row.transferNumber} cancelled.`);
    } catch (err) {
      toast.error(err.message || "Could not cancel the transfer.");
    }
  };

  const handleApprove = (row) => {
    try {
      applyInterStoreTransferApprovalDecision(row.id, { approved: true });
      refreshRows();
      setDetailRow(null);
      toast.success(`${row.transferNumber} approved.`);
    } catch (err) {
      toast.error(err.message || "Could not approve the transfer.");
    }
  };

  const handleReject = (row, reason) => {
    try {
      rejectInterStoreTransfer(row.id, { reason });
      refreshRows();
      setCommentAction(null);
      toast.success(`${row.transferNumber} rejected.`);
    } catch (err) {
      toast.error(err.message || "Could not reject the transfer.");
    }
  };

  const handleCommentConfirm = (comment) => {
    if (!commentAction?.row) return;
    handleReject(commentAction.row, comment);
  };

  const handleHoldArrived = () => {
    if (!arriveRow) return;
    try {
      markInterStoreTransferArrived(arriveRow.id, {
        note: "Held at destination pending store receipt.",
      });
      refreshRows();
      setArriveRow(null);
      toast.success(`${arriveRow.transferNumber} marked as arrived and held.`);
    } catch (err) {
      toast.error(err.message || "Could not mark the transfer as arrived.");
    }
  };

  const handleAcceptArrived = () => {
    if (!arriveRow) return;
    try {
      const updated = markInterStoreTransferArrived(arriveRow.id, {
        note: "Accepted to store.",
      });
      refreshRows();
      setArriveRow(null);
      setReceiveRow(updated);
    } catch (err) {
      toast.error(err.message || "Could not mark the transfer as arrived.");
    }
  };

  const confirmCopy = {
    cancel: {
      title: "Cancel this transfer?",
      message: (row) =>
        `Cancel ${row.transferNumber} before approval? Stock stays at ${row.fromStore}.`,
      confirmText: "Cancel transfer",
      isDanger: true,
      onConfirm: handleCancel,
    },
  };

  const commentCopy = {
    reject: {
      title: "Reject transfer",
      placeholder: "Explain why this transfer cannot be dispatched…",
      confirmTitle: "Reject this transfer?",
      confirmMessage: (row) =>
        `Reject ${row.transferNumber}? Stock will stay at the sending store.`,
      confirmText: "Reject transfer",
      isDanger: true,
    },
  };

  const activeConfirm = confirmAction ? confirmCopy[confirmAction.type] : null;

  return (
    <div className={embedded ? "space-y-4" : "space-y-4 pb-8"}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <SummaryStatCard
          variant={embedded ? "light" : "filled"}
            key={stat.label}
            title={stat.label}
            value={stat.value}
            icon={stat.icon}
            tone={stat.tone}
          />
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-2 sm:px-4 bg-slate-50/30">
            <div className="min-w-0 flex-1">
              {tabsSlot}
            </div>
            <div className="flex flex-nowrap items-center gap-2 shrink-0 py-2 ml-auto">
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus size={16} />
                New transfer
              </Button>
            </div>
          </div>

          <div className="p-4 bg-slate-50/30 flex flex-col xl:flex-row justify-between gap-4">
            <SearchInput
              placeholder={
                isVehicleParts
                  ? "Search by transfer #, part, or store…"
                  : "Search by transfer #, item, or store…"
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
            />
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="interStoreTransferStatusFilter" className={filterLabelClassName}>
                  Status :
                </label>
                <select
                  id="interStoreTransferStatusFilter"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                  className={filterSelectClassName}
                >
                  {INTER_STORE_TRANSFER_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1400px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Transfer #
                </th>
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[320px]">
                    Items
                  </th>
                <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Qty
                </th>
                <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[200px]">
                  From store
                </th>
                <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[200px]">
                  To store
                </th>
                <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Date
                </th>
                <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Requested by
                </th>
                <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-right min-w-[160px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pagedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-[13px] text-slate-400"
                  >
                    No inter-store transfers found.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 align-middle">
                    <td className="px-6 py-3.5 text-[12px] font-bold text-slate-900 whitespace-nowrap">
                      {row.transferNumber}
                    </td>
                    <td className="px-6 py-3.5 text-[12px] font-semibold text-slate-800 min-w-[320px]">
                      <p className="font-mono text-slate-700">{row.itemCode}</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {row.itemName}
                        {(row.itemCount || 1) > 1 ? ` +${row.itemCount - 1} more` : ""}
                      </p>
                    </td>
                    <td className="px-6 py-3.5 text-[12px] font-bold text-slate-800 whitespace-nowrap">
                      {row.quantity}
                    </td>
                    <td className="px-6 py-3.5 text-[12px] text-slate-700">
                      {row.fromStore}
                    </td>
                    <td className="px-6 py-3.5 text-[12px] text-slate-700">
                      {row.toStoreLabel || row.toStore}
                    </td>
                    <td className="px-6 py-3.5 text-[12px] text-slate-600 whitespace-nowrap">
                      {formatInterStoreTransferDate(row.createdAt)}
                    </td>
                    <td className="px-6 py-3.5 text-[12px] text-slate-700 whitespace-nowrap">
                      {row.requestedBy}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border",
                          statusBadgeClass(row.status),
                        )}
                      >
                        {formatInterStoreTransferStatus(row.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <TableRowActions>
                        <TableViewAction
                          title="View transfer"
                          onClick={() => setDetailRow(row)}
                        />
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
            size={PAGE_SIZE}
            totalElements={totalElements}
            onPageChange={setPage}
            showWhenEmpty={false}
          />
        </div>
      </div>

      <NewInterStoreTransferModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
      />

      <InterStoreTransferDetailsModal
        isOpen={Boolean(liveDetailRow)}
        onClose={() => setDetailRow(null)}
        transfer={liveDetailRow}
        onApprove={() => liveDetailRow && handleApprove(liveDetailRow)}
        onDispatch={() => liveDetailRow && setDispatchRow(liveDetailRow)}
        onReceive={() => liveDetailRow && setReceiveRow(liveDetailRow)}
        onReject={() => liveDetailRow && setCommentAction({ type: "reject", row: liveDetailRow })}
        onCancel={() => liveDetailRow && setConfirmAction({ type: "cancel", row: liveDetailRow })}
        onMarkArrived={() => liveDetailRow && setArriveRow(liveDetailRow)}
      />

      <DispatchTransferModal
        isOpen={Boolean(dispatchRow)}
        onClose={() => setDispatchRow(null)}
        onConfirm={(payload) => dispatchRow && handleDispatch(dispatchRow, payload)}
        transferLabel={dispatchRow?.transferNumber}
      />

      <TransferCommentModal
        isOpen={Boolean(commentAction?.row)}
        onClose={() => setCommentAction(null)}
        onConfirm={handleCommentConfirm}
        transferLabel={commentAction?.row?.transferNumber}
        title={commentCopy[commentAction?.type]?.title}
        placeholder={commentCopy[commentAction?.type]?.placeholder}
        confirmTitle={commentCopy[commentAction?.type]?.confirmTitle}
        confirmMessage={
          commentAction?.row
            ? commentCopy[commentAction.type]?.confirmMessage(commentAction.row)
            : ""
        }
        confirmText={commentCopy[commentAction?.type]?.confirmText}
        isDanger={Boolean(commentCopy[commentAction?.type]?.isDanger)}
      />

      <ArriveTransferChoiceModal
        isOpen={Boolean(arriveRow)}
        onClose={() => setArriveRow(null)}
        onHold={handleHoldArrived}
        onAccept={handleAcceptArrived}
        transferLabel={arriveRow?.transferNumber}
      />

      <ReceiveTransferToStoreModal
        isOpen={Boolean(receiveRow)}
        onClose={() => setReceiveRow(null)}
        onConfirm={() => receiveRow && handleReceive(receiveRow)}
        transfer={receiveRow}
      />

      <ConfirmationModal
        isOpen={Boolean(activeConfirm && confirmAction?.row)}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => activeConfirm?.onConfirm(confirmAction.row)}
        isDanger={Boolean(activeConfirm?.isDanger)}
        className="!z-[10001]"
        title={activeConfirm?.title}
        message={confirmAction?.row ? activeConfirm?.message(confirmAction.row) : ""}
        confirmText={activeConfirm?.confirmText}
      />
    </div>
  );
}
