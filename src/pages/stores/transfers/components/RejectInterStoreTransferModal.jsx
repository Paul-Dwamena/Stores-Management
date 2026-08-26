import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { AlertTriangle } from "lucide-react";
import Button from "../../../../components/common/base/Button";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";

export default function RejectInterStoreTransferModal({
  isOpen,
  onClose,
  onConfirm,
  transferLabel,
}) {
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setConfirmOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const close = () => {
    setReason("");
    setConfirmOpen(false);
    onClose();
  };

  const finalizeReject = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
    setReason("");
    setConfirmOpen(false);
  };

  return (
    <>
      {!confirmOpen
        ? ReactDOM.createPortal(
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-slate-900/60 animate-in fade-in duration-200"
                style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
                onClick={close}
              />
              <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 m-4 flex flex-col p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-50 shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Reject transfer</h2>
                    {transferLabel ? (
                      <p className="text-[11px] text-slate-500 mt-0.5">{transferLabel}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-1.5 mb-6">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Reason
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    placeholder="Explain why this transfer cannot be dispatched…"
                    autoFocus
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 text-slate-700 resize-none"
                  />
                  {!reason.trim() ? (
                    <p className="text-[10px] text-slate-400">A reason is required to continue.</p>
                  ) : null}
                </div>

                <div className="flex justify-end gap-3">
                  <Button onClick={close} variant="ghost" className="border border-slate-200">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => reason.trim() && setConfirmOpen(true)}
                    variant="danger"
                    disabled={!reason.trim()}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={finalizeReject}
        isDanger
        className="!z-[10001]"
        title="Reject this transfer?"
        message={
          transferLabel
            ? `Reject ${transferLabel}? Stock will stay at the sending store.`
            : "Reject this transfer? Stock will stay at the sending store."
        }
        confirmText="Reject transfer"
      />
    </>
  );
}
