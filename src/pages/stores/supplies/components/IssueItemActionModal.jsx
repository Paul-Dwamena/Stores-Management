import React, { useEffect, useMemo, useState } from "react";
import AddModal from "../../../../components/common/AddModal";
import Button from "../../../../components/common/base/Button";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import SectionLoadState from "../../../../components/common/SectionLoadState";
import { ConfiguredCustomFields, ShowConfiguredField } from "../../../../components/common/ConfiguredFormSections";
import { requiredFieldLabel } from "../../../../components/common/fields/requiredFieldLabel";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import { EMPTY_DISPLAY } from "../../../../utils/apiResponseHelpers";
import { formatStoreLocation } from "../../../../utils/displayFormatters";
import { useFormTreeSections } from "../../../../hooks/useFormTreeSections";
import {
  ISSUE_ITEM_FORM_FIELD_CATALOG,
  ISSUE_ITEM_FORM_SETUP_CHANGED_EVENT,
  getActiveIssueItemFormSections,
  getIssueItemFormSetup,
} from "../../../../mockdata/setups";
import { getRequisitionRemainingQuantity } from "../../../../mockdata/stores";
import {
  getRequisitionItemState,
  getStockLocationsForRequisition,
  getLocationStock,
  getStoreIssueRemaining,
  getRequisitionStoreIssueLines,
  getStoresWithRemainingQty,
} from "./RaiseSupplyRequestModal";
import RequisitionRequestSummary from "./RequisitionRequestSummary";
import ReceiverPicker from "./ReceiverPicker";
import IssueOtpSection from "./IssueOtpSection";
import RejectRequisitionModal from "./RejectRequisitionModal";
import AddReceiverModal from "./AddReceiverModal";
import { supplyStatusKey } from "../utils/supplyStatus";

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 transition-colors text-slate-700";
const tableFieldClassName =
  "w-full min-w-[140px] px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 transition-colors text-slate-700";

const thClass =
  "px-3 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-left";
const tdClass = "px-3 py-3 align-top text-[12px] text-slate-700";

function buildStockLocations(requisition, storeOptions) {
  if (storeOptions != null) {
    return storeOptions.map((store) => ({
      location: store.name,
      name: store.name,
      quantity: store.quantity,
      storeId: store.id,
    }));
  }
  return getStockLocationsForRequisition(requisition);
}

export default function IssueItemActionModal({
  isOpen,
  onClose,
  requisition,
  preferredStore,
  storeOptions,
  receivers = null,
  receiverRoleId = null,
  onEnsureReceiverRole,
  onReceiverCreated,
  onSendOtp,
  onConfirmIssue,
  onReject,
  loading = false,
  saving = false,
  error = null,
  onRetry,
}) {
  const busy = loading || Boolean(error) || saving;
  const [suppliedTo, setSuppliedTo] = useState("");
  const [issueStore, setIssueStore] = useState("");
  const [quantityToIssue, setQuantityToIssue] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);
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
  const isPartialRemaining =
    supplyStatusKey(requisition?.status) === "PARTIALLY_SUPPLIED" && remainingQuantity > 0;
  const stockLocations = useMemo(
    () => buildStockLocations(requisition, storeOptions),
    [requisition, storeOptions],
  );
  const remainingStores =
    storeOptions != null
      ? stockLocations.map((row) => row.location)
      : isPartialRemaining
        ? stockLocations.map((row) => row.location)
        : getStoresWithRemainingQty(requisition);
  const itemState = getRequisitionItemState(requisition);
  const storeRemaining = getStoreIssueRemaining(requisition, issueStore);
  const stockAtStore = getLocationStock(stockLocations, issueStore);
  const storeIssuanceComplete = Boolean(
    issueStore && storeRemaining <= 0 && remainingQuantity > 0,
  );
  const issueCap = isPartialRemaining
    ? storeIssuanceComplete
      ? 0
      : issueStore
        ? Math.min(
            remainingQuantity,
            storeRemaining > 0 ? storeRemaining : remainingQuantity,
            stockAtStore > 0 ? stockAtStore : remainingQuantity,
          )
        : remainingQuantity
    : (storeRemaining > 0 ? storeRemaining : remainingQuantity);

  useEffect(() => {
    if (!isOpen) {
      setRejectMode(null);
      setConfirmOpen(false);
      setReceiverEditorOpen(false);
      return;
    }
    if (!requisition) return;
    const stores =
      storeOptions != null
        ? stockLocations.map((row) => row.location)
        : isPartialRemaining
          ? stockLocations.map((row) => row.location)
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
    setOtpSending(false);
    setDetailsConfirmed(false);
    setErrors({});
    setRejectMode(null);
    setConfirmOpen(false);
    setReceiverEditorOpen(false);
    setCustomValues({});
  }, [isOpen, requisition, preferredStore, isPartialRemaining, stockLocations]);

  const resetOtpState = () => {
    setOtpSent(false);
    setOtp("");
    setOtpVerified(false);
    setDetailsConfirmed(false);
  };

  const receiverPeople = receivers;
  const hasLiveReceivers = Array.isArray(receiverPeople);
  const selectedReceiver = (receiverPeople || []).find(
    (person) => String(person.id) === String(suppliedTo).trim() || person.name === suppliedTo.trim(),
  );
  const receiverLabel = selectedReceiver?.name || suppliedTo.trim() || "receiver";

  const resolveStoreId = (location) => {
    const stockRow = stockLocations.find(
      (row) => row.location === location || row.name === location,
    );
    if (stockRow?.storeId != null) return stockRow.storeId;
    const match = (requisition?.storeAllocations || []).find(
      (row) => row.location === location && row.storeId != null,
    );
    return match?.storeId ?? null;
  };

  const resolveSupplyRequestItemId = (storeId) => {
    if (storeId == null) return null;
    const allocation = (requisition?.storeAllocations || []).find(
      (row) => Number(row.storeId) === Number(storeId),
    );
    if (allocation?.supplyRequestItemId != null) return allocation.supplyRequestItemId;
    const item = (requisition?.items || []).find(
      (row) => Number(row.storeId) === Number(storeId),
    );
    if (item?.supplyRequestItemId != null) return item.supplyRequestItemId;
    if (item?.id != null) return item.id;
    const items = requisition?.items || [];
    return items.length === 1 ? items[0]?.supplyRequestItemId ?? items[0]?.id ?? null : null;
  };

  const validateIssuanceDetails = () => {
    const nextErrors = {};
    if (visibleKeys.has("suppliedTo") && !suppliedTo.trim()) nextErrors.suppliedTo = "Select the person to receive.";
    if (!issueStore) nextErrors.issueStore = "Select the store you are issuing from.";
    if (storeIssuanceComplete) {
      nextErrors.issueStore = "Issuance from this store is already complete. Select another store.";
    }
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

  const handleSendOtp = async () => {
    if (!detailsConfirmed) {
      toast.warning("Confirm details first before sending the OTP.");
      return;
    }
    if (!validateIssuanceDetails()) return;
    if (!selectedReceiver?.phone?.trim()) {
      toast.warning("The selected receiver needs a phone number before an OTP can be sent.");
      return;
    }
    setOtpSending(true);
    try {
      await onSendOtp?.({
        suppliedTo: suppliedTo.trim(),
        storeLocation: issueStore || undefined,
        storeId: resolveStoreId(issueStore),
        receiverId: selectedReceiver?.id != null
          ? Number(selectedReceiver.id)
          : Number(suppliedTo) || undefined,
      });
      setOtpSent(true);
      setOtp("");
      setOtpVerified(false);
      toast.success(
        `OTP sent to ${receiverLabel} on ${selectedReceiver.phone.trim()}.`,
      );
    } catch (error) {
      toast.error(error.message ?? "Could not send OTP.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleConfirmDetails = () => {
    if (!validateIssuanceDetails()) return;
    setDetailsConfirmed(true);
    toast.success("Details confirmed. Send and confirm the OTP to finish.");
  };

  const handleConfirm = () => {
    if (!detailsConfirmed) {
      handleConfirmDetails();
      return;
    }
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
    if (saving) return;
    const receiverId = selectedReceiver?.id ?? Number(suppliedTo);
    const storeId = resolveStoreId(issueStore);
    onConfirmIssue?.({
      otp: otp.trim(),
      suppliedTo: receiverLabel,
      receiverId: Number.isFinite(Number(receiverId)) ? Number(receiverId) : null,
      storeLocation: issueStore || undefined,
      storeId,
      supplyRequestItemId: resolveSupplyRequestItemId(storeId),
      quantity: Number(quantityToIssue),
    });
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
            : "Issue from one store at a time. Confirm details first, then verify the receiver OTP."
        }
        dialogClassName="max-w-5xl"
        saveLabel={detailsConfirmed ? "Confirm issue" : "Confirm details"}
        saveVariant="primary"
        saveDisabled={busy || storeIssuanceComplete || (detailsConfirmed && !otpVerified)}
        hideCancelButton
        secondaryAction={{ label: "Cancel", onClick: onClose }}
        footerActions={
          busy ? null : (
            <Button variant="danger" size="modal" onClick={() => setRejectMode("entire")}>
              Reject
            </Button>
          )
        }
      >
        <SectionLoadState
          loading={loading}
          error={error}
          onRetry={onRetry}
          loadingLabel="Loading request…"
          errorTitle="Couldn't load this request"
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
                          const nextStoreRemaining = getStoreIssueRemaining(requisition, nextStore);
                          setQuantityToIssue((current) => {
                            if (isPartialRemaining) {
                              if (nextStore && nextStoreRemaining <= 0) return "";
                              return current;
                            }
                            return nextStore
                              ? String(getStoreIssueRemaining(requisition, nextStore) || "")
                              : "";
                          });
                          resetOtpState();
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.issueStore;
                            delete next.quantityToIssue;
                            return next;
                          });
                        }}
                        disabled={remainingStores.length === 0}
                        className={cn(tableFieldClassName, "uppercase", errors.issueStore && "border-rose-500 bg-rose-50")}
                      >
                        <option value="">Select store</option>
                        {remainingStores.map((store) => {
                          const storeLine = getRequisitionStoreIssueLines(requisition).find(
                            (row) => row.location === store,
                          );
                          const storeRequested = storeLine?.quantity || 0;
                          const stockQty = getLocationStock(stockLocations, store);
                          const storeLabel = formatStoreLocation(store);
                          return (
                            <option key={store} value={store}>
                              {isPartialRemaining
                                ? `${storeLabel} (stock ${stockQty}${storeRequested > 0 ? ` ${EMPTY_DISPLAY} ${storeRequested} requested` : ""})`
                                : `${storeLabel} (${storeRequested} requested)`}
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
                        {itemState || EMPTY_DISPLAY}
                      </td>
                    ) : null}
                    {visibleKeys.has("remainingQuantity") ? (
                      <td className={cn(tdClass, "whitespace-nowrap font-semibold text-slate-800")}>
                        {issueStore ? (
                          storeIssuanceComplete ? (
                            <span className="text-teal-700">
                              Complete at this store {EMPTY_DISPLAY} {remainingQuantity} overall
                            </span>
                          ) : (
                            `${storeRemaining} at this store ${EMPTY_DISPLAY} ${remainingQuantity} overall`
                          )
                        ) : (
                          String(remainingQuantity || EMPTY_DISPLAY)
                        )}
                      </td>
                    ) : null}
                    {visibleKeys.has("quantityToIssue") ? (
                      <td className={tdClass}>
                        <input
                          type="number"
                          min="1"
                          max={issueCap || undefined}
                          value={quantityToIssue}
                          disabled={storeIssuanceComplete}
                          onChange={(event) => {
                            setQuantityToIssue(event.target.value);
                            resetOtpState();
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
            {storeIssuanceComplete ? (
              <div className="mx-3 mt-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5 text-[11px] leading-relaxed text-teal-900">
                Issuance from <span className="font-semibold">{issueStore}</span> is complete.
                {" "}
                Select another store to issue the remaining {remainingQuantity}.
              </div>
            ) : null}
            <p className="px-3 py-2 text-[10px] text-slate-400 border-t border-slate-100">
              {storeIssuanceComplete
                ? `This store has no remaining quantity to issue. ${remainingQuantity} still outstanding across other stores.`
                : isPartialRemaining
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
            items={hasLiveReceivers ? receiverPeople : undefined}
            onChange={(nextValue) => {
              setSuppliedTo(nextValue);
              resetOtpState();
              setErrors((prev) => {
                if (!prev.suppliedTo) return prev;
                const next = { ...prev };
                delete next.suppliedTo;
                return next;
              });
            }}
            error={errors.suppliedTo}
            selectClassName={fieldClassName}
            onAddClick={
              hasLiveReceivers
                ? () => setReceiverEditorOpen(true)
                : undefined
            }
            addButtonLabel="Add receiver"
          />
          </ShowConfiguredField>

          <IssueOtpSection
            suppliedTo={suppliedTo}
            receivers={receiverPeople || []}
            otpSent={otpSent}
            otp={otp}
            otpVerified={otpVerified}
            onSendOtp={handleSendOtp}
            sendLoading={otpSending}
            sendDisabled={busy || !selectedReceiver?.phone?.trim()}
            onOtpChange={(value) => {
              setOtp(value);
              setOtpVerified(false);
            }}
            onVerifiedChange={setOtpVerified}
            detailsConfirmed={detailsConfirmed}
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
        onClose={() => {
          if (saving) return;
          setConfirmOpen(false);
        }}
        onConfirm={finalizeIssue}
        closeOnConfirm={false}
        confirmLoading={saving}
        className="!z-[10001]"
        title={isPartialRemaining ? "Confirm remaining issue?" : "Confirm issue?"}
        message={
          requisition?.requestNumber
            ? `Issue ${quantityToIssue} of ${requisition.requestNumber} to ${receiverLabel} from ${issueStore || "the selected store"}?`
            : `Issue ${quantityToIssue} to ${receiverLabel} from ${issueStore || "the selected store"}?`
        }
        confirmText={saving ? "Issuing…" : "Confirm issue"}
      />

      <AddReceiverModal
        isOpen={receiverEditorOpen}
        onClose={() => setReceiverEditorOpen(false)}
        receiverRoleId={receiverRoleId}
        onEnsureReceiverRole={onEnsureReceiverRole}
        onCreated={(created) => {
          onReceiverCreated?.(created);
          setSuppliedTo(created?.id != null ? String(created.id) : "");
          resetOtpState();
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
        mode="entire"
        onClose={() => setRejectMode(null)}
        requestLabel={requisition?.requestNumber}
        title={isPartialRemaining ? "Reject remaining quantity" : undefined}
        saving={saving}
        onConfirm={(reason, mode) => {
          onReject?.(reason, mode);
        }}
      />
    </>
  );
}
