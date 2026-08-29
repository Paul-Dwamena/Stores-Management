import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  CheckCircle2,
  Clock3,
  Plus,
  AlertTriangle,
} from "lucide-react";
import Button from "../../../components/common/base/Button";
import SummaryStatCard from "../../../components/common/SummaryStatCard";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import SearchInput from "../../../components/common/fields/SearchInput";
import Pagination from "../../../components/common/Pagination";
import SectionLoadState from "../../../components/common/SectionLoadState";
import {
  TableRowActions,
  TableViewAction,
} from "../../../components/common/tableActions";
import { toast } from "../../../components/common/ToastNotification";
import { formatApiDateTime, sortNewestFirst } from "../../../utils/apiResponseHelpers";
import { getTransfersStats } from "../../../services/statsService";
import {
  listTransfers,
  getTransfer,
  createTransfer,
  approveTransfer,
  cancelTransfer,
  rejectTransferDispatch,
  dispatchTransfer,
  holdTransfer,
  acceptTransfer,
} from "../../../services/transfersService";
import { TransferStatusBadge } from "./utils/TransferStatusBadge";
import {
  TRANSFER_STATUS_OPTIONS,
  transferStatusKey,
} from "./utils/transferStatus";
import ArriveTransferChoiceModal from "./components/ArriveTransferChoiceModal";
import InterStoreTransferDetailsModal from "./components/InterStoreTransferDetailsModal";
import NewInterStoreTransferModal from "./components/NewInterStoreTransferModal";
import ReceiveTransferToStoreModal from "./components/ReceiveTransferToStoreModal";
import TransferCommentModal from "./components/TransferCommentModal";

const PAGE_SIZE = 10;

const filterLabelClassName =
  "text-[11px] font-medium text-slate-500 tracking-wider shrink-0";

const filterSelectClassName =
  "px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25";

export default function InterStoresTransfersList({ embedded = false }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTransfers: 0,
    open: 0,
    completed: 0,
    rejected: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailLoadError, setDetailLoadError] = useState(null);
  const [actionSaving, setActionSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [commentAction, setCommentAction] = useState(null);
  const [arriveRow, setArriveRow] = useState(null);
  const [receiveRow, setReceiveRow] = useState(null);

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listTransfers();
      setRows(sortNewestFirst(data, "createdAt"));
    } catch (err) {
      setLoadError(err.message || "Unable to load transfers.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getTransfersStats();
      setStats(data);
    } catch {
      setStats({
        totalTransfers: 0,
        open: 0,
        completed: 0,
        rejected: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const reloadAll = useCallback(async () => {
    await Promise.all([loadTransfers(), loadStats()]);
  }, [loadTransfers, loadStats]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "ALL" && transferStatusKey(row.status) !== statusFilter) return false;
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
        ...(row.lines || []).flatMap((line) => [
          line.itemCode,
          line.itemName,
          line.description,
          line.toStore,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, searchQuery, statusFilter]);

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  const statCards = useMemo(
    () => [
      {
        label: "Inter-store transfers",
        value: String(stats.totalTransfers),
        icon: ArrowLeftRight,
        tone: "teal",
      },
      { label: "Open", value: String(stats.open), icon: Clock3, tone: "amber" },
      { label: "Completed", value: String(stats.completed), icon: CheckCircle2, tone: "sky" },
      {
        label: "Closed without move",
        value: String(stats.rejected),
        icon: AlertTriangle,
        tone: "rose",
      },
    ],
    [stats],
  );

  const openDetail = async (row) => {
    setDetailRow(row);
    setDetailLoading(true);
    setDetailLoadError(null);
    try {
      const detail = await getTransfer(row.id);
      setDetailRow(detail);
    } catch (err) {
      setDetailLoadError(err.message || "Unable to load transfer details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async (row) => {
    try {
      const detail = await getTransfer(row.id);
      setDetailRow(detail);
      return detail;
    } catch (err) {
      toast.error(err.message || "Unable to refresh transfer.");
      return row;
    }
  };

  const handleCreate = async (payload) => {
    setCreateSaving(true);
    try {
      await createTransfer(payload);
      await reloadAll();
      setCreateOpen(false);
      toast.success("Transfer sent for approval.");
    } catch (err) {
      toast.error(err.message || "Could not create the transfer.");
    } finally {
      setCreateSaving(false);
    }
  };

  const handleDispatch = async (row) => {
    setActionSaving(true);
    try {
      await dispatchTransfer(row.id);
      await reloadAll();
      setConfirmAction(null);
      setDetailRow(null);
      toast.success(`${row.transferNumber} is now in transit.`);
    } catch (err) {
      toast.error(err.message || "Could not dispatch the transfer.");
    } finally {
      setActionSaving(false);
    }
  };

  const handleReceive = async (row) => {
    setActionSaving(true);
    try {
      await acceptTransfer(row.id);
      await reloadAll();
      setReceiveRow(null);
      setDetailRow(null);
      toast.success(`${row.transferNumber} received into store.`);
    } catch (err) {
      toast.error(err.message || "Could not receive the transfer.");
    } finally {
      setActionSaving(false);
    }
  };

  const handleCancel = async (row) => {
    setActionSaving(true);
    try {
      await cancelTransfer(row.id, { reason: "Cancelled before approval." });
      await reloadAll();
      setConfirmAction(null);
      setDetailRow(null);
      toast.success(`${row.transferNumber} cancelled.`);
    } catch (err) {
      toast.error(err.message || "Could not cancel the transfer.");
    } finally {
      setActionSaving(false);
    }
  };

  const handleApprove = async (row) => {
    setActionSaving(true);
    try {
      await approveTransfer(row.id);
      await reloadAll();
      setConfirmAction(null);
      setDetailRow(null);
      toast.success(`${row.transferNumber} approved.`);
    } catch (err) {
      toast.error(err.message || "Could not approve the transfer.");
    } finally {
      setActionSaving(false);
    }
  };

  const handleReject = async (row, reason) => {
    setActionSaving(true);
    try {
      await rejectTransferDispatch(row.id, { reason });
      await reloadAll();
      setCommentAction(null);
      setDetailRow(null);
      toast.success(`${row.transferNumber} rejected.`);
    } catch (err) {
      toast.error(err.message || "Could not reject the transfer.");
    } finally {
      setActionSaving(false);
    }
  };

  const handleCommentConfirm = (comment) => {
    if (!commentAction?.row) return;
    handleReject(commentAction.row, comment);
  };

  const handleHoldArrived = async () => {
    if (!arriveRow) return;
    setActionSaving(true);
    try {
      await holdTransfer(arriveRow.id);
      await reloadAll();
      setArriveRow(null);
      setDetailRow(null);
      toast.success(`${arriveRow.transferNumber} marked as arrived and held.`);
    } catch (err) {
      toast.error(err.message || "Could not mark the transfer as arrived.");
    } finally {
      setActionSaving(false);
    }
  };

  const handleAcceptArrived = async () => {
    if (!arriveRow) return;
    setActionSaving(true);
    try {
      await holdTransfer(arriveRow.id);
      const updated = await refreshDetail(arriveRow);
      setArriveRow(null);
      setReceiveRow(updated);
    } catch (err) {
      toast.error(err.message || "Could not mark the transfer as arrived.");
    } finally {
      setActionSaving(false);
    }
  };

  const confirmCopy = {
    approve: {
      title: "Approve this transfer?",
      message: (row) =>
        `Approve ${row.transferNumber}? ${row.quantity} item${row.quantity === 1 ? "" : "s"} will move from ${row.fromStore} once dispatched.`,
      confirmText: "Approve",
      onConfirm: handleApprove,
    },
    cancel: {
      title: "Cancel this transfer?",
      message: (row) =>
        `Cancel ${row.transferNumber} before approval? Stock stays at ${row.fromStore}.`,
      confirmText: "Cancel transfer",
      isDanger: true,
      onConfirm: handleCancel,
    },
    dispatch: {
      title: "Dispatch this transfer?",
      message: (row) =>
        row.dispatcher
          ? `Dispatch ${row.transferNumber} with ${row.dispatcher}? Items will be marked as in transit.`
          : `Dispatch ${row.transferNumber}? Items will be marked as in transit.`,
      confirmText: "Dispatch",
      onConfirm: handleDispatch,
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
        {statCards.map((stat) => (
          <SummaryStatCard
            variant={embedded ? "light" : "filled"}
            key={stat.label}
            title={stat.label}
            value={statsLoading ? "…" : stat.value}
            icon={stat.icon}
            tone={stat.tone}
          />
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-2 sm:px-4 bg-slate-50/30">
            <div className="min-w-0 flex-1" />
            <div className="flex flex-nowrap items-center gap-2 shrink-0 py-2 ml-auto">
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus size={16} />
                New transfer
              </Button>
            </div>
          </div>

          <div className="p-4 bg-slate-50/30 flex flex-col xl:flex-row justify-between gap-4">
            <SearchInput
              placeholder="Search by transfer #, item, or store…"
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
                  {TRANSFER_STATUS_OPTIONS.map((option) => (
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
              {loading || loadError ? (
                <tr>
                  <td colSpan={9} className="px-4 py-2">
                    <SectionLoadState
                      loading={loading}
                      error={loadError}
                      onRetry={loadTransfers}
                      loadingLabel="Loading transfers…"
                      errorTitle="Couldn't load transfers"
                    />
                  </td>
                </tr>
              ) : pagedRows.length === 0 ? (
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
                      {formatApiDateTime(row.createdAt)}
                    </td>
                    <td className="px-6 py-3.5 text-[12px] text-slate-700 whitespace-nowrap">
                      {row.requestedBy}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <TransferStatusBadge status={row.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <TableRowActions>
                        <TableViewAction
                          title="View transfer"
                          onClick={() => openDetail(row)}
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
        onClose={() => !createSaving && setCreateOpen(false)}
        onSave={handleCreate}
        saving={createSaving}
      />

      <InterStoreTransferDetailsModal
        isOpen={Boolean(detailRow)}
        onClose={() => !actionSaving && setDetailRow(null)}
        transfer={detailRow}
        loading={detailLoading}
        loadError={detailLoadError}
        onRetry={() => detailRow && openDetail(detailRow)}
        actionSaving={actionSaving}
        onApprove={() => detailRow && setConfirmAction({ type: "approve", row: detailRow })}
        onDispatch={() => detailRow && setConfirmAction({ type: "dispatch", row: detailRow })}
        onReceive={() => detailRow && setReceiveRow(detailRow)}
        onReject={() => detailRow && setCommentAction({ type: "reject", row: detailRow })}
        onCancel={() => detailRow && setConfirmAction({ type: "cancel", row: detailRow })}
        onMarkArrived={() => detailRow && setArriveRow(detailRow)}
      />

      <TransferCommentModal
        isOpen={Boolean(commentAction?.row)}
        onClose={() => !actionSaving && setCommentAction(null)}
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
        confirmLoading={actionSaving}
        closeOnConfirm={false}
      />

      <ArriveTransferChoiceModal
        isOpen={Boolean(arriveRow)}
        onClose={() => !actionSaving && setArriveRow(null)}
        onHold={handleHoldArrived}
        onAccept={handleAcceptArrived}
        transferLabel={arriveRow?.transferNumber}
        actionSaving={actionSaving}
      />

      <ReceiveTransferToStoreModal
        isOpen={Boolean(receiveRow)}
        onClose={() => !actionSaving && setReceiveRow(null)}
        onConfirm={() => receiveRow && handleReceive(receiveRow)}
        transfer={receiveRow}
        saving={actionSaving}
      />

      <ConfirmationModal
        isOpen={Boolean(activeConfirm && confirmAction?.row)}
        onClose={() => !actionSaving && setConfirmAction(null)}
        onConfirm={() => activeConfirm?.onConfirm(confirmAction.row)}
        isDanger={Boolean(activeConfirm?.isDanger)}
        className="!z-[10001]"
        title={activeConfirm?.title}
        message={confirmAction?.row ? activeConfirm?.message(confirmAction.row) : ""}
        confirmText={activeConfirm?.confirmText}
        confirmLoading={actionSaving}
        closeOnConfirm={false}
      />
    </div>
  );
}
