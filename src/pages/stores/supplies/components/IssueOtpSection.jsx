import React, { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import Button from "../../../../components/common/base/Button";
import InputField from "../../../../components/common/fields/InputField";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import { getReceiverByName, MOCK_ISSUE_OTP } from "../../../../mockdata/stores";

export default function IssueOtpSection({
  suppliedTo,
  otpSent,
  otp,
  otpVerified,
  onSendOtp,
  onOtpChange,
  onVerifiedChange,
  sendDisabled = false,
  itemCount,
  required = true,
}) {
  const [otpError, setOtpError] = useState("");
  const receiver = getReceiverByName(suppliedTo);
  const name = suppliedTo.trim() || "the selected receiver";
  const phone = receiver?.phone || "";
  const itemLabel = Number.isFinite(itemCount)
    ? ` for the ${itemCount} ticked item(s)`
    : "";

  useEffect(() => {
    setOtpError("");
  }, [otpSent, suppliedTo]);

  const handleConfirmOtp = () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      const message = "Enter the 6-digit OTP sent to the receiver.";
      setOtpError(message);
      toast.warning(message);
      onVerifiedChange?.(false);
      return;
    }
    if (otp.trim() !== MOCK_ISSUE_OTP) {
      const message = "The OTP does not match the code sent to this number.";
      setOtpError(message);
      toast.error(message);
      onVerifiedChange?.(false);
      return;
    }
    setOtpError("");
    onVerifiedChange?.(true);
    toast.success("OTP confirmed.");
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-4",
        otpVerified
          ? "border-emerald-200 bg-emerald-50/40"
          : otpSent
            ? "border-amber-200 bg-amber-50/30"
            : "border-slate-200 bg-slate-50/40",
      )}
    >
      <div>
        <p className="text-[12px] font-bold text-slate-800">
          {otpVerified ? "OTP confirmed" : "Receiver verification"}
        </p>
        <p className="text-[12px] text-slate-500 mt-1">
          {otpVerified ? (
            <>
              OTP confirmed for{" "}
              <span className="font-semibold text-slate-700">{name}</span>
              {phone ? (
                <>
                  {" "}
                  on{" "}
                  <span className="font-semibold text-slate-700">{phone}</span>
                </>
              ) : null}
              {itemLabel}. You can now confirm issue.
            </>
          ) : otpSent ? (
            <>
              OTP sent to{" "}
              <span className="font-semibold text-slate-700">{name}</span>
              {phone ? (
                <>
                  {" "}
                  on{" "}
                  <span className="font-semibold text-slate-700">{phone}</span>
                </>
              ) : null}
              {itemLabel}. Enter the code they received to continue.
            </>
          ) : (
            <>
              An OTP will be sent to{" "}
              <span className="font-semibold text-slate-700">{name}</span>
              {phone ? (
                <>
                  {" "}
                  on{" "}
                  <span className="font-semibold text-slate-700">{phone}</span>
                </>
              ) : null}
              {itemLabel}. Confirm the code they receive before issuing.
            </>
          )}
        </p>
      </div>

      {!otpVerified ? (
        <div className="space-y-2">
          <Button
            variant={otpSent ? "outline" : "primary"}
            size="md"
            onClick={onSendOtp}
            disabled={sendDisabled}
            className={cn(
              "min-w-[140px]",
              otpSent && "bg-white border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300",
            )}
          >
            {otpSent ? <RefreshCw size={15} /> : <KeyRound size={15} />}
            {otpSent ? "Resend OTP" : "Send OTP"}
          </Button>

          {otpSent ? (
            <p className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-700">
              <CheckCircle2 size={14} className="shrink-0" />
              OTP sent to {name}
              {phone ? ` on ${phone}` : ""}
            </p>
          ) : (
            <p className="text-[11px] font-medium text-slate-400">
              Send and confirm the OTP to enable Confirm issue
            </p>
          )}
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-700">
          <CheckCircle2 size={14} className="shrink-0" />
          OTP confirmed for {name}
          {phone ? ` on ${phone}` : ""}
        </p>
      )}

      {otpSent && !otpVerified ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="max-w-xs flex-1">
            <InputField
              id="issueOtp"
              label="Enter OTP"
              required={required}
              value={otp}
              onChange={(event) => {
                setOtpError("");
                onOtpChange?.(event.target.value.replace(/\D/g, "").slice(0, 6));
              }}
              placeholder="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              error={otpError}
            />
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleConfirmOtp}
            disabled={otp.length !== 6}
            className="min-w-[140px]"
          >
            <ShieldCheck size={15} />
            Confirm OTP
          </Button>
        </div>
      ) : null}
    </div>
  );
}
