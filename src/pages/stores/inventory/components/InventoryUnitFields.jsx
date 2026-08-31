import React from "react";
import InputField from "../../../../components/common/fields/InputField";
import Label from "../../../../components/common/base/Label";
import { requiredFieldLabel } from "../../../../components/common/fields/requiredFieldLabel";
import { cn } from "../../../../utils/cn";
import {
  INVENTORY_UNIT_OPTIONS,
  calcInventoryTotalQuantity,
  inventoryPackSizeLabel,
  inventoryUnitRequiresPackSize,
} from "../utils/inventoryUnitOptions";

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 transition-colors text-slate-700";

const readOnlyClassName =
  "w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-[12px] text-slate-600 cursor-not-allowed";

export default function InventoryUnitFields({
  idPrefix = "inv",
  quantity = "",
  unitOfMeasure = "",
  unitsPerPack = "",
  onUnitChange,
  onUnitsPerPackChange,
  errors = {},
  required = true,
  className,
  inputClassName = "",
}) {
  const showPackSize = inventoryUnitRequiresPackSize(unitOfMeasure);
  const qty = Number(quantity);
  const perPack = Number(unitsPerPack);
  const hasQty = quantity !== "" && Number.isFinite(qty) && qty > 0;
  const hasPerPack = unitsPerPack !== "" && Number.isFinite(perPack) && perPack > 0;
  const totalQuantity = calcInventoryTotalQuantity(quantity, unitsPerPack, unitOfMeasure);

  return (
    <>
      <div className={cn("space-y-1.5 sm:col-span-2", className)}>
        <Label htmlFor={`${idPrefix}-unit-of-measure`} className={errors.unitOfMeasure ? "text-red-500" : ""}>
          {requiredFieldLabel("Unit of measure", required)}
        </Label>
        <select
          id={`${idPrefix}-unit-of-measure`}
          value={unitOfMeasure}
          onChange={(event) => onUnitChange?.(event.target.value)}
          className={cn(
            fieldClassName,
            inputClassName,
            errors.unitOfMeasure && "border-red-500 bg-red-50",
          )}
        >
          <option value="">Select unit of measure…</option>
          {INVENTORY_UNIT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.unitOfMeasure ? (
          <p className="text-[10px] font-medium text-red-500">{errors.unitOfMeasure}</p>
        ) : null}
      </div>

      {showPackSize ? (
        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            id={`${idPrefix}-units-per-pack`}
            label={inventoryPackSizeLabel(unitOfMeasure)}
            type="number"
            min="1"
            required={required}
            value={unitsPerPack}
            onChange={(event) => onUnitsPerPackChange?.(event.target.value)}
            placeholder="e.g. 12"
            error={errors.unitsPerPack}
            className={inputClassName}
          />
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-total-quantity`}>Total quantity</Label>
            <div id={`${idPrefix}-total-quantity`} className={readOnlyClassName}>
              {hasQty && hasPerPack
                ? `${qty} × ${perPack} = ${totalQuantity}`
                : hasQty
                  ? `${qty} × —`
                  : "—"}
            </div>
            <p className="text-[10px] text-slate-400">Quantity × number per unit</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
