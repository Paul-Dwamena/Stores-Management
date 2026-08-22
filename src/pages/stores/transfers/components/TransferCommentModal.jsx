import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { AlertTriangle, MessageSquare } from "lucide-react";
import Button from "../../../../components/common/base/Button";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";

export default function TransferCommentModal({
  isOpen,
  onClose,
  onConfirm,
  transferLabel,
  title = "Add a comment",
  placeholder = "Add a comment…",
  confirmTitle = "Continue?",
  confirmMessage,
  confirmText = "Confirm",
  isDanger = false,
  continueLabel = "Continue",
}) {
  const [comment, setComment] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setComment("");
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
    setComment("");
    setConfirmOpen(false);
    onClose();
  };

  const finalize = () => {
    const trimmed = comment.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
    setComment("");
    setConfirmOpen(false);
  };

  const Icon = isDanger ? AlertTriangle : MessageSquare;

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
                  <div
                    className={`flex items-center justify-center h-12 w-12 rounded-full shrink-0 ${
                      isDanger ? "bg-red-50" : "bg-sky-50"
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isDanger ? "text-red-600" : "text-sky-600"}`} />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
                    {transferLabel ? (
                      <p className="text-[11px] text-slate-500 mt-0.5">{transferLabel}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-1.5 mb-6">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Comment
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder={placeholder}
                    autoFocus
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 text-slate-700 resize-none"
                  />
                  {!comment.trim() ? (
                    <p className="text-[10px] text-slate-400">A comment is required to continue.</p>
                  ) : null}
                </div>

                <div className="flex justify-end gap-3">
                  <Button onClick={close} variant="ghost" className="border border-slate-200">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => comment.trim() && setConfirmOpen(true)}
                    variant={isDanger ? "danger" : "primary"}
                    disabled={!comment.trim()}
                  >
                    {continueLabel}
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
        onConfirm={finalize}
        isDanger={isDanger}
        className="!z-[10001]"
        title={confirmTitle}
        message={
          confirmMessage
          || (transferLabel ? `Continue with ${transferLabel}?` : "Continue with this transfer?")
        }
        confirmText={confirmText}
      />
    </>
  );
}
