import React, { useEffect, useMemo, useState } from "react";
import AddModal from "../../../../components/common/AddModal";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import Input from "../../../../components/common/base/Input";
import Label from "../../../../components/common/base/Label";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import { useAuth } from "../../../../context/useAuth";
import DeliveryPersonOtpSection from "./DeliveryPersonOtpSection";
import StoreSelect from "./StoreSelect";
import { getItemStoreStock, sendDeliveryOtp, OTP_TYPE } from "../../../../services/inventoryService";

const readOnlyClassName =
  "bg-slate-100 cursor-not-allowed focus:border-slate-200 focus:ring-0 focus:bg-slate-100";

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 transition-colors text-slate-700";

export const DISCARD_REASON_OPTIONS = [
  { value: "DAMAGED", label: "Damaged" },
  { value: "EXPIRED", label: "Expired" },
  { value: "DEFECTIVE", label: "Defective" },
  { value: "LOST", label: "Lost" },
  { value: "OBSOLETE", label: "Obsolete" },
  { value: "OTHER", label: "Other" },
];

export function formatDiscardReason(value) {
  if (!value) return "";
  const match = DISCARD_REASON_OPTIONS.find((option) => option.value === value);
  return match?.label || String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function FieldHint({ children, className }) {
  return (
    <p className={cn("text-[11px] text-slate-400 font-medium leading-snug", className)}>
      {children}
    </p>
  );
}

/** Disabled inputs don't fire hover; wrap so native title tooltips still show. */
function DisabledFieldTooltip({ disabled, title, children }) {
  if (!disabled || !title) return children;
  return (
    <span className="block cursor-not-allowed" title={title}>
      {children}
    </span>
  );
}

const INITIAL = {
  storeId: "",
  quantity: "",
  reason: "",
};

export default function DiscardItemModal({ isOpen, onClose, item, onSave }) {
  const { user } = useAuth();
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [stockStores, setStockStores] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);
  const [pendingDiscard, setPendingDiscard] = useState(null);
  const [saving, setSaving] = useState(false);

  const accountName = user?.name?.trim() || [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "";
  const accountPhone = String(user?.phone || "").trim();

  const selectedStore = useMemo(
    () => stockStores.find((store) => String(store.id) === String(form.storeId)) || null,
    [stockStores, form.storeId],
  );
  const onHandQty = selectedStore ? Number(selectedStore.quantity) || 0 : null;

  useEffect(() => {
    if (!isOpen) return;
    setForm(INITIAL);
    setErrors({});
    setOtpSent(false);
    setOtp("");
    setOtpVerified(false);
    setOtpSending(false);
    setDetailsConfirmed(false);
    setPendingDiscard(null);
    setSaving(false);
    setStockStores([]);

    const itemId = item?.id;
    if (!itemId) return undefined;

    let cancelled = false;
    setStockLoading(true);
    getItemStoreStock(itemId)
      .then((data) => {
        if (cancelled) return;
        setStockStores(data.stores || []);
      })
      .catch(() => {
        if (cancelled) return;
        setStockStores(
          (item?.stores || []).map((store) => ({
            id: store.id,
            name: store.name || "",
            quantity: store.quantity ?? 0,
          })),
        );
      })
      .finally(() => {
        if (!cancelled) setStockLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, item?.id]);

  const resetOtp = () => {
    setOtpSent(false);
    setOtp("");
    setOtpVerified(false);
  };

  const invalidateDetails = () => {
    if (detailsConfirmed) setDetailsConfirmed(false);
    resetOtp();
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    invalidateDetails();
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSendOtp = async () => {
    if (!detailsConfirmed) {
      toast.warning("Confirm details first before sending the OTP.");
      return;
    }
    if (!accountPhone) {
      toast.warning("Your account has no phone number. Update your profile before discarding.");
      return;
    }
    setOtpSending(true);
    try {
      await sendDeliveryOtp(accountPhone, OTP_TYPE.STOCK_DISCARD);
      setOtp("");
      setOtpVerified(false);
      setOtpSent(true);
      toast.success(`OTP sent to ${accountName || "your account"} on ${accountPhone}.`);
    } catch (error) {
      toast.error(error.message || "Unable to send discard OTP.");
    } finally {
      setOtpSending(false);
    }
  };

  const validateDetails = () => {
    const nextErrors = {};
    const quantity = Number(form.quantity);

    if (!form.storeId) nextErrors.storeId = "Select a store.";
    if (!form.quantity || Number.isNaN(quantity) || quantity <= 0) {
      nextErrors.quantity = "Enter a quantity greater than zero.";
    } else if (onHandQty != null && quantity > onHandQty) {
      nextErrors.quantity = `Cannot discard more than ${onHandQty} on hand.`;
    }
    if (!form.reason.trim()) nextErrors.reason = "Select a reason for discard.";
    if (!accountPhone) {
      nextErrors.phone = "Your account has no phone number.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Complete the required fields before confirming details.");
      return false;
    }
    return true;
  };

  const handleConfirmDetails = () => {
    if (!validateDetails()) return;
    setDetailsConfirmed(true);
    toast.success("Details confirmed. Send and confirm the OTP to finish.");
  };

  const handleSave = () => {
    if (!detailsConfirmed) {
      handleConfirmDetails();
      return;
    }
    if (!validateDetails()) return;
    if (!otpVerified) {
      toast.warning("Confirm the OTP before discarding stock.");
      return;
    }

    setPendingDiscard({
      storeId: form.storeId,
      storeName: selectedStore?.name || "",
      quantity: Number(form.quantity),
      reason: form.reason.trim(),
      discardedBy: accountName,
      discardedByPhone: accountPhone,
      discardedAt: new Date().toISOString(),
    });
  };

  const handleConfirmDiscard = async () => {
    if (!pendingDiscard || saving) return;
    setSaving(true);
    try {
      await onSave?.(pendingDiscard);
      setPendingDiscard(null);
    } catch (error) {
      toast.error(error.message ?? "Could not discard stock.");
    } finally {
      setSaving(false);
    }
  };

  const storeOptions = stockStores.map((store) => ({
    id: store.id,
    name: store.name,
    isActive: true,
  }));

  return (
    <>
      <AddModal
        isOpen={isOpen && !pendingDiscard}
        onClose={onClose}
        onSave={handleSave}
        title="Discard stock"
        subtitle={
          item
            ? `Discard stock for ${item.itemCode || item.name || `Item #${item.id}`}.`
            : "Discard stock from a store."
        }
        saveLabel={detailsConfirmed ? "Discard" : "Confirm details"}
        saveDisabled={detailsConfirmed && !otpVerified}
        dialogClassName="max-w-xl"
        panelClassName="max-w-xl"
        overlayClassName="!z-[10001]"
      >
        <div className="space-y-5">
          <div className="space-y-4">
            <StoreSelect
              id="discard-store"
              value={form.storeId}
              onChange={(next) => setField("storeId", next)}
              error={errors.storeId}
              label="Store"
              placeholder={stockLoading ? "Loading stores…" : "Search store…"}
              stores={storeOptions}
              required
              disabled={stockLoading}
            />

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="discard-on-hand">Quantity on hand</Label>
                <FieldHint>Available stock in the selected store. This cannot be edited.</FieldHint>
                <DisabledFieldTooltip
                  disabled={!form.storeId}
                  title="Select a store first to see quantity on hand."
                >
                  <Input
                    id="discard-on-hand"
                    value={
                      !form.storeId
                        ? ""
                        : onHandQty == null
                          ? "—"
                          : String(onHandQty)
                    }
                    readOnly
                    tabIndex={-1}
                    placeholder={form.storeId ? "—" : "Select a store"}
                    className={readOnlyClassName}
                  />
                </DisabledFieldTooltip>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="discard-quantity" className={errors.quantity ? "text-red-500" : ""}>
                  Quantity to discard
                  <span className="normal-case !text-red-500" aria-hidden="true">
                    {" "}
                    *
                  </span>
                </Label>
                <FieldHint>Must be greater than zero and not exceed quantity on hand.</FieldHint>
                <DisabledFieldTooltip
                  disabled={!form.storeId}
                  title="Select a store first to enter quantity to discard."
                >
                  <Input
                    id="discard-quantity"
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setField("quantity", e.target.value)}
                    placeholder="e.g. 2"
                    disabled={!form.storeId}
                    className={errors.quantity ? "border-red-500 focus:border-red-500 bg-red-50" : ""}
                  />
                </DisabledFieldTooltip>
                {errors.quantity ? (
                  <p className="text-[10px] font-medium leading-[14px] text-red-500" aria-live="polite">
                    {errors.quantity}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="discard-reason" className={errors.reason ? "text-red-500" : ""}>
                  Reason for discard
                  <span className="normal-case !text-red-500" aria-hidden="true">
                    {" "}
                    *
                  </span>
                </Label>
                <FieldHint>Select why this stock is being removed from inventory.</FieldHint>
                <select
                  id="discard-reason"
                  value={form.reason}
                  onChange={(e) => setField("reason", e.target.value)}
                  className={cn(fieldClassName, errors.reason && "border-red-500 bg-red-50")}
                >
                  <option value="">Select reason…</option>
                  {DISCARD_REASON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.reason ? (
                  <p className="text-[10px] font-medium leading-[14px] text-red-500" aria-live="polite">
                    {errors.reason}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
            <div className="flex flex-col">
              <Label htmlFor="discard-confirmed-by">Confirmed by</Label>
              <FieldHint className="min-h-[2.75rem]">
                Logged-in account name used for this discard.
              </FieldHint>
              <Input
                id="discard-confirmed-by"
                value={accountName}
                readOnly
                tabIndex={-1}
                placeholder="—"
                className={readOnlyClassName}
              />
            </div>
            <div className="flex flex-col">
              <Label htmlFor="discard-phone" className={errors.phone ? "text-red-500" : ""}>
                Phone
                <span className="normal-case !text-red-500" aria-hidden="true">
                  {" "}
                  *
                </span>
              </Label>
              <FieldHint className="min-h-[2.75rem]">
                OTP is sent to this phone from your account profile.
              </FieldHint>
              <Input
                id="discard-phone"
                type="tel"
                value={accountPhone}
                readOnly
                tabIndex={-1}
                placeholder="No phone on account"
                className={cn(readOnlyClassName, errors.phone && "border-red-500 bg-red-50")}
              />
              {errors.phone ? (
                <p className="text-[10px] font-medium leading-[14px] text-red-500" aria-live="polite">
                  {errors.phone}
                </p>
              ) : null}
            </div>
          </div>

          <DeliveryPersonOtpSection
            deliveredByName={accountName || "your account"}
            deliveredByPhone={accountPhone}
            otpSent={otpSent}
            otp={otp}
            otpVerified={otpVerified}
            onSendOtp={handleSendOtp}
            onOtpChange={setOtp}
            onVerifiedChange={setOtpVerified}
            sendDisabled={!accountPhone}
            sendLoading={otpSending}
            detailsConfirmed={detailsConfirmed}
            lockedMessage="Confirm discard details first. OTP verification unlocks afterwards as the final step before discarding stock."
            sectionTitle="Account verification"
            enableHint="Send and confirm the OTP to enable Discard"
            verifiedContinueHint="You can now discard stock."
            enterOtpHint="Enter the code sent to your phone to continue."
            confirmBeforeHint="Confirm the code before discarding stock."
            otpInputId="discardAccountOtp"
          />
        </div>
      </AddModal>

      <ConfirmationModal
        isOpen={Boolean(pendingDiscard)}
        onClose={() => {
          if (saving) return;
          setPendingDiscard(null);
        }}
        onConfirm={handleConfirmDiscard}
        closeOnConfirm={false}
        confirmLoading={saving}
        title="Discard stock?"
        message={
          pendingDiscard
            ? `Discard ${pendingDiscard.quantity} of ${item?.itemCode || "this item"} from ${pendingDiscard.storeName || "the selected store"}?`
            : "Discard this stock."
        }
        confirmText={saving ? "Discarding…" : "Discard"}
      />
    </>
  );
}
