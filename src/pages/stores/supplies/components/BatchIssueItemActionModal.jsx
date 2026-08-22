import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Minus, Trash2 } from "lucide-react";
import AddModal from "../../../../components/common/AddModal";
import Button from "../../../../components/common/base/Button";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import {
  formatRequisitionDate,
  getReceiverByName,
  isRequisitionIssuable,
} from "../../../../mockdata/stores";
import {
  getRequisitionItemState,
  getRequisitionStoreIssueLines,
  getStoreIssueRemaining,
  getStoresWithRemainingQty,
} from "./RaiseSupplyRequestModal";
import ReceiverPicker from "./ReceiverPicker";
import AddReceiverModal from "./AddReceiverModal";
import IssueOtpSection from "./IssueOtpSection";
import RejectRequisitionModal from "./RejectRequisitionModal";

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 transition-colors text-slate-700";

function itemLabel(row) {
  return (
    row.itemName
    || row.level6
    || row.level5
    || row.level4
    || row.level3
    || row.level2
    || row.level1
    || "—"
  );
}

function RowCheckbox({ checked, indeterminate = false, onChange, label, disabled = false }) {
  return (
    <label
      className={cn(
        "inline-flex items-center justify-center",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "flex size-4 items-center justify-center rounded border transition-colors",
          checked
            ? "border-emerald-500 bg-emerald-500 text-white"
            : indeterminate
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-slate-300 bg-white text-transparent",
        )}
      >
        {checked ? (
          <Check size={10} strokeWidth={3} />
        ) : indeterminate ? (
          <Minus size={10} strokeWidth={3} />
        ) : (
          <Check size={10} strokeWidth={3} className="opacity-0" />
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        ref={(el) => {
          if (el) el.indeterminate = Boolean(indeterminate && !checked);
        }}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
        aria-label={label}
      />
    </label>
  );
}

const thClass =
  "px-3 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-left";

const tdClass = "px-3 py-3 align-middle text-[12px] text-slate-700";

function RemoveRowButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
      aria-label={label}
    >
      <Trash2 size={14} />
    </button>
  );
}

export default function BatchIssueItemActionModal({
  isOpen,
  onClose,
  requisitions = [],
  issueStore = "",
  onSendOtp,
  onConfirmIssue,
  onReject,
}) {
  const [suppliedTo, setSuppliedTo] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [errors, setErrors] = useState({});
  const [rejectMode, setRejectMode] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [receiverEditorOpen, setReceiverEditorOpen] = useState(false);
  const [checkedIds, setCheckedIds] = useState([]);
  const [visibleIds, setVisibleIds] = useState([]);
  const otpSectionRef = useRef(null);
  const prevItemIdsKeyRef = useRef("");

  const items = useMemo(
    () => (Array.isArray(requisitions) ? requisitions.filter(Boolean) : []),
    [requisitions],
  );

  const itemIdsKey = useMemo(() => items.map((row) => row.id).join("|"), [items]);

  const visibleItems = useMemo(
    () => items.filter((row) => visibleIds.includes(row.id)),
    [items, visibleIds],
  );

  const issuableItems = useMemo(
    () => visibleItems.filter((row) => isRequisitionIssuable(row)),
    [visibleItems],
  );

  const checkedItems = useMemo(
    () => issuableItems.filter((row) => checkedIds.includes(row.id)),
    [issuableItems, checkedIds],
  );

  const allChecked = issuableItems.length > 0 && checkedItems.length === issuableItems.length;
  const someChecked = checkedItems.length > 0 && checkedItems.length < issuableItems.length;

  const resolvedIssueStore = useMemo(() => {
    if (issueStore) return issueStore;
    const remaining = [...new Set(issuableItems.flatMap((row) => getStoresWithRemainingQty(row)))];
    return remaining.length === 1 ? remaining[0] : "";
  }, [issueStore, issuableItems]);

  const receiver = suppliedTo.trim() || "receiver";

  useEffect(() => {
    if (!isOpen) {
      prevItemIdsKeyRef.current = "";
      return;
    }
    setSuppliedTo("");
    setOtpSent(false);
    setOtp("");
    setOtpVerified(false);
    setErrors({});
    setRejectMode(null);
    setConfirmOpen(false);
    setReceiverEditorOpen(false);
    setCheckedIds(items.filter((row) => isRequisitionIssuable(row)).map((row) => row.id));
    setVisibleIds(items.map((row) => row.id));
    prevItemIdsKeyRef.current = itemIdsKey;
  }, [isOpen, itemIdsKey]);

  useEffect(() => {
    if (!isOpen) return;
    const prevKey = prevItemIdsKeyRef.current;
    if (prevKey === itemIdsKey) return;

    const availableIds = issuableItems.map((row) => row.id);
    const available = new Set(availableIds);
    setCheckedIds((prev) => {
      const kept = prev.filter((id) => available.has(id));
      if (kept.length === 0 || kept.length < prev.length) return availableIds;
      return kept;
    });

    if (prevKey) {
      setOtpSent(false);
      setOtp("");
      setOtpVerified(false);
      setConfirmOpen(false);
    }
    prevItemIdsKeyRef.current = itemIdsKey;
  }, [isOpen, itemIdsKey, issuableItems]);

  const removeRow = (id) => {
    setVisibleIds((prev) => prev.filter((rowId) => rowId !== id));
    setCheckedIds((prev) => prev.filter((rowId) => rowId !== id));
    setOtpSent(false);
    setOtp("");
    setOtpVerified(false);
    setErrors((current) => {
      const next = { ...current };
      delete next.checked;
      return next;
    });
  };

  const toggleRow = (id, checked) => {
    if (!issuableItems.some((row) => row.id === id)) return;
    setCheckedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((rowId) => rowId !== id);
    });
    setOtpSent(false);
    setOtp("");
    setOtpVerified(false);
  };

  const toggleAll = (checked) => {
    setCheckedIds(checked ? issuableItems.map((row) => row.id) : []);
    setOtpSent(false);
    setOtp("");
    setOtpVerified(false);
  };

  const validateIssuanceDetails = () => {
    const nextErrors = {};
    if (!suppliedTo.trim()) nextErrors.suppliedTo = "Select the person to receive.";
    if (checkedItems.length === 0) nextErrors.checked = "Select at least one item to issue.";
    else if (!resolvedIssueStore) {
      nextErrors.checked = "You selected items from more than one store. Remove the extra rows to issue them together.";
    } else if (checkedItems.some((row) => getStoreIssueRemaining(row, resolvedIssueStore) <= 0)) {
      nextErrors.checked = "Some selected items have nothing left to issue from this store.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning(
        nextErrors.checked
          || "Select the person to receive before continuing.",
      );
      return false;
    }
    return true;
  };

  const handleSendOtp = () => {
    if (!validateIssuanceDetails()) return;
    try {
      onSendOtp?.(checkedItems.map((row) => row.id), {
        suppliedTo: suppliedTo.trim(),
        storeLocation: resolvedIssueStore,
      });
      setOtpSent(true);
      setOtp("");
      setOtpVerified(false);
      const phone = getReceiverByName(suppliedTo)?.phone;
      toast.success(
        phone
          ? `OTP sent to ${suppliedTo.trim()} on ${phone} for ${checkedItems.length} item(s).`
          : `OTP sent to ${suppliedTo.trim()} for ${checkedItems.length} item(s).`,
      );
      requestAnimationFrame(() => {
        otpSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    } catch (error) {
      toast.error(error.message ?? "Could not send OTP.");
    }
  };

  const handleConfirm = () => {
    if (!validateIssuanceDetails()) return;
    if (!otpSent) {
      toast.warning("Send an OTP to the receiver first.");
      return;
    }
    if (!otpVerified) {
      toast.warning("Confirm the OTP sent to the receiver first.");
      return;
    }
    setConfirmOpen(true);
  };

  const finalizeIssue = () => {
    onConfirmIssue?.({
      otp: otp.trim(),
      ids: checkedItems.map((row) => row.id),
      suppliedTo: suppliedTo.trim(),
      storeLocation: resolvedIssueStore,
      quantities: Object.fromEntries(
        checkedItems.map((row) => [row.id, getStoreIssueRemaining(row, resolvedIssueStore)]),
      ),
    });
    setConfirmOpen(false);
  };

  const openReject = (mode) => {
    if (checkedItems.length === 0) {
      toast.warning("Select at least one item to reject.");
      return;
    }
    setRejectMode(mode);
  };

  return (
    <>
      <AddModal
        isOpen={isOpen && !rejectMode && !confirmOpen && !receiverEditorOpen && items.length > 0}
        onClose={onClose}
        onSave={handleConfirm}
        title="Issue items"
        subtitle={
          resolvedIssueStore
            ? `Issue selected items from ${resolvedIssueStore}. Remove a row to leave it out of this batch.`
            : "Issue selected items from the same store. Remove a row to leave it out of this batch."
        }
        dialogClassName="max-w-7xl"
        saveLabel="Confirm issue"
        saveVariant="primary"
        saveDisabled={!otpVerified}
        hideCancelButton
        secondaryAction={{ label: "Done", onClick: onClose }}
        footerActions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="danger" size="modal" onClick={() => openReject("entire")}>
              Reject entirely
            </Button>
            <Button variant="warning" size="modal" onClick={() => openReject("store_change")}>
              Reject for store change
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="max-w-md">
            <ReceiverPicker
              value={suppliedTo}
              required={false}
              onChange={(nextValue) => {
                setSuppliedTo(nextValue);
                setOtpSent(false);
                setOtp("");
                setOtpVerified(false);
                setErrors((prev) => {
                  if (!prev.suppliedTo) return prev;
                  const next = { ...prev };
                  delete next.suppliedTo;
                  return next;
                });
              }}
              error={errors.suppliedTo}
              selectClassName={fieldClassName}
              onAddClick={() => setReceiverEditorOpen(true)}
            />
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pending items ({issuableItems.length}) · Selected ({checkedItems.length})
              </p>
              <p className="text-[11px] font-medium text-slate-600">
                To:{" "}
                <span className="font-bold text-slate-800">
                  {suppliedTo.trim() || "—"}
                </span>
              </p>
            </div>
            <div className="max-h-64 overflow-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-200">
                    <th className={cn(thClass, "w-10")}>
                      <RowCheckbox
                        checked={allChecked}
                        indeterminate={someChecked}
                        onChange={toggleAll}
                        label="Select all items"
                        disabled={issuableItems.length === 0}
                      />
                    </th>
                    <th className={thClass}>Request #</th>
                    <th className={thClass}>Item code</th>
                    <th className={thClass}>Name</th>
                    <th className={cn(thClass, "min-w-[180px]")}>Description</th>
                    <th className={thClass}>Quantity</th>
                    <th className={cn(thClass, "min-w-[220px]")}>Issuing from</th>
                    <th className={thClass}>Qty this store</th>
                    <th className={thClass}>Item state</th>
                    <th className={thClass}>Date requested</th>
                    <th className={thClass}>Requested by</th>
                    <th className={thClass}>Approved by</th>
                    <th className={thClass}>Date of approval</th>
                    <th className={cn(thClass, "w-12 text-right")}> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {visibleItems.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="px-3 py-10 text-center text-[12px] text-slate-400">
                        No items left in this list. Close and select items again.
                      </td>
                    </tr>
                  ) : visibleItems.map((row) => {
                    const isChecked = checkedIds.includes(row.id);
                    const canIssue = isRequisitionIssuable(row);
                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          isChecked && "bg-emerald-50/40",
                          !canIssue && "bg-slate-50/60 text-slate-400",
                        )}
                      >
                        <td className={tdClass}>
                          <RowCheckbox
                            checked={isChecked}
                            onChange={(checked) => toggleRow(row.id, checked)}
                            label={`Select ${row.requestNumber || row.itemCode || "item"}`}
                            disabled={!canIssue}
                          />
                        </td>
                        <td className={cn(tdClass, "font-semibold text-slate-900 whitespace-nowrap")}>
                          {row.requestNumber || "—"}
                        </td>
                        <td className={cn(tdClass, "font-mono text-[11px] whitespace-nowrap")}>
                          {row.itemCode || "—"}
                        </td>
                        <td className={cn(tdClass, "font-semibold text-slate-800 whitespace-nowrap")}>
                          {itemLabel(row)}
                        </td>
                        <td className={cn(tdClass, "max-w-[220px]")}>
                          <span className="line-clamp-2">
                            {row.componentPath || row.description || "—"}
                          </span>
                        </td>
                        <td className={cn(tdClass, "font-bold text-slate-800 whitespace-nowrap")}>
                          {row.actualQuantity ?? row.quantity ?? "—"}
                        </td>
                        <td className={cn(tdClass, "min-w-[260px] whitespace-normal align-top")}>
                          {(() => {
                            const lines = getRequisitionStoreIssueLines(row).filter((line) => line.remaining > 0);
                            if (!lines.length) return "—";
                            return (
                              <span className="block space-y-1 whitespace-normal">
                                {lines.map((line) => (
                                  <span key={line.location} className="block leading-snug">
                                    {line.location}
                                    {` · ${line.remaining} left`}
                                  </span>
                                ))}
                              </span>
                            );
                          })()}
                        </td>
                        <td className={cn(tdClass, "font-bold text-slate-800 whitespace-nowrap")}>
                          {resolvedIssueStore
                            ? getStoreIssueRemaining(row, resolvedIssueStore) || "—"
                            : "—"}
                        </td>
                        <td className={cn(tdClass, "whitespace-nowrap font-semibold")}>
                          {getRequisitionItemState(row)}
                        </td>
                        <td className={cn(tdClass, "whitespace-nowrap")}>
                          {formatRequisitionDate(row.createdAt)}
                        </td>
                        <td className={cn(tdClass, "whitespace-nowrap")}>
                          {row.requestedBy || "—"}
                        </td>
                        <td className={cn(tdClass, "whitespace-nowrap")}>
                          {row.approvedBy || "—"}
                        </td>
                        <td className={cn(tdClass, "whitespace-nowrap")}>
                          {formatRequisitionDate(row.approvalDate)}
                        </td>
                        <td className={cn(tdClass, "text-right")}>
                          <RemoveRowButton
                            onClick={() => removeRow(row.id)}
                            label={`Remove ${row.requestNumber || row.itemCode || "item"}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {errors.checked ? (
              <p className="px-4 py-2 text-[10px] text-rose-600 border-t border-slate-100">
                {errors.checked}
              </p>
            ) : null}
          </div>

          <div ref={otpSectionRef}>
            <IssueOtpSection
              suppliedTo={suppliedTo}
              required={false}
              otpSent={otpSent}
              otp={otp}
              otpVerified={otpVerified}
              onSendOtp={handleSendOtp}
              onOtpChange={(value) => {
                setOtp(value);
                setOtpVerified(false);
              }}
              onVerifiedChange={setOtpVerified}
              sendDisabled={issuableItems.length === 0 || checkedItems.length === 0}
              itemCount={checkedItems.length}
            />
          </div>
        </div>
      </AddModal>

      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={finalizeIssue}
        className="!z-[10001]"
        title="Confirm issue for ticked items?"
        message={`Issue ${checkedItems.length} item(s) to ${receiver}${resolvedIssueStore ? ` from ${resolvedIssueStore}` : ""}?`}
        confirmText="Confirm issue"
      />

      <AddReceiverModal
        isOpen={receiverEditorOpen}
        onClose={() => setReceiverEditorOpen(false)}
        onCreated={(created) => {
          setSuppliedTo(created.name);
          setOtpSent(false);
          setOtp("");
          setOtpVerified(false);
          setErrors((prev) => {
            if (!prev.suppliedTo) return prev;
            const next = { ...prev };
            delete next.suppliedTo;
            return next;
          });
          setReceiverEditorOpen(false);
        }}
      />

      <RejectRequisitionModal
        isOpen={Boolean(rejectMode)}
        mode={rejectMode || "entire"}
        onClose={() => setRejectMode(null)}
        requestLabel={`${checkedItems.length} selected item(s)`}
        onConfirm={(reason, mode) => {
          setRejectMode(null);
          onReject?.(reason, checkedItems.map((row) => row.id), mode);
        }}
      />
    </>
  );
}
