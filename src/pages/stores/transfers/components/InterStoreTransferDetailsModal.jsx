import React, { useEffect, useState } from "react";
import Button from "../../../../components/common/base/Button";
import SectionLoadState from "../../../../components/common/SectionLoadState";
import RequestDetailsModal, {
  AccordionSection,
  DetailRow,
} from "../../../../components/common/details/RequestDetailsModal";
import { formatApiDateTime } from "../../../../utils/apiResponseHelpers";
import { listUsers } from "../../../../services/usersService";
import { TRANSFER_STATUS, transferStatusKey } from "../utils/transferStatus";
import { TransferStatusBadge } from "../utils/TransferStatusBadge";

export default function InterStoreTransferDetailsModal({
  isOpen,
  onClose,
  transfer,
  loading = false,
  loadError = null,
  onRetry,
  actionSaving = false,
  onApprove,
  onDispatch,
  onReceive,
  onReject,
  onCancel,
  onMarkArrived,
}) {
  const [openSection, setOpenSection] = useState("summary");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isOpen) setOpenSection("summary");
  }, [isOpen, transfer?.id]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    listUsers()
      .then((rows) => {
        if (!cancelled) setUsers(rows);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!transfer) return null;

  const dispatcherName = transfer.dispatcher || "—";
  const dispatcherEmail = transfer.dispatcherEmail || "—";
  const dispatcherPhone = transfer.dispatcherPhone || "—";
  const status = transferStatusKey(transfer.status);
  const lines = transfer.lines || [];
  const statusHistory = transfer.statusHistory || [];
  const toggle = (id) => setOpenSection((current) => (current === id ? "" : id));
  const disabled = loading || actionSaving;

  const resolveChangedByName = (entry) => {
    if (entry?.changedByName) return entry.changedByName;
    const match = users.find((user) => Number(user.id) === Number(entry?.changedBy));
    return match?.name || "—";
  };

  const footerRight = (
    <div className="flex flex-wrap justify-end gap-2">
      {status === TRANSFER_STATUS.PENDING_APPROVAL ? (
        <>
          <Button variant="danger" size="modal" onClick={onCancel} disabled={disabled}>
            Cancel request
          </Button>
          <Button size="modal" onClick={onApprove} disabled={disabled}>
            Approve
          </Button>
        </>
      ) : null}
      {status === TRANSFER_STATUS.PENDING_DISPATCH ? (
        <>
          <Button variant="danger" size="modal" onClick={onReject} disabled={disabled}>
            Reject dispatch
          </Button>
          <Button size="modal" onClick={onDispatch} disabled={disabled}>
            Dispatch
          </Button>
        </>
      ) : null}
      {status === TRANSFER_STATUS.IN_TRANSIT ? (
        <Button size="modal" onClick={onMarkArrived} disabled={disabled}>
          Mark as arrived
        </Button>
      ) : null}
      {status === TRANSFER_STATUS.ARRIVED ? (
        <Button size="modal" onClick={onReceive} disabled={disabled}>
          Receive to store
        </Button>
      ) : null}
    </div>
  );

  return (
    <RequestDetailsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer details"
      subtitle="Inter-store stock movement"
      statusBadge={<TransferStatusBadge status={transfer.status} />}
      identifier={transfer.transferNumber}
      footerRight={footerRight}
    >
      <SectionLoadState
        loading={loading}
        error={loadError}
        onRetry={onRetry}
        loadingLabel="Loading transfer details…"
        errorTitle="Couldn't load transfer details"
      >
        <>
          <AccordionSection
            title="Summary"
            open={openSection === "summary"}
            onToggle={() => toggle("summary")}
          >
            <DetailRow label="From store">{transfer.fromStore}</DetailRow>
            <DetailRow label="Items">{transfer.itemCount || lines.length || 1}</DetailRow>
            <DetailRow label="Total qty">{transfer.quantity}</DetailRow>
            <DetailRow label="Requested by">{transfer.requestedBy}</DetailRow>
            <DetailRow label="Requested">{formatApiDateTime(transfer.createdAt)}</DetailRow>
            <DetailRow label="Notes">{transfer.notes || "—"}</DetailRow>
            {transfer.rejectionReason ? (
              <DetailRow label="Rejection reason">{transfer.rejectionReason}</DetailRow>
            ) : null}
            {transfer.cancelReason ? (
              <DetailRow label="Cancel reason">{transfer.cancelReason}</DetailRow>
            ) : null}
          </AccordionSection>

          <AccordionSection
            title="Dispatcher"
            open={openSection === "dispatcher"}
            onToggle={() => toggle("dispatcher")}
          >
            <DetailRow label="Person dispatching">{dispatcherName}</DetailRow>
            <DetailRow label="Email">{dispatcherEmail}</DetailRow>
            <DetailRow label="Phone">{dispatcherPhone}</DetailRow>
          </AccordionSection>

          <AccordionSection
            title="Lines"
            open={openSection === "lines"}
            onToggle={() => toggle("lines")}
          >
            {lines.length === 0 ? (
              <p className="text-[13px] text-slate-400">No lines on this transfer.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full text-left min-w-[920px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[110px]">Item code</th>
                      <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 min-w-[180px]">Name</th>
                      <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[100px]">Qty requested</th>
                      <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[100px]">Qty approved</th>
                      <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 min-w-[160px]">From store</th>
                      <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 min-w-[160px]">To store</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {lines.map((line) => (
                      <tr key={`${line.itemId || line.itemCode}-${line.id || line.toStoreId}`}>
                        <td className="px-3 py-2 text-[12px] font-mono font-bold text-slate-800 whitespace-nowrap">{line.itemCode}</td>
                        <td className="px-3 py-2 text-[12px] text-slate-700">{line.itemName || "—"}</td>
                        <td className="px-3 py-2 text-[12px] font-semibold text-slate-800 whitespace-nowrap">{line.quantityRequested ?? line.movingQuantity ?? "—"}</td>
                        <td className="px-3 py-2 text-[12px] font-semibold text-slate-800 whitespace-nowrap">{line.quantityApproved ?? "—"}</td>
                        <td className="px-3 py-2 text-[12px] text-slate-700">{line.fromStore || transfer.fromStore || "—"}</td>
                        <td className="px-3 py-2 text-[12px] text-slate-700">{line.toStore || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AccordionSection>

          <AccordionSection
            title={`Timeline${statusHistory.length ? ` (${statusHistory.length})` : ""}`}
            open={openSection === "history"}
            onToggle={() => toggle("history")}
          >
            {statusHistory.length === 0 ? (
              <p className="text-[13px] text-slate-400">No timeline events recorded for this transfer yet.</p>
            ) : (
              <ul className="space-y-4">
                {statusHistory.map((entry) => (
                  <li key={entry.id} className="flex gap-3">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-900"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {entry.fromStatus ? (
                          <>
                            <TransferStatusBadge status={entry.fromStatus} />
                            <span className="text-[11px] text-slate-400">→</span>
                          </>
                        ) : null}
                        <TransferStatusBadge status={entry.toStatus} />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {formatApiDateTime(entry.createdAt)} · {resolveChangedByName(entry)}
                      </p>
                      {entry.comment ? (
                        <p className="text-[12px] text-slate-600 leading-relaxed">{entry.comment}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AccordionSection>
        </>
      </SectionLoadState>
    </RequestDetailsModal>
  );
}
