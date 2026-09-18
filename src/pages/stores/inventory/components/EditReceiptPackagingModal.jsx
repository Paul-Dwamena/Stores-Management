import React, { useEffect, useMemo, useState } from "react";
import AddModal from "../../../../components/common/AddModal";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import InputField from "../../../../components/common/fields/InputField";
import { toast } from "../../../../components/common/ToastNotification";
import InventoryUnitFields from "./InventoryUnitFields";
import {
  calcInventoryTotalQuantity,
  formatTotalBaseQuantity,
  inventoryUnitLabel,
  inventoryUnitRequiresPackSize,
  normalizeInventoryUnit,
  resolveItemBaseUnit,
  validateInventoryUnitFields,
} from "../utils/inventoryUnitOptions";

const INITIAL = {
  quantity: "",
  unitOfMeasure: "",
  unitsPerPack: "",
};

export default function EditReceiptPackagingModal({
  isOpen,
  onClose,
  receipt,
  item,
  onSave,
}) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [pendingSave, setPendingSave] = useState(null);
  const [saving, setSaving] = useState(false);

  const receiptTotal = Number(receipt?.quantity) || 0;
  const baseUnit = resolveItemBaseUnit(item?.unit);

  const computedTotal = useMemo(
    () => calcInventoryTotalQuantity(form.quantity, form.unitsPerPack, form.unitOfMeasure),
    [form.quantity, form.unitsPerPack, form.unitOfMeasure],
  );

  useEffect(() => {
    if (!isOpen || !receipt) return;
    const unitOfMeasure = normalizeInventoryUnit(receipt.unitOfMeasure) || "pieces";
    const packageQuantity =
      receipt.packageQuantity != null && receipt.packageQuantity !== ""
        ? String(receipt.packageQuantity)
        : unitOfMeasure === "pieces" && receiptTotal > 0
          ? String(receiptTotal)
          : "";
    setForm({
      quantity: packageQuantity,
      unitOfMeasure,
      unitsPerPack:
        receipt.unitsPerPack != null && receipt.unitsPerPack !== ""
          ? String(receipt.unitsPerPack)
          : unitOfMeasure === "pieces"
            ? "1"
            : "",
    });
    setErrors({});
    setPendingSave(null);
    setSaving(false);
  }, [isOpen, receipt?.id, receiptTotal]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key] && !prev.total) return prev;
      const next = { ...prev };
      delete next[key];
      delete next.total;
      return next;
    });
  };

  const validate = () => {
    const nextErrors = {};
    const quantity = Number(form.quantity);

    if (!form.quantity || Number.isNaN(quantity) || quantity <= 0) {
      nextErrors.quantity = "Enter a package quantity greater than zero.";
    }
    validateInventoryUnitFields(form, nextErrors);

    const total = calcInventoryTotalQuantity(
      form.quantity,
      form.unitsPerPack,
      form.unitOfMeasure,
    );

    if (!nextErrors.quantity && !nextErrors.unitOfMeasure && !nextErrors.unitsPerPack) {
      if (total == null) {
        nextErrors.total = "Enter packaging details that produce a valid total.";
      } else if (total !== receiptTotal) {
        nextErrors.total =
          total > receiptTotal
            ? `Packaging total (${total}) is above the receipt quantity (${receiptTotal}).`
            : `Packaging total (${total}) is below the receipt quantity (${receiptTotal}).`;
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Fix packaging so the total matches the receipt quantity.");
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    const unitOfMeasure = normalizeInventoryUnit(form.unitOfMeasure);
    setPendingSave({
      unitOfMeasure,
      packagingTypeLabel: inventoryUnitLabel(unitOfMeasure),
      unitsPerPack: inventoryUnitRequiresPackSize(unitOfMeasure)
        ? Number(form.unitsPerPack)
        : 1,
      packageQuantity: Number(form.quantity),
    });
  };

  const handleConfirm = async () => {
    if (!pendingSave || saving) return;
    setSaving(true);
    try {
      await onSave?.(pendingSave);
      setPendingSave(null);
    } catch (error) {
      toast.error(error.message ?? "Could not update packaging.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AddModal
        isOpen={isOpen && !pendingSave}
        onClose={onClose}
        onSave={handleSave}
        title="Edit packaging"
        subtitle={
          receipt
            ? `Update packaging for receipt #${receipt.id}.`
            : "Update receipt packaging."
        }
        saveLabel="Save"
        dialogClassName="max-w-lg"
        panelClassName="max-w-lg"
        overlayClassName="!z-[10002]"
      >
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Receipt total quantity
            </p>
            <p className="mt-1 text-[14px] font-bold tabular-nums text-slate-900">
              {formatTotalBaseQuantity(receiptTotal, baseUnit)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Packaging must match this total exactly.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InventoryUnitFields
              idPrefix="receipt-pack"
              quantity={form.quantity}
              baseUnit={baseUnit}
              unitOfMeasure={form.unitOfMeasure}
              unitsPerPack={form.unitsPerPack}
              packagingFieldsSameRow
                onUnitChange={(value) => {
                  setField("unitOfMeasure", value);
                  if (normalizeInventoryUnit(value) === "pieces") {
                    setField("unitsPerPack", "1");
                  }
                }}
              onUnitsPerPackChange={(value) => setField("unitsPerPack", value)}
              errors={errors}
              beforeTotal={
                <InputField
                  label="Package quantity"
                  type="number"
                  required
                  value={form.quantity}
                  onChange={(e) => setField("quantity", e.target.value)}
                  placeholder="e.g. 10"
                  error={errors.quantity}
                  containerClassName="sm:col-span-2 -mt-4"
                />
              }
            />
          </div>

          {errors.total ? (
            <p className="text-[12px] font-medium text-red-500" aria-live="polite">
              {errors.total}
            </p>
          ) : computedTotal != null && computedTotal === receiptTotal ? (
            <p className="text-[12px] font-medium text-success" aria-live="polite">
              Packaging matches the receipt total.
            </p>
          ) : null}
        </div>
      </AddModal>

      <ConfirmationModal
        isOpen={Boolean(pendingSave)}
        onClose={() => {
          if (saving) return;
          setPendingSave(null);
        }}
        onConfirm={handleConfirm}
        closeOnConfirm={false}
        confirmLoading={saving}
        className="!z-[10003]"
        title="Update packaging?"
        message={
          pendingSave
            ? `Save packaging as ${pendingSave.packageQuantity} ${String(pendingSave.packagingTypeLabel || "").toLowerCase()}${pendingSave.packageQuantity === 1 ? "" : "s"}${pendingSave.unitsPerPack ? ` × ${pendingSave.unitsPerPack}` : ""} for this receipt?`
            : "Save packaging for this receipt?"
        }
        confirmText={saving ? "Saving…" : "Save packaging"}
      />
    </>
  );
}
