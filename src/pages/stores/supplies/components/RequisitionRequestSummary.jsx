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
import { supplyStatusKey } from "../utils/supplyStatus";
import {
  DescriptionDisplay,
  ItemNameDisplay,
  StoreLocationDisplay,
  UserNameDisplay,
} from "../../../../components/common/display/FormattedDisplay";

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
              Quantity to Supply
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
              <td className="px-3 py-2 text-[12px] text-slate-800">
                <StoreLocationDisplay value={row.location} />
              </td>
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

const DEFAULT_QUANTITY_FIELDS = ["requested", "toSupply", "supplied", "remaining"];

export default function RequisitionRequestSummary({
  requisition,
  title = "Request details",
  quantityFields = DEFAULT_QUANTITY_FIELDS,
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
  const showDescription = Boolean(description)
    && String(description).trim().toLowerCase() !== String(name || "").trim().toLowerCase();
  const issuingStores = getRequisitionIssuingStores(requisition);
  const storeAllocations = getRequisitionStoreIssueLines(requisition);
  const quantityRequested = requisition.quantityRequested ?? requisition.quantity ?? null;
  const quantityToSupply =
    requisition.quantityToSupply
    ?? requisition.totalQuantityRequested
    ?? null;
  const quantitySupplied =
    requisition.quantitySupplied != null && requisition.quantitySupplied !== ""
      ? Number(requisition.quantitySupplied) || 0
      : null;
  const quantityRejected =
    requisition.quantityRejected != null && requisition.quantityRejected !== ""
      ? Number(requisition.quantityRejected) || 0
      : null;
  const quantityRemaining =
    requisition.quantityRemaining != null && requisition.quantityRemaining !== ""
      ? Number(requisition.quantityRemaining) || 0
      : quantityToSupply != null && quantitySupplied != null
        ? Math.max(0, Number(quantityToSupply) - quantitySupplied - (quantityRejected || 0))
        : getRequisitionRemainingQuantity(requisition) || null;
  const showQuantity = (key) => {
    const status = supplyStatusKey(requisition.status);
    if (
      status === "PENDING_SUPPLY_REQUEST"
      && (key === "toSupply" || key === "supplied" || key === "remaining")
    ) {
      return false;
    }
    if (
      status === "PENDING_SUPPLY_APPROVAL"
      && (key === "supplied" || key === "remaining")
    ) {
      return false;
    }
    return quantityFields.includes(key);
  };
  const isRejected = supplyStatusKey(requisition.status) === "REJECTED";
  const showRejectedQuantity =
    isRejected && (quantityRejected != null || quantityFields.includes("rejected"));
  const progressBase = Number(quantityToSupply ?? quantityRequested) || 0;
  const showSupplyProgress =
    showQuantity("supplied") && Number(quantitySupplied) > 0 && progressBase > 0;
  const hasStoreIssuance = storeAllocations.some((row) => Number(row.quantityIssued) > 0);

  return (
    <AccordionSection title={title} open={open} onToggle={() => setOpen((current) => !current)}>
      <DetailRow label="Request #">{requisition.requestNumber}</DetailRow>
      <DetailRow label="Item code">{requisition.itemCode}</DetailRow>
      <DetailRow label="Name">
        <ItemNameDisplay value={name} />
      </DetailRow>
      {showDescription ? (
        <DetailRow label="Description">
          <DescriptionDisplay value={description} />
        </DetailRow>
      ) : null}
      {showQuantity("requested") ? (
        <DetailRow label="Quantity Requested">
          {quantityRequested == null || quantityRequested === "" ? "—" : String(quantityRequested)}
        </DetailRow>
      ) : null}
      {showQuantity("toSupply") ? (
        <DetailRow label="Quantity to Supply">
          {quantityToSupply == null || quantityToSupply === "" ? "—" : String(quantityToSupply)}
        </DetailRow>
      ) : null}
      {showQuantity("supplied") ? (
        <DetailRow label="Quantity Supplied">
          {quantitySupplied == null ? "—" : String(quantitySupplied)}
        </DetailRow>
      ) : null}
      {showRejectedQuantity ? (
        <DetailRow label="Quantity Rejected">
          {quantityRejected == null ? "—" : String(quantityRejected)}
        </DetailRow>
      ) : null}
      {showQuantity("remaining") ? (
        <DetailRow label="Remaining to Supply">
          {quantityRemaining == null || quantityRemaining === ""
            ? "—"
            : String(quantityRemaining)}
        </DetailRow>
      ) : null}
      {requisition.justification ? (
        <DetailRow label="Justification">{requisition.justification}</DetailRow>
      ) : null}
      <DetailRow label="Date requested">{formatRequisitionDate(requisition.createdAt)}</DetailRow>
      <DetailRow label="Requested by">
        <UserNameDisplay value={requisition.requestedBy} />
      </DetailRow>
      {requisition.approvedBy ? (
        <DetailRow label="Approved by">
          <UserNameDisplay value={requisition.approvedBy} />
        </DetailRow>
      ) : null}
      {requisition.approvalDate ? (
        <DetailRow label="Date of approval">
          {formatRequisitionDate(requisition.approvalDate)}
        </DetailRow>
      ) : requisition.approvedAt ? (
        <DetailRow label="Date of approval">
          {formatRequisitionDate(requisition.approvedAt)}
        </DetailRow>
      ) : null}
      {storeAllocations.length > 0 ? (
        <DetailRow label="Stores & quantity to supply">
          <ul className="space-y-1.5">
            {storeAllocations.map((row) => {
              const supplied = Number(row.quantityIssued) || 0;
              const remaining = row.remaining
                ?? Math.max(0, Number(row.quantity || 0) - supplied);
              return (
                <li
                  key={row.location}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5"
                >
                  <span>
                    <StoreLocationDisplay value={row.location} />
                  </span>
                  <span className="tabular-nums text-slate-500">
                    {supplied > 0 || hasStoreIssuance
                      ? `${supplied} Supplied; ${remaining} Remaining.`
                      : `${row.quantity ?? "—"} to supply`}
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
              <li key={location}>
                <StoreLocationDisplay value={location} />
              </li>
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
        <DetailRow label="Receiver">
          <UserNameDisplay value={requisition.suppliedTo} />
        </DetailRow>
      ) : null}
      <DetailRow label="Status">
        <span className="inline-flex flex-wrap items-center gap-2">
          <SupplyStatusBadge status={requisition.status} />
          {showSupplyProgress ? (
            <span className="text-[12px] font-medium text-slate-500">
              {quantitySupplied} supplied out of {progressBase}
            </span>
          ) : null}
        </span>
      </DetailRow>
    </AccordionSection>
  );
}
