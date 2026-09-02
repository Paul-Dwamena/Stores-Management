import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import Button from "../../../../components/common/base/Button";
import InputField from "../../../../components/common/fields/InputField";
import { requiredFieldLabel } from "../../../../components/common/fields/requiredFieldLabel";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import { verifyDispatcherConfirmationOtp } from "../../../../services/transfersService";

function resolveDispatcher(dispatcherId, dispatchers = []) {
  const key = String(dispatcherId || "").trim();
  if (!key) return null;
  return (
    dispatchers.find(
      (person) =>
        String(person.id) === key ||
        person.name === key ||
        [person.firstName, person.lastName].filter(Boolean).join(" ").trim() === key,
    ) || null
  );
}

export default function DispatcherOtpSection({
  dispatcherId,
  dispatchers = [],
  dispatcherName = "",
  dispatcherPhone = "",
  otpSent,
  otp,
  otpVerified,
  onSendOtp,
  onOtpChange,
  onVerifiedChange,
  sendDisabled = false,
  sendLoading = false,
  itemCount,
  required = true,
  detailsConfirmed = false,
  purpose = "pickup",
}) {
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const dispatcher = useMemo(
    () => resolveDispatcher(dispatcherId, dispatchers),
    [dispatcherId, dispatchers],
  );
  const name =
    dispatcher?.name
    || String(dispatcherName || "").trim()
    || String(dispatcherId || "").trim()
    || "the selected dispatcher";
  const phone = dispatcher?.phone?.trim() || String(dispatcherPhone || "").trim() || "";
  const itemLabel = Number.isFinite(itemCount)
    ? ` for the ${itemCount} selected item${itemCount === 1 ? "" : "s"}`
    : "";
  const isDelivery = purpose === "delivery";
  const actionLabel = isDelivery ? "Receive to store" : "Request approval";
  const verificationTitle = isDelivery
    ? "Dispatcher delivery verification"
    : "Dispatcher verification";
  const lockedHint = isDelivery
    ? "Confirm the transfer items first. OTP verification unlocks afterwards as the final step before receiving to store."
    : "Confirm store, items, and dispatcher details first. OTP verification unlocks afterwards as the final step before requesting approval.";
  const confirmedHint = isDelivery
    ? "You can now receive to store."
    : "You can now request approval.";
  const pendingHint = isDelivery
    ? "Confirm the code they receive before booking items into store."
    : "Confirm the code they receive before requesting approval.";

  useEffect(() => {
    setOtpError("");
  }, [otpSent, dispatcherId, dispatcherName, dispatcherPhone]);

  const handleConfirmOtp = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      const message = "Enter the 6-digit OTP sent to the dispatcher.";
      setOtpError(message);
      toast.warning(message);
      onVerifiedChange?.(false);
      return;
    }
    if (!phone) {
      const message = "Dispatcher phone is required to verify the OTP.";
      setOtpError(message);
      toast.warning(message);
      onVerifiedChange?.(false);
      return;
    }
    setVerifying(true);
    try {
      await verifyDispatcherConfirmationOtp({ phone, otp: otp.trim() });
      setOtpError("");
      onVerifiedChange?.(true);
      toast.success("OTP confirmed.");
    } catch (error) {
      const message = error.message || "The OTP does not match the code sent to this number.";
      setOtpError(message);
      toast.error(message);
      onVerifiedChange?.(false);
    } finally {
      setVerifying(false);
    }
  };

  if (!detailsConfirmed) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-2">
        <p className="text-[12px] font-bold text-slate-800">OTP confirmation</p>
        <p className="text-[12px] text-slate-500">{lockedHint}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-4",
        otpVerified
          ? "border-slate-200 bg-slate-50"
          : otpSent
            ? "border-amber-200 bg-amber-50/30"
            : "border-slate-200 bg-slate-50/40",
      )}
    >
      <div>
        <p className="text-[12px] font-bold text-slate-800">
          {otpVerified
            ? "OTP confirmed"
            : requiredFieldLabel(verificationTitle, true)}
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
              {itemLabel}. {confirmedHint}
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
              {itemLabel}. {pendingHint}
            </>
          )}
        </p>
      </div>

      {!otpVerified ? (
        otpSent ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button
              variant="outline"
              size="md"
              onClick={onSendOtp}
              disabled={sendDisabled || sendLoading}
              className="min-w-[140px] shrink-0 bg-white border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300"
            >
              <RefreshCw size={15} className={sendLoading ? "animate-spin" : undefined} />
              {sendLoading ? "Sending…" : "Resend OTP"}
            </Button>
            <p className="flex items-center gap-1.5 text-[12px] font-medium text-success">
              <CheckCircle2 size={14} className="shrink-0" />
              OTP sent to {name}
              {phone ? ` on ${phone}` : ""}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              variant="primary"
              size="md"
              onClick={onSendOtp}
              disabled={sendDisabled || sendLoading}
              className="min-w-[140px]"
            >
              <KeyRound size={15} />
              {sendLoading ? "Sending…" : "Send OTP"}
            </Button>
            <p className="text-[11px] font-medium text-slate-400">
              Send and confirm the OTP to enable {actionLabel}
            </p>
          </div>
        )
      ) : (
        <p className="flex items-center gap-1.5 text-[12px] font-medium text-success">
          <CheckCircle2 size={14} className="shrink-0" />
          OTP confirmed for {name}
          {phone ? ` on ${phone}` : ""}
        </p>
      )}

      {otpSent && !otpVerified ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="max-w-xs flex-1">
            <InputField
              id="transferDispatcherOtp"
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
            disabled={otp.length !== 6 || verifying}
            className="min-w-[140px] sm:mt-[22px]"
          >
            <ShieldCheck size={15} />
            {verifying ? "Confirming…" : "Confirm OTP"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
