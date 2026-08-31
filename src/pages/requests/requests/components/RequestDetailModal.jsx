import React, { useEffect, useState } from "react";
import RequestDetailsModal, {
  AccordionSection,
  DetailRow,
} from "../../../../components/common/details/RequestDetailsModal";
import Button from "../../../../components/common/base/Button";
import LoadingSpinner from "../../../../components/common/LoadingSpinner";
import { formatApiDateTime, formatStatusLabel } from "../../../../utils/apiResponseHelpers";
import { SupplyStatusBadge } from "../../../stores/supplies/utils/SupplyStatusBadge";
import {
  BrandDisplay,
  DescriptionDisplay,
  ItemNameDisplay,
} from "../../../../components/common/display/FormattedDisplay";

export default function RequestDetailModal({
  isOpen,
  onClose,
  request,
  issuances = [],
  users = [],
  requesterName,
  loading = false,
  onDelete,
}) {
  const [openSections, setOpenSections] = useState({
    information: true,
    details: true,
    issuances: true,
    history: true,
  });

  useEffect(() => {
    setOpenSections({
      information: true,
      details: true,
      issuances: true,
      history: true,
    });
  }, [request?.id]);

  const toggle = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const resolveChangedByName = (entry) => {
    if (entry?.changedByName) return entry.changedByName;
    const match = users.find((user) => Number(user.id) === Number(entry?.changedBy));
    return match?.name || "—";
  };

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
                        <td className="px-3 py-3 align-middle text-[12px]">
                          <ItemNameDisplay value={item.name} className="text-slate-900" />
                        </td>
                        <td className="px-3 py-3 align-middle text-[12px]">
                          <BrandDisplay value={item.brand} />
                        </td>
                        <td className="px-3 py-3 align-middle text-[12px] text-slate-700 max-w-[280px]">
                          <span className="line-clamp-2">
                            <DescriptionDisplay value={item.description} />
                          </span>
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

          <AccordionSection
            title={`Issuance history${issuances.length ? ` (${issuances.length})` : ""}`}
            open={openSections.issuances}
            onToggle={() => toggle("issuances")}
          >
            {issuances.length === 0 ? (
              <p className="text-[13px] text-slate-400">No issuances recorded for this request yet.</p>
            ) : (
              <div className="overflow-x-auto rounded border border-slate-200">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      <th className="px-3 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-3 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        Store
                      </th>
                      <th className="px-3 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        Qty issued
                      </th>
                      <th className="px-3 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {issuances.flatMap((issuance) => {
                      const items = (issuance.items || []).length
                        ? issuance.items
                        : [null];
                      return items.map((item, index) => (
                        <tr key={`${issuance.id}-${item?.id ?? index}`}>
                          <td className="px-3 py-3 align-top text-[12px] text-slate-800 min-w-[220px]">
                            <p>
                              <span className="font-semibold text-slate-900">
                                {item?.itemName || "—"}
                              </span>
                              {item?.itemCode ? (
                                <span className="ml-1.5 font-mono text-[11px] text-slate-500">
                                  {item.itemCode}
                                </span>
                              ) : null}
                            </p>
                            <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
                              <span>
                                <span className="font-semibold text-slate-600">Issued by</span>{" "}
                                {issuance.issuerName || "—"}
                              </span>
                              <span className="mx-1.5 text-slate-300">·</span>
                              <span>
                                <span className="font-semibold text-slate-600">Received by</span>{" "}
                                {issuance.receiverName || "—"}
                              </span>
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                              <span className="font-semibold text-slate-600">Comment:</span>{" "}
                              {issuance.comment?.trim() ? issuance.comment : "—"}
                            </p>
                          </td>
                          <td className="px-3 py-3 align-top text-[12px] text-slate-700 whitespace-nowrap">
                            {item?.storeName || "—"}
                          </td>
                          <td className="px-3 py-3 align-top text-[12px] font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                            {item?.quantityIssued ?? "—"}
                          </td>
                          <td className="px-3 py-3 align-top text-[12px] text-slate-600 whitespace-nowrap">
                            {formatApiDateTime(issuance.createdAt)}
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </AccordionSection>

          <AccordionSection
            title={`Status history${(request?.statusHistory || []).length ? ` (${request.statusHistory.length})` : ""}`}
            open={openSections.history}
            onToggle={() => toggle("history")}
          >
            {(request?.statusHistory || []).length === 0 ? (
              <p className="text-[13px] text-slate-400">No status history recorded for this request yet.</p>
            ) : (
              <div className="space-y-3">
                {request.statusHistory.map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-slate-100 px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {entry.fromStatus ? (
                          <>
                            <SupplyStatusBadge status={entry.fromStatus} />
                            <span className="text-[11px] text-slate-400">→</span>
                          </>
                        ) : null}
                        <SupplyStatusBadge status={entry.toStatus || entry.status} />
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formatApiDateTime(entry.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[12px] text-slate-600">
                      <span className="font-semibold text-slate-700">Changed by:</span>{" "}
                      {resolveChangedByName(entry)}
                    </p>
                    {entry.comment ? (
                      <p className="mt-1.5 text-[12px] text-slate-600">
                        <span className="font-semibold text-slate-700">Comment:</span>{" "}
                        {entry.comment}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </AccordionSection>
        </>
      )}
    </RequestDetailsModal>
  );
}
