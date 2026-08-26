import React, { useEffect, useState } from "react";
import RequestDetailsModal, {
  AccordionSection,
  DetailRow,
} from "../../../../components/common/details/RequestDetailsModal";
import Button from "../../../../components/common/base/Button";
import LoadingSpinner from "../../../../components/common/LoadingSpinner";
import { formatApiDateTime, formatStatusLabel } from "../../../../utils/apiResponseHelpers";
import { SupplyStatusBadge } from "../../../stores/supplies/utils/SupplyStatusBadge";

export default function RequestDetailModal({
  isOpen,
  onClose,
  request,
  requesterName,
  loading = false,
  onEdit,
  onDelete,
}) {
  const [openSections, setOpenSections] = useState({
    information: true,
    details: true,
    history: false,
  });

  useEffect(() => {
    setOpenSections({ information: true, details: true, history: false });
  }, [request?.id]);

  const toggle = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <RequestDetailsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Details"
      subtitle="General request for catalog or unregistered items."
      status={formatStatusLabel(request?.status)}
      identifier={request?.requestNumber}
      dialogClassName="max-w-4xl"
      footerRight={
        loading || !request ? null : (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="danger" size="modal" onClick={onDelete}>
              Delete
            </Button>
            <Button variant="secondary" size="modal" onClick={onEdit}>
              Edit
            </Button>
          </div>
        )
      }
    >
      {loading ? (
        <div className="relative min-h-[180px]">
          <LoadingSpinner variant="overlay" size="sm" />
        </div>
      ) : (
        <>
          <AccordionSection
            title="Request Information"
            open={openSections.information}
            onToggle={() => toggle("information")}
          >
            <DetailRow label="Request Number">{request?.requestNumber}</DetailRow>
            <DetailRow label="Status">
              <SupplyStatusBadge status={request?.status} />
            </DetailRow>
            <DetailRow label="Requested by">
              {requesterName || request?.requestedBy || "—"}
            </DetailRow>
            <DetailRow label="Reason">{request?.reason || "—"}</DetailRow>
            <DetailRow label="Date created">{formatApiDateTime(request?.createdAt)}</DetailRow>
            <DetailRow label="Date updated">{formatApiDateTime(request?.updatedAt)}</DetailRow>
          </AccordionSection>

          <AccordionSection
            title="Items requested"
            open={openSections.details}
            onToggle={() => toggle("details")}
          >
            {(request?.items || []).length === 0 ? (
              <p className="text-[13px] text-slate-400">No items on this request.</p>
            ) : (
              <div className="overflow-x-auto rounded border border-slate-200">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      <th className="px-3 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        Code
                      </th>
                      <th className="px-3 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        Name
                      </th>
                      <th className="px-3 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        Brand
                      </th>
                      <th className="px-3 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-3 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        Qty
                      </th>
                      <th className="px-3 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(request?.items || []).map((item, index) => (
                      <tr key={item.id ?? index}>
                        <td className="px-3 py-3 align-middle font-mono text-[11px] text-slate-600">
                          {item.itemCode || "—"}
                        </td>
                        <td className="px-3 py-3 align-middle text-[12px] font-semibold text-slate-900">
                          {item.name || "—"}
                        </td>
                        <td className="px-3 py-3 align-middle text-[12px] text-slate-700">
                          {item.brand || "—"}
                        </td>
                        <td className="px-3 py-3 align-middle text-[12px] text-slate-700 max-w-[280px]">
                          <span className="line-clamp-2">{item.description || "—"}</span>
                        </td>
                        <td className="px-3 py-3 align-middle text-[12px] font-semibold text-slate-800 tabular-nums">
                          {item.quantity ?? "—"}
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <SupplyStatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AccordionSection>

          {(request?.statusHistory || []).length > 0 ? (
            <AccordionSection
              title="Status history"
              open={openSections.history}
              onToggle={() => toggle("history")}
            >
              <div className="space-y-3">
                {request.statusHistory.map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-slate-100 px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <SupplyStatusBadge status={entry.status} />
                      <span className="text-[11px] text-slate-400">
                        {formatApiDateTime(entry.createdAt)}
                      </span>
                    </div>
                    {entry.comment ? (
                      <p className="mt-1.5 text-[12px] text-slate-600">{entry.comment}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </AccordionSection>
          ) : null}
        </>
      )}
    </RequestDetailsModal>
  );
}
