import React, { useEffect, useState } from "react";
import Button from "../../../../components/common/base/Button";
import RequestDetailsModal, {
  AccordionSection,
  DetailRow,
} from "../../../../components/common/details/RequestDetailsModal";
import {
  formatInterStoreItemType,
  formatInterStoreTransferDateTime,
  formatInterStoreTransferHistoryAction,
  formatInterStoreTransferStatus,
} from "../../../../mockdata/stores";
import { getUserContact } from "../../../../mockdata/org/users";

export default function InterStoreTransferDetailsModal({
  isOpen,
  onClose,
  transfer,
  onApprove,
  onDispatch,
  onReceive,
  onReject,
  onCancel,
  onMarkArrived,
}) {
  const [openSection, setOpenSection] = useState("dispatcher");

  useEffect(() => {
    if (isOpen) setOpenSection("dispatcher");
  }, [isOpen, transfer?.id]);

  if (!transfer) return null;

  const dispatcher = getUserContact(transfer.dispatcher);
  const dispatcherName = transfer.dispatcher || dispatcher.name || "—";
  const dispatcherEmail = transfer.dispatcherEmail || dispatcher.email || "—";
  const dispatcherPhone = transfer.dispatcherPhone || dispatcher.phone || "—";
  const dispatcherStore = transfer.dispatcherStore || dispatcher.store || "—";

  const status = transfer.status;
  const lines = transfer.lines || [];
  const toggle = (id) => setOpenSection((current) => (current === id ? "" : id));

  const footerRight = (
    <div className="flex flex-wrap justify-end gap-2">
      {status === "PENDING_APPROVAL" ? (
        <>
          <Button variant="warning" size="modal" onClick={onCancel}>
            Cancel request
          </Button>
          <Button size="modal" onClick={onApprove}>
            Approve
          </Button>
        </>
      ) : null}
      {status === "PENDING" ? (
        <>
          <Button variant="danger" size="modal" onClick={onReject}>
            Reject
          </Button>
          <Button size="modal" onClick={() => {
            setOpenSection("dispatcher");
            onDispatch?.();
          }}>
            Dispatch
          </Button>
        </>
      ) : null}
      {status === "IN_TRANSIT" ? (
        <Button size="modal" onClick={onMarkArrived}>
          Mark as arrived
        </Button>
      ) : null}
      {status === "ARRIVED" ? (
        <Button size="modal" onClick={onReceive}>
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
      status={formatInterStoreTransferStatus(status)}
      identifier={transfer.transferNumber}
      footerRight={footerRight}
    >
      <AccordionSection
        title="Summary"
        open={openSection === "summary"}
        onToggle={() => toggle("summary")}
      >
        <DetailRow label="From store">{transfer.fromStore}</DetailRow>
        <DetailRow label="Items">{transfer.itemCount || lines.length || 1}</DetailRow>
        <DetailRow label="Total qty">{transfer.quantity}</DetailRow>
        <DetailRow label="Requested by">{transfer.requestedBy}</DetailRow>
        <DetailRow label="Requested">{formatInterStoreTransferDateTime(transfer.createdAt)}</DetailRow>
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
        <DetailRow label="Home store">{dispatcherStore}</DetailRow>
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
            <table className="w-full text-left min-w-[860px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[110px]">Item code</th>
                  <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[100px]">Item type</th>
                  <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 min-w-[180px]">Description</th>
                  <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[60px]">Stock</th>
                  <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[100px]">Qty requested</th>
                  <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[100px]">Qty approved</th>
                  <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 min-w-[200px]">To store</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lines.map((line) => (
                  <tr key={`${line.itemType}-${line.itemId || line.itemCode}`}>
                    <td className="px-3 py-2 text-[12px] font-mono font-bold text-slate-800 whitespace-nowrap">{line.itemCode}</td>
                    <td className="px-3 py-2 text-[12px] text-slate-700 whitespace-nowrap">{formatInterStoreItemType(line.itemType)}</td>
                    <td className="px-3 py-2 text-[12px] text-slate-700">{line.description || line.itemName || "—"}</td>
                    <td className="px-3 py-2 text-[12px] text-slate-700 whitespace-nowrap">{line.stockQuantity ?? "—"}</td>
                    <td className="px-3 py-2 text-[12px] font-semibold text-slate-800 whitespace-nowrap">{line.quantityRequested ?? line.movingQuantity ?? "—"}</td>
                    <td className="px-3 py-2 text-[12px] font-semibold text-slate-800 whitespace-nowrap">{line.quantityApproved ?? "—"}</td>
                    <td className="px-3 py-2 text-[12px] text-slate-700">{line.toStore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AccordionSection>

      <AccordionSection
        title="Timeline"
        open={openSection === "timeline"}
        onToggle={() => toggle("timeline")}
      >
        {(transfer.history ?? []).length === 0 ? (
          <p className="text-[13px] text-slate-400">No activity yet.</p>
        ) : (
          <ol className="space-y-3">
            {(transfer.history ?? []).map((event, index) => (
              <li key={`${event.action}-${event.at}-${index}`} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-slate-800">
                    {formatInterStoreTransferHistoryAction(event.action)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {formatInterStoreTransferDateTime(event.at)}
                    {event.by ? ` · ${event.by}` : ""}
                  </p>
                  {event.note ? (
                    <p className="text-[12px] text-slate-600 mt-0.5">{event.note}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </AccordionSection>
    </RequestDetailsModal>
  );
}
