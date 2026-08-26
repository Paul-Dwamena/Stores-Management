import React, { useEffect, useState } from "react";
import {
  AccordionSection,
  DetailRow,
} from "../../../../components/common/details/RequestDetailsModal";
import {
  formatRequisitionDate,
  getRequisitionRemainingQuantity,
} from "../../../../mockdata/stores";
import { getRequisitionIssuingStores, getRequisitionStoreIssueLines } from "./RaiseSupplyRequestModal";
import { SupplyStatusBadge } from "../utils/SupplyStatusBadge";

export function StoreAllocationsTable({ allocations = [] }) {
  if (!allocations.length) {
    return <p className="text-[12px] text-slate-400">No store quantities recorded.</p>;
  }
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-100">
            <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Store
            </th>
            <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
              Quantity supplied
            </th>
            {allocations.some((row) => Number(row.quantityIssued) > 0) ? (
              <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Remaining
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 bg-white">
          {allocations.map((row) => (
            <tr key={row.location}>
              <td className="px-3 py-2 text-[12px] text-slate-800">{row.location}</td>
              <td className="px-3 py-2 text-[12px] font-semibold text-slate-800 whitespace-nowrap">
                {row.quantity ?? "—"}
              </td>
              {allocations.some((item) => Number(item.quantityIssued) > 0) ? (
                <td className="px-3 py-2 text-[12px] font-semibold text-slate-800 whitespace-nowrap">
                  {row.remaining ?? Math.max(0, Number(row.quantity || 0) - Number(row.quantityIssued || 0))}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RequisitionRequestSummary({
  requisition,
  title = "Request details",
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(true);
  }, [requisition?.id]);

  if (!requisition) return null;

  const isVehicleParts = requisition.kind === "vehicle_parts";
  const name = isVehicleParts
    ? (
      requisition.level6
      || requisition.level5
      || requisition.level4
      || requisition.level3
      || requisition.level2
      || requisition.level1
      || requisition.itemName
    )
    : requisition.itemName;
  const description = isVehicleParts
    ? requisition.componentPath || requisition.description
    : requisition.description;
  const issuingStores = getRequisitionIssuingStores(requisition);
  const storeAllocations = getRequisitionStoreIssueLines(requisition);

  return (
    <AccordionSection title={title} open={open} onToggle={() => setOpen((current) => !current)}>
      <DetailRow label="Request #">{requisition.requestNumber}</DetailRow>
      <DetailRow label="Item code">{requisition.itemCode}</DetailRow>
      <DetailRow label="Name">{name}</DetailRow>
      <DetailRow label="Description">{description}</DetailRow>
      <DetailRow label="Quantity requested">
        {String(requisition.quantityRequested ?? requisition.quantity ?? "—")}
      </DetailRow>
      {requisition.quantitySupplied != null ? (
        <DetailRow label="Quantity supplied">{String(requisition.quantitySupplied)}</DetailRow>
      ) : null}
      {requisition.status === "PARTIAL_SUPPLIED" || getRequisitionRemainingQuantity(requisition) > 0 ? (
        <DetailRow label="Quantity remaining">
          {String(getRequisitionRemainingQuantity(requisition))}
        </DetailRow>
      ) : null}
      {requisition.justification ? (
        <DetailRow label="Justification">{requisition.justification}</DetailRow>
      ) : null}
      <DetailRow label="Date requested">{formatRequisitionDate(requisition.createdAt)}</DetailRow>
      <DetailRow label="Requested by">{requisition.requestedBy}</DetailRow>
      {requisition.approvedBy ? (
        <DetailRow label="Approved by">{requisition.approvedBy}</DetailRow>
      ) : null}
      {requisition.approvalDate ? (
        <DetailRow label="Date of approval">
          {formatRequisitionDate(requisition.approvalDate)}
        </DetailRow>
      ) : null}
      {storeAllocations.length > 0 ? (
        <DetailRow label="Stores & quantity supplied">
          <ul className="space-y-1.5">
            {storeAllocations.map((row) => {
              const remaining = row.remaining
                ?? Math.max(0, Number(row.quantity || 0) - Number(row.quantityIssued || 0));
              const showRemaining = storeAllocations.some((item) => Number(item.quantityIssued) > 0);
              return (
                <li
                  key={row.location}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5"
                >
                  <span>{row.location}</span>
                  <span className="tabular-nums text-slate-500">
                    {row.quantity ?? "—"} supplied
                    {showRemaining ? ` · ${remaining} remaining` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </DetailRow>
      ) : issuingStores.length > 0 ? (
        <DetailRow label="Issuing from">
          <ul className="space-y-1.5">
            {issuingStores.map((location) => (
              <li key={location}>{location}</li>
            ))}
          </ul>
        </DetailRow>
      ) : null}
      {requisition.comment ? (
        <DetailRow label="Comment">{requisition.comment}</DetailRow>
      ) : null}
      {requisition.approvalComment ? (
        <DetailRow label="Approval comment">{requisition.approvalComment}</DetailRow>
      ) : null}
      {requisition.rejectionComment ? (
        <DetailRow label="Rejection reason">{requisition.rejectionComment}</DetailRow>
      ) : null}
      {requisition.suppliedTo ? (
        <DetailRow label="Receiver">{requisition.suppliedTo}</DetailRow>
      ) : null}
      <DetailRow label="Status">
        <SupplyStatusBadge status={requisition.status} />
      </DetailRow>
    </AccordionSection>
  );
}
