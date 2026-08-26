import React, { useEffect, useState } from "react";
import AddModal from "../../../../components/common/AddModal";
import Button from "../../../../components/common/base/Button";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import SectionLoadState from "../../../../components/common/SectionLoadState";
import { ConfiguredCustomFields, ShowConfiguredField } from "../../../../components/common/ConfiguredFormSections";
import { requiredFieldLabel } from "../../../../components/common/fields/requiredFieldLabel";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import { useFormTreeSections } from "../../../../hooks/useFormTreeSections";
import {
  ISSUE_ITEM_FORM_FIELD_CATALOG,
  ISSUE_ITEM_FORM_SETUP_CHANGED_EVENT,
  getActiveIssueItemFormSections,
  getIssueItemFormSetup,
} from "../../../../mockdata/setups";
import { getReceiverByName, getRequisitionRemainingQuantity } from "../../../../mockdata/stores";
import {
  getRequisitionItemState,
  getStockLocationsForRequisition,
  getLocationStock,
  getStoreIssueRemaining,
  getStoresWithRemainingQty,
} from "./RaiseSupplyRequestModal";
import RequisitionRequestSummary from "./RequisitionRequestSummary";
import ReceiverPicker from "./ReceiverPicker";
import IssueOtpSection from "./IssueOtpSection";
import RejectRequisitionModal from "./RejectRequisitionModal";
import AddReceiverModal from "./AddReceiverModal";

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 transition-colors text-slate-700";
const tableFieldClassName =
  "w-full min-w-[140px] px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 transition-colors text-slate-700";

const thClass =
  "px-3 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-left";
const tdClass = "px-3 py-3 align-top text-[12px] text-slate-700";

export default function IssueItemActionModal({
  isOpen,
  onClose,
  requisition,
  preferredStore,
  onSendOtp,
  onConfirmIssue,
  onReject,
  loading = false,
  error = null,
  onRetry,
}) {
  const busy = loading || Boolean(error);
  const [suppliedTo, setSuppliedTo] = useState("");
  const [issueStore, setIssueStore] = useState("");
  const [quantityToIssue, setQuantityToIssue] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [errors, setErrors] = useState({});
  const [rejectMode, setRejectMode] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [receiverEditorOpen, setReceiverEditorOpen] = useState(false);
  const [customValues, setCustomValues] = useState({});
  const { sections, visibleKeys } = useFormTreeSections(
    ISSUE_ITEM_FORM_SETUP_CHANGED_EVENT,
    getIssueItemFormSetup,
    getActiveIssueItemFormSections,
  );
  const issueSystemKeys = new Set(ISSUE_ITEM_FORM_FIELD_CATALOG.map((field) => field.key));

  const remainingQuantity = getRequisitionRemainingQuantity(requisition);
  const isPartialRemaining = requisition?.status === "PARTIAL_SUPPLIED" && remainingQuantity > 0;
  const stockLocations = getStockLocationsForRequisition(requisition);
  const remainingStores = isPartialRemaining
    ? stockLocations.map((row) => row.location)
    : getStoresWithRemainingQty(requisition);
  const itemState = getRequisitionItemState(requisition);
  const storeRemaining = getStoreIssueRemaining(requisition, issueStore);
  const stockAtStore = getLocationStock(stockLocations, issueStore);
  const issueCap = isPartialRemaining
    ? Math.min(remainingQuantity, stockAtStore || remainingQuantity)
    : (storeRemaining > 0 ? storeRemaining : remainingQuantity);

  useEffect(() => {
    if (!isOpen || !requisition) return;
    const stores = isPartialRemaining
      ? getStockLocationsForRequisition(requisition).map((row) => row.location)
      : getStoresWithRemainingQty(requisition);
    const nextStore = stores.includes(preferredStore)
      ? preferredStore
      : stores.length === 1
        ? stores[0]
        : "";
    setSuppliedTo(requisition.suppliedTo || "");
    setIssueStore(nextStore);
    setQuantityToIssue(
      isPartialRemaining
        ? ""
        : String(
          nextStore
            ? getStoreIssueRemaining(requisition, nextStore) || ""
            : getRequisitionRemainingQuantity(requisition) || "",
        ),
    );
    setOtpSent(Boolean(requisition?.pendingOtp));
    setOtp("");
    setOtpVerified(false);
    setErrors({});
    setRejectMode(null);
    setConfirmOpen(false);
    setReceiverEditorOpen(false);
    setCustomValues({});
  }, [isOpen, requisition?.id, preferredStore]);

  const receiver = suppliedTo.trim() || "receiver";

  const validateIssuanceDetails = () => {
    const nextErrors = {};
    if (visibleKeys.has("suppliedTo") && !suppliedTo.trim()) nextErrors.suppliedTo = "Select the person to receive.";
    if (!issueStore) nextErrors.issueStore = "Select the store you are issuing from.";
    const issuing = Number(quantityToIssue);
    if (visibleKeys.has("quantityToIssue") && (quantityToIssue === "" || Number.isNaN(issuing) || issuing <= 0)) {
      nextErrors.quantityToIssue = "Enter a quantity to issue greater than zero.";
    } else if (visibleKeys.has("quantityToIssue") && issuing > issueCap) {
      nextErrors.quantityToIssue = isPartialRemaining
        ? `Cannot exceed remaining (${issueCap}).`
        : `Cannot exceed remaining at this store (${issueCap}).`;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Complete the issuance details before continuing.");
      return false;
    }
    return true;
  };

  const handleSendOtp = () => {
    if (!validateIssuanceDetails()) return;
    try {
      onSendOtp?.({
        suppliedTo: suppliedTo.trim(),
        storeLocation: issueStore || undefined,
      });
      setOtpSent(true);
      setOtp("");
      setOtpVerified(false);
      const phone = getReceiverByName(suppliedTo)?.phone;
      toast.success(phone ? `OTP sent to ${suppliedTo.trim()} on ${phone}.` : `OTP sent to ${suppliedTo.trim()}.`);
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
      suppliedTo: suppliedTo.trim(),
      storeLocation: issueStore || undefined,
      quantity: Number(quantityToIssue),
    });
    setConfirmOpen(false);
  };

  return (
    <>
      <AddModal
        isOpen={isOpen && !rejectMode && !confirmOpen && !receiverEditorOpen}
        onClose={onClose}
        onSave={handleConfirm}
        title={isPartialRemaining ? "Issue remaining quantity" : "Issue item"}
        subtitle={
          isPartialRemaining
            ? `This request is partially supplied. Issue up to ${remainingQuantity} remaining, or reject the remainder.`
            : "Issue from one store at a time. Select the receiver, send an OTP, then confirm."
        }
        dialogClassName="max-w-5xl"
        saveLabel="Confirm issue"
        saveVariant="primary"
        saveDisabled={busy || !otpVerified}
        hideCancelButton
        secondaryAction={{ label: "Cancel", onClick: onClose }}
        footerActions={
          busy ? null : (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="danger" size="modal" onClick={() => setRejectMode("entire")}>
              {isPartialRemaining ? "Reject remaining" : "Reject entirely"}
            </Button>
            <Button variant="warning" size="modal" onClick={() => setRejectMode("store_change")}>
              {isPartialRemaining ? "Reject remaining for store change" : "Reject for store change"}
            </Button>
          </div>
          )
        }
      >
        <SectionLoadState
          loading={loading}
          error={error}
          onRetry={onRetry}
          loadingLabel="Loading request…"
          errorTitle="Couldn’t load this request"
        >
        <div className="space-y-4">
          <RequisitionRequestSummary requisition={requisition} />

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className={cn(thClass, "min-w-[240px]")}>
                      {requiredFieldLabel("Issue from", true)}
                    </th>
                    {visibleKeys.has("itemState") ? (
                      <th className={thClass}>Item state</th>
                    ) : null}
                    {visibleKeys.has("remainingQuantity") ? (
                      <th className={thClass}>Quantity remaining</th>
                    ) : null}
                    {visibleKeys.has("quantityToIssue") ? (
                      <th className={cn(thClass, "min-w-[160px]")}>
                        {requiredFieldLabel("Quantity to issue", true)}
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr>
                    <td className={tdClass}>
                      <select
                        value={issueStore}
                        onChange={(event) => {
                          const nextStore = event.target.value;
                          setIssueStore(nextStore);
                          setQuantityToIssue((current) => {
                            if (isPartialRemaining) return current;
                            return nextStore
                              ? String(getStoreIssueRemaining(requisition, nextStore) || "")
                              : "";
                          });
                          setOtpSent(false);
                          setOtp("");
                          setOtpVerified(false);
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.issueStore;
                            delete next.quantityToIssue;
                            return next;
                          });
                        }}
                        disabled={remainingStores.length === 0}
                        className={cn(tableFieldClassName, errors.issueStore && "border-rose-500 bg-rose-50")}
                      >
                        <option value="">Select store</option>
                        {remainingStores.map((store) => {
                          const allocatedLeft = getStoreIssueRemaining(requisition, store);
                          const stockQty = getLocationStock(stockLocations, store);
                          return (
                            <option key={store} value={store}>
                              {isPartialRemaining
                                ? `${store} (stock ${stockQty}${allocatedLeft > 0 ? ` · ${allocatedLeft} allocated left` : ""})`
                                : `${store} (${allocatedLeft} left)`}
                            </option>
                          );
                        })}
                      </select>
                      {errors.issueStore ? (
                        <p className="mt-1.5 text-[10px] text-rose-600">{errors.issueStore}</p>
                      ) : null}
                    </td>
                    {visibleKeys.has("itemState") ? (
                      <td className={cn(tdClass, "whitespace-nowrap font-semibold text-slate-800")}>
                        {itemState || "—"}
                      </td>
                    ) : null}
                    {visibleKeys.has("remainingQuantity") ? (
                      <td className={cn(tdClass, "whitespace-nowrap font-semibold text-slate-800")}>
                        {issueStore
                          ? `${storeRemaining} at this store · ${remainingQuantity} overall`
                          : String(remainingQuantity || "—")}
                      </td>
                    ) : null}
                    {visibleKeys.has("quantityToIssue") ? (
                      <td className={tdClass}>
                        <input
                          type="number"
                          min="1"
                          max={issueCap || undefined}
                          value={quantityToIssue}
                          onChange={(event) => {
                            setQuantityToIssue(event.target.value);
                            setOtpSent(false);
                            setOtp("");
                            setOtpVerified(false);
                            setErrors((prev) => {
                              if (!prev.quantityToIssue) return prev;
                              const next = { ...prev };
                              delete next.quantityToIssue;
                              return next;
                            });
                          }}
                          className={cn(tableFieldClassName, errors.quantityToIssue && "border-rose-500 bg-rose-50")}
                        />
                        {errors.quantityToIssue ? (
                          <p className="mt-1.5 text-[10px] text-rose-600">{errors.quantityToIssue}</p>
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="px-3 py-2 text-[10px] text-slate-400 border-t border-slate-100">
              {isPartialRemaining
                ? `Pick any stocked store. Remaining overall: ${remainingQuantity}. You can issue less than remaining.`
                : issueStore
                  ? `You can issue up to ${storeRemaining} from this store. Other stores stay open.`
                  : "Choose the store for this supply. You can issue less than remaining."}
            </p>
          </div>

          <ShowConfiguredField visibleKeys={visibleKeys} fieldKey="suppliedTo">
          <ReceiverPicker
            id="issue-person-search"
            value={suppliedTo}
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
            addButtonLabel="Add receiver"
          />
          </ShowConfiguredField>

          <IssueOtpSection
            suppliedTo={suppliedTo}
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
          <ConfiguredCustomFields
            sections={sections}
            systemKeys={issueSystemKeys}
            form={customValues}
            formErrors={errors}
            handleChange={(key) => (event) => {
              const value = event?.target ? event.target.value : event;
              setCustomValues((current) => ({ ...current, [key]: value }));
            }}
            idPrefix="isi"
          />
        </div>
        </SectionLoadState>
      </AddModal>

      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={finalizeIssue}
        className="!z-[10001]"
        title={isPartialRemaining ? "Confirm remaining issue?" : "Confirm issue?"}
        message={
          requisition?.requestNumber
            ? `Issue ${quantityToIssue} of ${requisition.requestNumber} to ${receiver} from ${issueStore || "the selected store"}?`
            : `Issue ${quantityToIssue} to ${receiver} from ${issueStore || "the selected store"}?`
        }
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
        }}
      />

      <RejectRequisitionModal
        isOpen={Boolean(rejectMode)}
        mode={rejectMode || "entire"}
        onClose={() => setRejectMode(null)}
        requestLabel={requisition?.requestNumber}
        title={
          isPartialRemaining
            ? rejectMode === "store_change"
              ? "Reject remaining for store change"
              : "Reject remaining quantity"
            : undefined
        }
        onConfirm={(reason, mode) => {
          setRejectMode(null);
          onReject?.(reason, mode);
        }}
      />
    </>
  );
}
