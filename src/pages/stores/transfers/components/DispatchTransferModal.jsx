import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Truck } from "lucide-react";
import Button from "../../../../components/common/base/Button";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import ReceiverPicker from "../../supplies/components/ReceiverPicker";
import IssueOtpSection from "../../supplies/components/IssueOtpSection";
import AddReceiverModal from "../../supplies/components/AddReceiverModal";

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 transition-colors text-slate-700";

export default function DispatchTransferModal({
  isOpen,
  onClose,
  onConfirm,
  transferLabel,
}) {
  const [dispatcher, setDispatcher] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [comment, setComment] = useState("");
  const [addReceiverOpen, setAddReceiverOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setDispatcher("");
      setOtpSent(false);
      setOtp("");
      setOtpVerified(false);
      setComment("");
      setAddReceiverOpen(false);
      setConfirmOpen(false);
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = () => {
    if (!dispatcher.trim()) {
      setErrors((prev) => ({ ...prev, dispatcher: "Select the person dispatching." }));
      toast.warning("Select the person dispatching first.");
      return;
    }
    setOtpSent(true);
    toast.info(`OTP sent to ${dispatcher.trim()}.`);
  };

  const handleContinue = () => {
    const nextErrors = {};
    if (!dispatcher.trim()) nextErrors.dispatcher = "Select the person dispatching.";
    else if (!otpVerified) nextErrors.dispatcher = "Verify OTP before dispatching.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setConfirmOpen(true);
  };

  const finalize = () => {
    onConfirm({ dispatcher: dispatcher.trim(), comment: comment.trim() });
    setConfirmOpen(false);
  };

  const close = () => {
    onClose();
  };

  return (
    <>
      {!confirmOpen && !addReceiverOpen
        ? ReactDOM.createPortal(
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-slate-900/60 animate-in fade-in duration-200"
                style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
                onClick={close}
              />
              <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 m-4 flex flex-col p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full shrink-0 bg-sky-50">
                    <Truck className="w-6 h-6 text-sky-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Dispatch transfer</h2>
                    {transferLabel ? (
                      <p className="text-[11px] text-slate-500 mt-0.5">{transferLabel}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <ReceiverPicker
                    label="Person dispatching"
                    placeholder="Select dispatcher"
                    addButtonLabel="Add dispatcher"
                    value={dispatcher}
                    onChange={(value) => {
                      setDispatcher(value);
                      setOtpSent(false);
                      setOtp("");
                      setOtpVerified(false);
                      setErrors((prev) => {
                        if (!prev.dispatcher) return prev;
                        const next = { ...prev };
                        delete next.dispatcher;
                        return next;
                      });
                    }}
                    error={errors.dispatcher}
                    selectClassName={fieldClassName}
                    onAddClick={() => setAddReceiverOpen(true)}
                  />

                  <IssueOtpSection
                    suppliedTo={dispatcher}
                    otpSent={otpSent}
                    otp={otp}
                    otpVerified={otpVerified}
                    onSendOtp={handleSendOtp}
                    onOtpChange={(value) => {
                      setOtp(value);
                      setOtpVerified(false);
                    }}
                    onVerifiedChange={setOtpVerified}
                  />

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Dispatch comment
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      placeholder="Add a dispatch comment…"
                      className={cn(fieldClassName, "resize-none")}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button onClick={close} variant="ghost" className="border border-slate-200">
                    Cancel
                  </Button>
                  <Button onClick={handleContinue} variant="primary" disabled={!otpVerified}>
                    Dispatch
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
        className="!z-[10001]"
        title="Dispatch this transfer?"
        message={
          transferLabel
            ? `Confirm dispatch of ${transferLabel}? Items will be marked as in transit.`
            : "Dispatch this transfer?"
        }
        confirmText="Dispatch"
      />

      <AddReceiverModal
        title="Add dispatcher"
        saveLabel="Add dispatcher"
        isOpen={addReceiverOpen}
        onClose={() => setAddReceiverOpen(false)}
        onCreated={(created) => {
          setDispatcher(created.name);
          setOtpSent(false);
          setOtp("");
          setOtpVerified(false);
          setErrors((prev) => {
            if (!prev.dispatcher) return prev;
            const next = { ...prev };
            delete next.dispatcher;
            return next;
          });
          setAddReceiverOpen(false);
        }}
      />
    </>
  );
}
