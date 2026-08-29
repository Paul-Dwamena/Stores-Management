import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { MapPin } from "lucide-react";
import Button from "../../../../components/common/base/Button";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";

export default function ArriveTransferChoiceModal({
  isOpen,
  onClose,
  onHold,
  onAccept,
  transferLabel,
  actionSaving = false,
}) {
  const [holdConfirmOpen, setHoldConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) setHoldConfirmOpen(false);
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 animate-in fade-in duration-200"
            style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            onClick={onClose}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 m-4 flex flex-col p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-50 mb-4">
              <MapPin className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Mark as arrived?</h2>
            <p className="text-[12px] text-slate-500 font-medium mb-6">
              {transferLabel ? `${transferLabel} has reached the destination. ` : ""}
              Accept the items into store now, or hold them as arrived and receive later.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 w-full">
              <Button onClick={onClose} variant="ghost" className="flex-1 border border-slate-200" disabled={actionSaving}>
                Cancel
              </Button>
              <Button onClick={() => setHoldConfirmOpen(true)} variant="info" className="flex-1" disabled={actionSaving}>
                Hold
              </Button>
              <Button onClick={onAccept} className="flex-1" disabled={actionSaving}>
                Accept to store
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      <ConfirmationModal
        isOpen={holdConfirmOpen}
        onClose={() => !actionSaving && setHoldConfirmOpen(false)}
        onConfirm={() => {
          onHold();
        }}
        className="!z-[10001]"
        title="Hold this transfer?"
        message={
          transferLabel
            ? `Keep ${transferLabel} as arrived and receive the items into store later?`
            : "Keep these items as arrived and receive them into store later?"
        }
        confirmText="Hold"
        confirmLoading={actionSaving}
        closeOnConfirm={false}
      />
    </>
  );
}
