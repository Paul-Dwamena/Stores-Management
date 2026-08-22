import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { ChevronDown, X } from "lucide-react";
import { cn } from "../../../../utils/cn";
import Button from "../../../../components/common/base/Button";
import {
  formatRequestAmount,
  formatRequestDateTime,
  formatRequestStatus,
  getRequestTypeLabel,
} from "../utils/requestHelpers";

function StatusBadge({ status }) {
  const normalized = (status ?? "PENDING").toString().toUpperCase();
  const styles = {
    DRAFT: "border-slate-200 bg-slate-50 text-slate-600",
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    REJECTED: "border-red-200 bg-red-50 text-red-600",
    CANCELLED: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide",
        styles[normalized] ?? styles.PENDING,
      )}
    >
      {formatRequestStatus(status)}
    </span>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 py-2 border-b border-slate-50 last:border-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="text-[13px] text-slate-700 font-medium">{children}</div>
    </div>
  );
}

function AccordionSection({ title, open, onToggle, children }) {
  return (
    <div className="border border-slate-200 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 bg-slate-50/80 hover:bg-slate-50 text-left"
      >
        <ChevronDown
          size={16}
          className={cn(
            "text-slate-400 shrink-0 transition-transform",
            open ? "rotate-0" : "-rotate-90",
          )}
        />
        <span className="text-[13px] font-bold text-slate-800">{title}</span>
      </button>
      {open && <div className="p-4 bg-white">{children}</div>}
    </div>
  );
}

export default function RequestDetailModal({ isOpen, onClose, request }) {
  const [openSections, setOpenSections] = useState({
    information: true,
    stores: true,
    vehicle: true,
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setOpenSections({ information: true, stores: true, vehicle: true });
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !request) return null;

  const toggle = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 animate-in fade-in duration-200"
        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 m-0 sm:m-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Request Details</h2>
            <p className="text-[12px] text-slate-500 font-medium mt-1">
              Complete information about this request.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-6 overflow-y-auto min-h-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={request.status} />
            <span className="text-[12px] text-slate-400 font-medium">
              {request.requestNumber}
            </span>
          </div>

          <AccordionSection
            title="Request Information"
            open={openSections.information}
            onToggle={() => toggle("information")}
          >
            <DetailRow label="Request Number">{request.requestNumber}</DetailRow>
            <DetailRow label="Request Type">
              {getRequestTypeLabel(request.requestType)}
            </DetailRow>
            <DetailRow label="Status">
              <StatusBadge status={request.status} />
            </DetailRow>
            <DetailRow label="Approval Status">{request.approvalStatus || "—"}</DetailRow>
            <DetailRow label="Payment Status">{request.paymentStatus || "—"}</DetailRow>
            <DetailRow label="Amount">{formatRequestAmount(request.amount)}</DetailRow>
            <DetailRow label="Purpose">{request.purpose || "—"}</DetailRow>
            <DetailRow label="Submitted Date">
              {formatRequestDateTime(request.submittedDate)}
            </DetailRow>
            <DetailRow label="Approved By">{request.approvedBy || "—"}</DetailRow>
            <DetailRow label="Approval Date">
              {formatRequestDateTime(request.approvalDate)}
            </DetailRow>
          </AccordionSection>

          {request.storesDetails ? (
            <AccordionSection
              title="Store Request Details"
              open={openSections.stores}
              onToggle={() => toggle("stores")}
            >
              <DetailRow label="Store request #">
                {request.storesDetails.requestNumber || "—"}
              </DetailRow>
              <DetailRow label="Item">
                {request.storesDetails.itemName || "—"}
                {request.storesDetails.quantity != null
                  ? ` × ${request.storesDetails.quantity}`
                  : ""}
              </DetailRow>
              {request.storesDetails.itemCode ? (
                <DetailRow label="Item code">{request.storesDetails.itemCode}</DetailRow>
              ) : null}
              {request.storesDetails.justification ? (
                <DetailRow label="Justification">
                  {request.storesDetails.justification}
                </DetailRow>
              ) : null}
              {request.storesDetails.fromStore ? (
                <DetailRow label="From store">{request.storesDetails.fromStore}</DetailRow>
              ) : null}
              {Array.isArray(request.storesDetails.lines) && request.storesDetails.lines.length ? (
                <DetailRow label="Lines">
                  {request.storesDetails.lines
                    .map((line) => `${line.itemCode} × ${line.movingQuantity} → ${line.toStore}`)
                    .join("; ")}
                </DetailRow>
              ) : null}
            </AccordionSection>
          ) : null}

          {request.vehicleRequestDetails ? (
            <AccordionSection
              title="Vehicle Request Details"
              open={openSections.vehicle}
              onToggle={() => toggle("vehicle")}
            >
              <DetailRow label="Driver">
                {request.vehicleRequestDetails.driverName || "—"}
              </DetailRow>
              <DetailRow label="Vehicle">
                {request.vehicleRequestDetails.vehicleLabel || "—"}
              </DetailRow>
              <DetailRow label="Reason">
                {request.vehicleRequestDetails.reason || request.purpose || "—"}
              </DetailRow>
            </AccordionSection>
          ) : null}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 rounded-b-2xl shrink-0">
          <Button onClick={onClose} variant="ghost" size="modal" className="border border-slate-200">
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
