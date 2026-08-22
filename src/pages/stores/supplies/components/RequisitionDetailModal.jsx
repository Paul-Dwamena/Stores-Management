import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import Button from "../../../../components/common/base/Button";
import RequisitionRequestSummary from "./RequisitionRequestSummary";

export default function RequisitionDetailModal({ isOpen, onClose, requisition }) {
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

  if (!isOpen || !requisition) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 animate-in fade-in duration-200"
        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 m-0 sm:m-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Supply request details</h2>
            <p className="text-[12px] text-slate-500 font-medium mt-1">
              {requisition.requestNumber || "Request summary"}
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
        <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto min-h-0 flex-1">
          <RequisitionRequestSummary requisition={requisition} />
        </div>
        <div className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end rounded-b-2xl">
          <Button onClick={onClose} variant="ghost" size="modal">
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
