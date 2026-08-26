import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { ChevronDown, FileText, X } from "lucide-react";
import Button from "../base/Button";
import { cn } from "../../../utils/cn";

export function StatusPill({ status }) {
  const raw = (status ?? "").toString().trim();
  const normalized = raw.toUpperCase().replace(/[\s-]+/g, "_");
  const tone =
    ["APPROVED", "PAID", "ACTIVE", "SUCCESSFUL", "COMPLETED"].includes(normalized)
    || raw === "Approved"
    || raw === "Paid"
    || raw === "Completed"
      ? "bg-success-muted text-success border-[#b7d4c8]"
      : ["PENDING", "PENDING_APPROVAL", "PENDING_DISPATCH"].includes(normalized) || raw === "Pending"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : normalized === "PENDING_SUPPLY_REQUEST" || raw === "Pending Supply Request" || raw === "Pending supply request"
          ? "bg-gray-100 text-gray-700 border-gray-300"
        : normalized === "PENDING_SUPPLY_APPROVAL" || raw === "Pending Supply Approval" || raw === "Pending supply approval"
          ? "bg-amber-50 text-amber-700 border-amber-200"
        : normalized === "PENDING_ISSUANCE" || raw === "Pending Issuance" || raw === "Pending issuance"
          ? "bg-violet-50 text-violet-700 border-violet-200"
        : normalized === "SUPPLIED" || raw === "Supplied"
          ? "bg-success-muted text-success border-[#b7d4c8]"
        : normalized === "PARTIAL_SUPPLIED" || raw === "Partial Supplied" || raw === "Partial supplied"
          ? "bg-sky-50 text-sky-700 border-sky-200"
        : normalized === "IN_TRANSIT" || raw === "In transit"
          ? "bg-sky-50 text-sky-700 border-sky-200"
        : normalized === "ARRIVED" || raw === "Arrived"
          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
        : ["REJECTED", "REJECTED_FOR_RESUBMISSION", "INACTIVE"].includes(normalized)
          || raw === "Rejected"
          || raw === "Rejected For Resubmission"
          ? normalized === "INACTIVE"
            ? "bg-slate-50 text-slate-500 border-slate-200"
            : "bg-rose-50 text-rose-700 border-rose-200"
          : ["CANCELLED", "CANCELED"].includes(normalized) || raw === "Cancelled"
            ? "bg-slate-50 text-slate-500 border-slate-200"
            : "bg-slate-50 text-slate-500 border-slate-200";

  return (
    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border", tone)}>
      {raw || "—"}
    </span>
  );
}

export function DetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 py-2 border-b border-slate-50 last:border-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="text-[13px] text-slate-700 font-medium">{children ?? "—"}</div>
    </div>
  );
}

export function AccordionSection({ title, open, onToggle, children }) {
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

export function FileAttachmentRow({ label, fileName }) {
  return (
    <DetailRow label={label}>
      <span className="inline-flex items-center gap-2 text-primary">
        <FileText size={14} />
        {fileName || "—"}
        <button
          type="button"
          className="text-[11px] font-bold underline underline-offset-2"
          onClick={() => {}}
        >
          View
        </button>
      </span>
    </DetailRow>
  );
}

export default function RequestDetailsModal({
  isOpen,
  onClose,
  title,
  subtitle,
  status,
  identifier,
  children,
  footerRight,
  className,
  dialogClassName,
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={cn("fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4", className)}>
      <div
        className="absolute inset-0 bg-slate-900/60 animate-in fade-in duration-200"
        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        onClick={onClose}
      />

      <div className={cn(
        "relative w-full bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 m-0 sm:m-4 max-h-[90vh] flex flex-col",
        dialogClassName ?? "max-w-3xl",
      )}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
            {subtitle ? (
              <p className="text-[12px] text-slate-500 font-medium mt-1">{subtitle}</p>
            ) : null}
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
          {status || identifier ? (
            <div className="flex flex-wrap items-center gap-2">
              {status ? <StatusPill status={status} /> : null}
              {identifier ? (
                <span className="text-[12px] text-slate-400 font-medium">{identifier}</span>
              ) : null}
            </div>
          ) : null}
          {children}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 rounded-b-2xl shrink-0">
          <Button onClick={onClose} variant="ghost" size="modal" className="border border-slate-200">
            Close
          </Button>
          {footerRight || <div />}
        </div>
      </div>
    </div>,
    document.body,
  );
}
