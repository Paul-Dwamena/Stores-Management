import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { AlertTriangle } from "lucide-react";
import Button from "../../../../components/common/base/Button";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import { requiredFieldLabel } from "../../../../components/common/fields/requiredFieldLabel";

const MODE_COPY = {
  entire: {
    title: "Reject entirely",
    placeholder: "Explain why this request is being rejected entirely…",
    confirmTitle: "Reject entirely?",
    confirmMessage: (label) =>
      label
        ? `Reject ${label} entirely? This ends the supply request.`
        : "Reject this request entirely? This ends the supply request.",
    confirmText: "Reject entirely",
  },
  store_change: {
    title: "Reject for store change",
    placeholder: "Explain why the store assignment must change…",
    confirmTitle: "Reject for store change?",
    confirmMessage: (label) =>
      label
        ? `Send ${label} back so the store can be changed and the supply request raised again?`
        : "Send this request back so the store can be changed and raised again?",
    confirmText: "Send back for store change",
  },
};

export default function RejectRequisitionModal({
  isOpen,
  onClose,
  onConfirm,
  requestLabel,
  title,
  mode = "entire",
}) {
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const copy = MODE_COPY[mode] || MODE_COPY.entire;
  const heading = title || copy.title;

  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setConfirmOpen(false);
    }
  }, [isOpen, mode]);

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

  const requestConfirmation = () => {
    if (!reason.trim()) return;
    setConfirmOpen(true);
  };

  const finalizeReject = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    onConfirm(trimmed, mode);
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
                    <h2 className="text-base font-extrabold text-slate-900">{heading}</h2>
                    {requestLabel ? (
                      <p className="text-[11px] text-slate-500 mt-0.5">{requestLabel}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-1.5 mb-6">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {requiredFieldLabel("Reason", true)}
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    placeholder={copy.placeholder}
                    autoFocus
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 text-slate-700 resize-none"
                  />
                  {!reason.trim() ? (
                    <p className="text-[10px] text-slate-400">
                      A reason is required to continue.
                    </p>
                  ) : null}
                </div>

                <div className="flex justify-end gap-3">
                  <Button onClick={close} variant="ghost" className="border border-slate-200">
                    Cancel
                  </Button>
                  <Button
                    onClick={requestConfirmation}
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
        title={copy.confirmTitle}
        message={copy.confirmMessage(requestLabel)}
        confirmText={copy.confirmText}
      />
    </>
  );
}
