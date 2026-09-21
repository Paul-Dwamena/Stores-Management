import React, { useEffect, useMemo, useState } from "react";
import AddModal from "../../../../components/common/AddModal";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import Input from "../../../../components/common/base/Input";
import Label from "../../../../components/common/base/Label";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import StoreSelect from "./StoreSelect";
import { getItemStoreStock } from "../../../../services/inventoryService";
import {
  STOCK_CONDITION_OPTIONS,
  STOCK_CONDITION_REASON_OPTIONS,
  formatStockCondition,
  getStoreItemConditions,
} from "../../../../services/stockConditionsService";

const readOnlyClassName =
  "bg-slate-100 cursor-not-allowed focus:border-slate-200 focus:ring-0 focus:bg-slate-100";

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 transition-colors text-slate-700";

function FieldHint({ children, className }) {
  return (
    <p className={cn("text-[11px] text-slate-400 font-medium leading-snug", className)}>
      {children}
    </p>
  );
}

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
  previousCondition: "",
  newCondition: "",
  quantity: "",
  reason: "",
};

export default function ChangeStockConditionModal({ isOpen, onClose, item, onSave }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [stockStores, setStockStores] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [conditions, setConditions] = useState([]);
  const [conditionsLoading, setConditionsLoading] = useState(false);
  const [conditionsError, setConditionsError] = useState(null);
  const [pendingChange, setPendingChange] = useState(null);
  const [saving, setSaving] = useState(false);

  const selectedStore = useMemo(
    () => stockStores.find((store) => String(store.id) === String(form.storeId)) || null,
    [stockStores, form.storeId],
  );

  const previousConditionQty = useMemo(() => {
    if (!form.previousCondition) return null;
    const row = conditions.find((entry) => entry.condition === form.previousCondition);
    return row ? Number(row.quantity) || 0 : 0;
  }, [conditions, form.previousCondition]);

  useEffect(() => {
    if (!isOpen) return;
    setForm(INITIAL);
    setErrors({});
    setConditions([]);
    setConditionsError(null);
    setPendingChange(null);
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
            storeItemId: store.storeItemId ?? null,
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

  useEffect(() => {
    if (!isOpen || !form.storeId) {
      setConditions([]);
      setConditionsError(null);
      return undefined;
    }

    const storeItemId = selectedStore?.storeItemId;
    if (!storeItemId) {
      setConditions([]);
      setConditionsError(
        selectedStore
          ? "Missing store item id for the selected store."
          : null,
      );
      return undefined;
    }

    let cancelled = false;
    setConditionsLoading(true);
    setConditionsError(null);
    getStoreItemConditions(storeItemId)
      .then((rows) => {
        if (cancelled) return;
        setConditions(rows);
      })
      .catch((err) => {
        if (cancelled) return;
        setConditions([]);
        setConditionsError(err.message || "Unable to load condition quantities.");
      })
      .finally(() => {
        if (!cancelled) setConditionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, form.storeId, selectedStore?.storeItemId]);

  const setField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "storeId") {
        next.previousCondition = "";
        next.newCondition = "";
        next.quantity = "";
      }
      if (key === "previousCondition") {
        next.quantity = "";
        if (next.newCondition === value) next.newCondition = "";
      }
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      if (key === "storeId") {
        delete next.previousCondition;
        delete next.newCondition;
        delete next.quantity;
      }
      if (key === "previousCondition") delete next.quantity;
      return next;
    });
  };

  const validate = () => {
    const nextErrors = {};
    const quantity = Number(form.quantity);

    if (!form.storeId) nextErrors.storeId = "Select a store.";
    if (!form.previousCondition) nextErrors.previousCondition = "Select the current condition.";
    if (!form.newCondition) nextErrors.newCondition = "Select the new condition.";
    else if (form.newCondition === form.previousCondition) {
      nextErrors.newCondition = "New condition must be different.";
    }
    if (!form.quantity || Number.isNaN(quantity) || quantity <= 0) {
      nextErrors.quantity = "Enter a quantity greater than zero.";
    } else if (previousConditionQty != null && quantity > previousConditionQty) {
      nextErrors.quantity =
        `Cannot move more than ${previousConditionQty} in ${formatStockCondition(form.previousCondition) || "this condition"}.`;
    }
    if (!form.reason) nextErrors.reason = "Select a reason.";

    if (conditionsError) {
      nextErrors.storeId = conditionsError;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Complete the required fields before saving.");
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    setPendingChange({
      storeId: form.storeId,
      storeName: selectedStore?.name || "",
      itemId: item.id,
      quantity: Number(form.quantity),
      previousCondition: form.previousCondition,
      newCondition: form.newCondition,
      reason: form.reason,
    });
  };

  const handleConfirm = async () => {
    if (!pendingChange || saving) return;
    setSaving(true);
    try {
      await onSave?.(pendingChange);
      setPendingChange(null);
    } catch (error) {
      toast.error(error.message ?? "Could not change stock condition.");
    } finally {
      setSaving(false);
    }
  };

  const storeOptions = stockStores.map((store) => ({
    id: store.id,
    name: store.name,
    isActive: true,
  }));

  const previousOptions = STOCK_CONDITION_OPTIONS.filter((option) => {
    if (!conditions.length) return true;
    return conditions.some(
      (row) => row.condition === option.value && Number(row.quantity) > 0,
    );
  });

  return (
    <>
      <AddModal
        isOpen={isOpen && !pendingChange}
        onClose={onClose}
        onSave={handleSave}
        title="Change condition"
        subtitle={
          item
            ? `Update stock condition for ${item.itemCode || item.name || `Item #${item.id}`}.`
            : "Update stock condition."
        }
        saveLabel="Change condition"
        saveDisabled={conditionsLoading || Boolean(conditionsError)}
        dialogClassName="max-w-xl"
        panelClassName="max-w-xl"
        overlayClassName="!z-[10001]"
      >
        <div className="space-y-4">
          <StoreSelect
            id="condition-store"
            value={form.storeId}
            onChange={(next) => setField("storeId", next)}
            error={errors.storeId}
            label="Store"
            placeholder={stockLoading ? "Loading stores…" : "Search store…"}
            stores={storeOptions}
            required
            disabled={stockLoading}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
            <div className="flex flex-col">
              <Label
                htmlFor="condition-previous"
                className={errors.previousCondition ? "text-red-500" : ""}
              >
                Previous condition
                <span className="normal-case !text-red-500" aria-hidden="true"> *</span>
              </Label>
              <FieldHint className="min-h-[2.75rem]">
                Condition the quantity is currently under.
              </FieldHint>
              <DisabledFieldTooltip
                disabled={!form.storeId || conditionsLoading}
                title={
                  !form.storeId
                    ? "Select a store first."
                    : "Loading condition quantities…"
                }
              >
                <select
                  id="condition-previous"
                  value={form.previousCondition}
                  onChange={(e) => setField("previousCondition", e.target.value)}
                  disabled={!form.storeId || conditionsLoading}
                  className={cn(
                    fieldClassName,
                    errors.previousCondition && "border-red-500 bg-red-50",
                  )}
                >
                  <option value="">Select condition…</option>
                  {previousOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </DisabledFieldTooltip>
              {errors.previousCondition ? (
                <p className="mt-1 text-[10px] font-medium text-red-500">{errors.previousCondition}</p>
              ) : null}
            </div>

            <div className="flex flex-col">
              <Label htmlFor="condition-available">Qty in previous condition</Label>
              <FieldHint className="min-h-[2.75rem]">
                Available quantity for the selected previous condition.
              </FieldHint>
              <Input
                id="condition-available"
                value={
                  !form.previousCondition
                    ? ""
                    : conditionsLoading
                      ? "…"
                      : String(previousConditionQty ?? 0)
                }
                readOnly
                tabIndex={-1}
                placeholder={form.previousCondition ? "—" : "Select previous condition"}
                className={readOnlyClassName}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
            <div className="flex flex-col">
              <Label htmlFor="condition-new" className={errors.newCondition ? "text-red-500" : ""}>
                New condition
                <span className="normal-case !text-red-500" aria-hidden="true"> *</span>
              </Label>
              <FieldHint className="min-h-[2.75rem]">
                Condition to move the quantity into.
              </FieldHint>
              <select
                id="condition-new"
                value={form.newCondition}
                onChange={(e) => setField("newCondition", e.target.value)}
                disabled={!form.previousCondition}
                className={cn(fieldClassName, errors.newCondition && "border-red-500 bg-red-50")}
              >
                <option value="">Select condition…</option>
                {STOCK_CONDITION_OPTIONS.filter(
                  (option) => option.value !== form.previousCondition,
                ).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.newCondition ? (
                <p className="mt-1 text-[10px] font-medium text-red-500">{errors.newCondition}</p>
              ) : null}
            </div>

            <div className="flex flex-col">
              <Label htmlFor="condition-quantity" className={errors.quantity ? "text-red-500" : ""}>
                Quantity
                <span className="normal-case !text-red-500" aria-hidden="true"> *</span>
              </Label>
              <FieldHint className="min-h-[2.75rem]">
                Must not exceed qty in the previous condition.
              </FieldHint>
              <DisabledFieldTooltip
                disabled={!form.previousCondition}
                title="Select a previous condition first."
              >
                <Input
                  id="condition-quantity"
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setField("quantity", e.target.value)}
                  placeholder="e.g. 2"
                  disabled={!form.previousCondition}
                  className={errors.quantity ? "border-red-500 focus:border-red-500 bg-red-50" : ""}
                />
              </DisabledFieldTooltip>
              {errors.quantity ? (
                <p className="mt-1 text-[10px] font-medium text-red-500">{errors.quantity}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col">
            <Label htmlFor="condition-reason" className={errors.reason ? "text-red-500" : ""}>
              Reason
              <span className="normal-case !text-red-500" aria-hidden="true"> *</span>
            </Label>
            <FieldHint className="min-h-[2.75rem]">
              Why this stock condition is being changed.
            </FieldHint>
            <select
              id="condition-reason"
              value={form.reason}
              onChange={(e) => setField("reason", e.target.value)}
              className={cn(fieldClassName, errors.reason && "border-red-500 bg-red-50")}
            >
              <option value="">Select reason…</option>
              {STOCK_CONDITION_REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.reason ? (
              <p className="mt-1 text-[10px] font-medium text-red-500">{errors.reason}</p>
            ) : null}
          </div>

          {conditionsError ? (
            <p className="text-[12px] font-medium text-red-500">{conditionsError}</p>
          ) : null}
        </div>
      </AddModal>

      <ConfirmationModal
        isOpen={Boolean(pendingChange)}
        onClose={() => {
          if (saving) return;
          setPendingChange(null);
        }}
        onConfirm={handleConfirm}
        closeOnConfirm={false}
        confirmLoading={saving}
        className="!z-[10003]"
        title="Change condition?"
        message={
          pendingChange
            ? `Move ${pendingChange.quantity} from ${formatStockCondition(pendingChange.previousCondition)} to ${formatStockCondition(pendingChange.newCondition)} in ${pendingChange.storeName || "the selected store"}?`
            : "Change stock condition?"
        }
        confirmText={saving ? "Saving…" : "Change condition"}
      />
    </>
  );
}
