import React, { useState } from "react";
import RequestDetailsModal, {
  AccordionSection,
  DetailRow,
} from "../../../../components/common/details/RequestDetailsModal";
import Button from "../../../../components/common/base/Button";
import { formatApiDateTime, formatStatusLabel } from "../../../../utils/apiResponseHelpers";
import { SupplyStatusBadge } from "../../../stores/supplies/utils/SupplyStatusBadge";

export default function SupplyApprovalDetailModal({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
}) {
  const [openSections, setOpenSections] = useState({
    information: true,
    items: true,
  });
  const pending = String(request?.status || "")
    .toUpperCase()
    .replace(/[\s-]+/g, "_") === "PENDING_SUPPLY_APPROVAL";

  if (!isOpen || !request) return null;

  return (
    <RequestDetailsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Supply request"
      subtitle="Raised from Stores and waiting for approval."
      status={formatStatusLabel(request.status)}
      identifier={`Supply #${request.id}`}
      dialogClassName="max-w-4xl"
      footerRight={
        pending ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="danger" size="modal" onClick={() => onReject?.(request)}>
              Reject
            </Button>
            <Button size="modal" onClick={() => onApprove?.(request)}>
              Approve
            </Button>
          </div>
        ) : null
      }
    >
      <AccordionSection
        title="Request Information"
        open={openSections.information}
        onToggle={() => setOpenSections((current) => ({ ...current, information: !current.information }))}
      >
        <DetailRow label="Supply request">{`#${request.id}`}</DetailRow>
        <DetailRow label="General request">{`#${request.generalRequestId}`}</DetailRow>
        <DetailRow label="Status">
          <SupplyStatusBadge status={request.status} />
        </DetailRow>
        <DetailRow label="Requester">{request.requesterName || "—"}</DetailRow>
        <DetailRow label="Total quantity">{request.totalQuantityRequested ?? "—"}</DetailRow>
        <DetailRow label="Comment">{request.comment || "—"}</DetailRow>
        <DetailRow label="Approval comment">{request.approvalComment || "—"}</DetailRow>
        <DetailRow label="Date created">{formatApiDateTime(request.createdAt)}</DetailRow>
        <DetailRow label="Date updated">{formatApiDateTime(request.updatedAt)}</DetailRow>
      </AccordionSection>

      <AccordionSection
        title="Items requested"
        open={openSections.items}
        onToggle={() => setOpenSections((current) => ({ ...current, items: !current.items }))}
      >
        {(request.items || []).length === 0 ? (
          <p className="text-[13px] text-slate-400">No items on this supply request.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Code
                  </th>
                  <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Name
                  </th>
                  <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Store
                  </th>
                  <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Qty
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {request.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-3 font-mono text-[11px] text-slate-600">
                      {item.itemCode || "—"}
                    </td>
                    <td className="px-3 py-3 text-[12px] font-semibold text-slate-900">
                      {item.itemName || "—"}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-slate-700">{item.storeName || "—"}</td>
                    <td className="px-3 py-3 text-[12px] font-semibold tabular-nums">
                      {item.quantityRequested ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AccordionSection>
    </RequestDetailsModal>
  );
}
