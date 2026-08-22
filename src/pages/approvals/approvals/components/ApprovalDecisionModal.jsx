import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import Button from "../../../../components/common/base/Button";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import { cn } from "../../../../utils/cn";

export const APPROVAL_REJECTION_REASONS = [
  "Incomplete documentation",
  "Budget / funding unavailable",
  "Policy non-compliance",
  "Incorrect request details",
  "Duplicate request",
  "Requires clarification",
  "Other",
];

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 transition-colors text-slate-700";

/**
 * Decision step for Request Details — approve needs comments;
 * reject needs a reason selection plus comments.
 * After the form is valid, a confirmation modal is shown before finalizing.
 */
export default function ApprovalDecisionModal({
  isOpen,
  onClose,
  onConfirm,
  type = "approve",
  requestLabel = "",
}) {
  const isReject = type === "reject";
  const [rejectionReason, setRejectionReason] = useState("");
  const [comments, setComments] = useState("");
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setRejectionReason("");
      setComments("");
      setErrors({});
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

  const resetForm = () => {
    setRejectionReason("");
    setComments("");
    setErrors({});
    setConfirmOpen(false);
  };

  const close = () => {
    resetForm();
    onClose();
  };

  const requestConfirmation = () => {
    const nextErrors = {};
    if (isReject && !rejectionReason) {
      nextErrors.rejectionReason = "Select a reason for rejection.";
    }
    if (!comments.trim()) {
      nextErrors.comments = isReject
        ? "Add comments for this rejection."
        : "Add comments for this approval.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setConfirmOpen(true);
  };

  const finalizeDecision = () => {
    onConfirm({
      type,
      comments: comments.trim(),
      rejectionReason: isReject ? rejectionReason : undefined,
    });
    resetForm();
  };

  return (
    <>
      {!confirmOpen
        ? ReactDOM.createPortal(
            <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-slate-900/60 animate-in fade-in duration-200"
                style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
                onClick={close}
              />

              <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 m-4 flex flex-col p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      "flex items-center justify-center h-12 w-12 rounded-full shrink-0",
                      isReject ? "bg-red-50" : "bg-brand-muted",
                    )}
                  >
                    {isReject ? (
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-brand" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      {isReject ? "Reject for resubmission" : "Approve request"}
                    </h2>
                    {requestLabel ? (
                      <p className="text-[11px] text-slate-500 mt-0.5">{requestLabel}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {isReject ? (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Reason for rejection <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={rejectionReason}
                        onChange={(e) => {
                          setRejectionReason(e.target.value);
                          setErrors((prev) => ({ ...prev, rejectionReason: undefined }));
                        }}
                        className={cn(
                          fieldClassName,
                          errors.rejectionReason && "border-rose-300 focus:border-rose-400",
                        )}
                      >
                        <option value="">Select reason…</option>
                        {APPROVAL_REJECTION_REASONS.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>
                      {errors.rejectionReason ? (
                        <p className="text-[10px] text-rose-600">{errors.rejectionReason}</p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Comments <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => {
                        setComments(e.target.value);
                        setErrors((prev) => ({ ...prev, comments: undefined }));
                      }}
                      rows={4}
                      placeholder={
                        isReject
                          ? "Add comments explaining this rejection…"
                          : "Add comments for this approval…"
                      }
                      autoFocus={!isReject}
                      className={cn(
                        fieldClassName,
                        "resize-none",
                        errors.comments && "border-rose-300 focus:border-rose-400",
                      )}
                    />
                    {errors.comments ? (
                      <p className="text-[10px] text-rose-600">{errors.comments}</p>
                    ) : (
                      <p className="text-[10px] text-slate-400">
                        {isReject
                          ? "A rejection reason and comments are required."
                          : "Comments are required to approve this request."}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button onClick={close} variant="ghost" className="border border-slate-200">
                    Cancel
                  </Button>
                  <Button
                    onClick={requestConfirmation}
                    variant={isReject ? "danger" : "primary"}
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
        className="z-[10060]"
        onClose={() => setConfirmOpen(false)}
        onConfirm={finalizeDecision}
        title={isReject ? "Confirm rejection?" : "Confirm approval?"}
        message={
          isReject
            ? `Reject ${requestLabel || "this request"} for resubmission? Reason: ${rejectionReason}.`
            : `Approve ${requestLabel || "this request"}? This moves it into Approval History.`
        }
        confirmText={isReject ? "Reject" : "Approve"}
        cancelText="Back"
        isDanger={isReject}
        icon={isReject ? AlertTriangle : CheckCircle2}
      />
    </>
  );
}
