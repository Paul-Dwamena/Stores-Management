import React from "react";
import AddModal from "../../../components/common/AddModal";
import { cn } from "../../../utils/cn";
import { EMPTY_DISPLAY } from "../../../utils/apiResponseHelpers";
import { formatSmsWhen } from "../../../services/smsAuditService";

function MetaItem({ label, value, className, mono = false }) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p
        className={cn(
          "break-words text-[13px] font-medium text-slate-800",
          mono && "font-mono tracking-wider",
        )}
      >
        {value || EMPTY_DISPLAY}
      </p>
    </div>
  );
}

function StatusBadge({ label, active }) {
  return (
    <span
      className={
        active
          ? "inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
          : "inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
      }
    >
      {label || EMPTY_DISPLAY}
    </span>
  );
}

export default function SmsRecordDetailModal({ isOpen, onClose, record, kind }) {
  if (!record) return null;

  const isPasswordReset = kind === "password-reset";
  const userLabel = record.user?.email
    ? `${record.user.name} (${record.user.email})`
    : record.user?.name || (record.userId != null ? `User #${record.userId}` : EMPTY_DISPLAY);

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      title={isPasswordReset ? "Password-reset SMS" : "OTP verification SMS"}
      subtitle={
        isPasswordReset
          ? userLabel
          : record.phone || record.otpTypeLabel || "Verification record"
      }
      dialogClassName="max-w-xl"
      hideCancelButton
      saveLabel="Close"
      onSave={onClose}
    >
      <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2">
        <MetaItem label="OTP" value={record.otp} mono />
        <MetaItem
          label="Status"
          value={
            <StatusBadge
              label={record.status}
              active={isPasswordReset ? Boolean(record.usedAt) : Boolean(record.isVerified)}
            />
          }
        />
        <MetaItem label="Created at" value={formatSmsWhen(record.createdAt)} />
        <MetaItem label="Expires at" value={formatSmsWhen(record.expiresAt)} />

        {isPasswordReset ? (
          <>
            <MetaItem
              label="Attempts"
              value={record.attempts == null ? EMPTY_DISPLAY : String(record.attempts)}
            />
            <MetaItem label="Used at" value={formatSmsWhen(record.usedAt)} />
            <MetaItem label="User" value={userLabel} className="sm:col-span-2" />
            <MetaItem
              label="User ID"
              value={record.userId != null ? String(record.userId) : EMPTY_DISPLAY}
            />
          </>
        ) : (
          <>
            <MetaItem label="Verified at" value={formatSmsWhen(record.verifiedAt)} />
            <MetaItem label="Phone" value={record.phone} />
            <MetaItem label="Type" value={record.otpTypeLabel} />
          </>
        )}
      </div>
    </AddModal>
  );
}
