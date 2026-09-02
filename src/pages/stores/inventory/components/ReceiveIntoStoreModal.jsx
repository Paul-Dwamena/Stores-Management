import React, { useEffect, useState } from "react";
import AddModal from "../../../../components/common/AddModal";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import InputField from "../../../../components/common/fields/InputField";
import MoneyInputField from "../../../../components/common/fields/MoneyInputField";
import Label from "../../../../components/common/base/Label";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import AddSupplierModal from "./AddSupplierModal";
import DeliveryPersonOtpSection from "./DeliveryPersonOtpSection";
import SupplierPicker from "./SupplierPicker";
import StoreSelect from "./StoreSelect";
import InventoryUnitFields from "./InventoryUnitFields";
import { sendDeliveryOtp, OTP_TYPE } from "../../../../services/inventoryService";
import {
  buildReceiveStockPayload,
  normalizeInventoryUnit,
  resolveItemBaseUnit,
  validateInventoryUnitFields,
} from "../utils/inventoryUnitOptions";

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 transition-colors text-slate-700";

const readOnlyClassName =
  "bg-slate-100 cursor-not-allowed focus:bg-slate-100";

const CONDITION_OPTIONS = [
  { value: "GOOD", label: "Good" },
  { value: "BAD", label: "Bad" },
  { value: "BROKEN", label: "Broken" },
  { value: "PARTIALLY_DAMAGED", label: "Partially damaged" },
  { value: "DAMAGED", label: "Damaged" },
];

const INITIAL = {
  quantity: "",
  unitOfMeasure: "",
  unitsPerPack: "",
  unitCost: "",
  location: "",
  supplierId: "",
  supplierPhone: "",
  supplierEmail: "",
  waybillNumber: "",
  deliveredByName: "",
  deliveredByPhone: "",
  deliveredByEmail: "",
  condition: "",
};

export default function ReceiveIntoStoreModal({
  isOpen,
  onClose,
  item,
  onSave,
}) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [pendingReceive, setPendingReceive] = useState(null);
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [supplierTick, setSupplierTick] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      ...INITIAL,
      unitOfMeasure: normalizeInventoryUnit(item?.unit) || "",
    });
    setErrors({});
    setPendingReceive(null);
    setAddSupplierOpen(false);
    setOtpSent(false);
    setOtp("");
    setOtpVerified(false);
    setOtpSending(false);
    setDetailsConfirmed(false);
    setSaving(false);
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

  const setField = (key, value, supplier = null) => {
    setForm((prev) => {
      if (key !== "supplierId") return { ...prev, [key]: value };
      return {
        ...prev,
        supplierId: value,
        supplierPhone: supplier?.phone || "",
        supplierEmail: supplier?.email || "",
      };
    });
    invalidateDetails();
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const deliveryContactReady =
    Boolean(form.deliveredByName.trim())
    && Boolean(form.deliveredByPhone.trim())
    && Boolean(form.deliveredByEmail.trim());

  const handleSendOtp = async () => {
    if (!detailsConfirmed) {
      toast.warning("Confirm details first before sending the OTP.");
      return;
    }
    if (!form.deliveredByName.trim()) {
      toast.warning("Enter the delivery person’s full name first.");
      return;
    }
    if (!form.deliveredByPhone.trim()) {
      toast.warning("Enter the delivery person’s phone number to send the OTP.");
      return;
    }
    if (!form.deliveredByEmail.trim()) {
      toast.warning("Enter the delivery person’s email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.deliveredByEmail.trim())) {
      toast.warning("Enter a valid delivery email address.");
      return;
    }
    setOtpSending(true);
    try {
      await sendDeliveryOtp(form.deliveredByPhone.trim(), OTP_TYPE.STOCK_DELIVERY);
      setOtp("");
      setOtpVerified(false);
      setOtpSent(true);
      toast.success(
        `OTP sent to ${form.deliveredByName.trim()} on ${form.deliveredByPhone.trim()}.`,
      );
    } catch (error) {
      toast.error(error.message || "Unable to send delivery OTP.");
    } finally {
      setOtpSending(false);
    }
  };

  const validateDetails = () => {
    const nextErrors = {};
    const quantity = Number(form.quantity);
    const unitCost = Number(form.unitCost);
    if (!form.quantity || Number.isNaN(quantity) || quantity <= 0) {
      nextErrors.quantity = "Enter a quantity greater than zero.";
    }
    if (form.unitCost === "" || Number.isNaN(unitCost) || unitCost < 0) {
      nextErrors.unitCost = "Enter a valid unit cost.";
    }
    if (!form.location.trim()) nextErrors.location = "Select a store location.";
    if (!form.supplierId) nextErrors.supplierId = "Select a supplier.";
    if (!form.deliveredByName.trim()) {
      nextErrors.deliveredByName = "Enter the delivery person’s full name.";
    }
    if (!form.deliveredByPhone.trim()) {
      nextErrors.deliveredByPhone = "Enter the delivery person’s phone number.";
    }
    if (!form.deliveredByEmail.trim()) {
      nextErrors.deliveredByEmail = "Enter the delivery person’s email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.deliveredByEmail.trim())) {
      nextErrors.deliveredByEmail = "Enter a valid email address.";
    }
    if (!form.condition) nextErrors.condition = "Select the item condition.";
    validateInventoryUnitFields(form, nextErrors);
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
      toast.warning("Confirm the delivery OTP before receiving stock.");
      return;
    }

    const unitCost = Number(form.unitCost);
    setPendingReceive(buildReceiveStockPayload(form, {
      unitCost,
      location: form.location.trim(),
      supplierId: form.supplierId,
      waybillNumber: form.waybillNumber.trim(),
      deliveredByName: form.deliveredByName.trim(),
      deliveredByPhone: form.deliveredByPhone.trim(),
      deliveredByEmail: form.deliveredByEmail.trim(),
      supplierPhone: form.supplierPhone.trim(),
      supplierEmail: form.supplierEmail.trim(),
      condition: form.condition,
    }, { itemUnit: item?.unit }));
  };

  const handleConfirmReceive = async () => {
    if (!pendingReceive || saving) return;
    setSaving(true);
    try {
      await onSave?.(pendingReceive);
      setPendingReceive(null);
    } catch (error) {
      toast.error(error.message ?? "Could not receive stock.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AddModal
        isOpen={isOpen && !pendingReceive && !addSupplierOpen}
        onClose={onClose}
        onSave={handleSave}
        title="Receive stock"
        subtitle={
          item
            ? `Receive stock for ${item.itemCode} — ${item.name}.`
            : "Receive stock into a store."
        }
        saveLabel={detailsConfirmed ? "Receive stock" : "Confirm details"}
        saveDisabled={detailsConfirmed && !otpVerified}
        dialogClassName="max-w-2xl"
        panelClassName="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 p-4 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Item details
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                label="Package quantity"
                type="number"
                required
                value={form.quantity}
                onChange={(e) => setField("quantity", e.target.value)}
                placeholder="e.g. 10"
                error={errors.quantity}
              />
              <MoneyInputField
                label="Unit cost (GHS)"
                required
                value={form.unitCost}
                onChange={(e) => setField("unitCost", e.target.value)}
                placeholder="0.00"
                error={errors.unitCost}
              />
              <InventoryUnitFields
                idPrefix="ssr"
                quantity={form.quantity}
                baseUnit={resolveItemBaseUnit(item?.unit)}
                unitOfMeasure={form.unitOfMeasure}
                unitsPerPack={form.unitsPerPack}
                onUnitChange={(value) => {
                  setField("unitOfMeasure", value);
                  if (normalizeInventoryUnit(value) === "pieces") {
                    setField("unitsPerPack", "");
                  }
                }}
                onUnitsPerPackChange={(value) => setField("unitsPerPack", value)}
                errors={errors}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <StoreSelect
                id="ssr-location"
                value={form.location}
                onChange={(next) => setField("location", next)}
                error={errors.location}
                label="Store location"
              />
            </div>
            <SupplierPicker
              id="ssr-supplier"
              label="Supplier"
              placeholder="Search supplier…"
              required
              value={form.supplierId}
              onChange={(next, supplier) => setField("supplierId", next, supplier)}
              error={errors.supplierId}
              onAddClick={() => setAddSupplierOpen(true)}
              reloadToken={supplierTick}
            />
            <InputField
              label="Supplier phone"
              type="tel"
              value={form.supplierPhone}
              readOnly
              placeholder={form.supplierId ? "—" : "Select a supplier"}
              className={readOnlyClassName}
            />
            <InputField
              label="Supplier email"
              type="email"
              value={form.supplierEmail}
              readOnly
              placeholder={form.supplierId ? "—" : "Select a supplier"}
              className={readOnlyClassName}
            />
            <InputField
              label="Delivered by (full name)"
              required
              value={form.deliveredByName}
              onChange={(e) => setField("deliveredByName", e.target.value)}
              placeholder="Full name"
              error={errors.deliveredByName}
            />
            <InputField
              label="Delivered by (phone)"
              type="tel"
              required
              value={form.deliveredByPhone}
              onChange={(e) => setField("deliveredByPhone", e.target.value)}
              placeholder="e.g. +233 24 000 0000"
              error={errors.deliveredByPhone}
            />
            <InputField
              label="Delivered by (email)"
              type="email"
              required
              value={form.deliveredByEmail}
              onChange={(e) => setField("deliveredByEmail", e.target.value)}
              placeholder="e.g. driver@supplier.com"
              error={errors.deliveredByEmail}
            />
            <InputField
              label="Waybill number"
              value={form.waybillNumber}
              onChange={(e) => setField("waybillNumber", e.target.value)}
              placeholder="e.g. WB-2026-0041"
            />
            <div className="space-y-1.5">
              <Label htmlFor="ssr-condition" className={errors.condition ? "text-red-500" : ""}>
                Item condition
                <span className="normal-case !text-red-500" aria-hidden="true">
                  {" "}
                  *
                </span>
              </Label>
              <select
                id="ssr-condition"
                value={form.condition}
                onChange={(e) => setField("condition", e.target.value)}
                className={cn(fieldClassName, errors.condition && "border-red-500 bg-red-50")}
              >
                <option value="">Select condition</option>
                {CONDITION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p
                className={cn(
                  "mt-1 min-h-[14px] text-[10px] font-medium leading-[14px]",
                  errors.condition ? "text-red-500" : "invisible",
                )}
                aria-live="polite"
              >
                {errors.condition || "\u00A0"}
              </p>
            </div>
          </div>

          <DeliveryPersonOtpSection
            deliveredByName={form.deliveredByName}
            deliveredByPhone={form.deliveredByPhone}
            deliveredByEmail={form.deliveredByEmail}
            otpSent={otpSent}
            otp={otp}
            otpVerified={otpVerified}
            onSendOtp={handleSendOtp}
            onOtpChange={setOtp}
            onVerifiedChange={setOtpVerified}
            sendDisabled={!deliveryContactReady}
            sendLoading={otpSending}
            detailsConfirmed={detailsConfirmed}
          />
        </div>
      </AddModal>

      <AddSupplierModal
        isOpen={addSupplierOpen}
        onClose={() => setAddSupplierOpen(false)}
        onCreated={(created) => {
          setSupplierTick((tick) => tick + 1);
          setField("supplierId", created.id, created);
        }}
      />

      <ConfirmationModal
        isOpen={Boolean(pendingReceive)}
        onClose={() => {
          if (saving) return;
          setPendingReceive(null);
        }}
        onConfirm={handleConfirmReceive}
        closeOnConfirm={false}
        confirmLoading={saving}
        title="Receive stock?"
        message={
          pendingReceive
            ? `Receive ${pendingReceive.quantity} of ${item?.itemCode || "this item"} into store?`
            : "Receive this stock into store."
        }
        confirmText={saving ? "Receiving…" : "Receive stock"}
      />
    </>
  );
}
