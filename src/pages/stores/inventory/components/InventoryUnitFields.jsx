import React from "react";
import InputField from "../../../../components/common/fields/InputField";
import Label from "../../../../components/common/base/Label";
import { requiredFieldLabel } from "../../../../components/common/fields/requiredFieldLabel";
import { cn } from "../../../../utils/cn";
import {
  calcInventoryTotalQuantity,
  formatPackagingReceiptSummary,
  formatTotalBaseQuantity,
  baseUnitLabel,
  getBaseUnitOptions,
  inventoryPackSizeLabel,
  inventoryUnitRequiresPackSize,
  INVENTORY_UNIT_OPTIONS,
  normalizeBaseUnit,
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
  baseUnit = "piece",
  baseUnitEditable = false,
  onBaseUnitChange,
  onUnitChange,
  onUnitsPerPackChange,
  errors = {},
  required = true,
  className,
  inputClassName = "",
}) {
  const resolvedBaseUnit = normalizeBaseUnit(baseUnit);
  const baseUnitOptions = getBaseUnitOptions();
  const showPackSize = inventoryUnitRequiresPackSize(unitOfMeasure);
  const totalQuantity = calcInventoryTotalQuantity(quantity, unitsPerPack, unitOfMeasure);
  const summary = formatPackagingReceiptSummary({
    quantity,
    unitOfMeasure,
    unitsPerPack,
    baseUnit: resolvedBaseUnit,
  });

  const handleUnitChange = (value) => {
    onUnitChange?.(value);
    if (!inventoryUnitRequiresPackSize(value)) {
      onUnitsPerPackChange?.("");
    }
  };

  return (
    <>
      <div className={cn("space-y-1.5 sm:col-span-2", className)}>
        <Label htmlFor={`${idPrefix}-base-unit`} className={errors.baseUnit ? "text-red-500" : ""}>
          {requiredFieldLabel("Base unit", baseUnitEditable && required)}
        </Label>
        {baseUnitEditable ? (
          <>
            <select
              id={`${idPrefix}-base-unit`}
              value={resolvedBaseUnit}
              onChange={(event) => onBaseUnitChange?.(event.target.value)}
              className={cn(
                fieldClassName,
                inputClassName,
                errors.baseUnit && "border-red-500 bg-red-50",
              )}
            >
              <option value="">Select base unit…</option>
              {baseUnitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.baseUnit ? (
              <p className="text-[10px] font-medium text-red-500">{errors.baseUnit}</p>
            ) : null}
          </>
        ) : (
          <div id={`${idPrefix}-base-unit`} className={readOnlyClassName}>
            {baseUnitLabel(resolvedBaseUnit)}
          </div>
        )}
        <p className="text-[10px] text-slate-400">
          Stock is always tracked in the item&apos;s base unit.
        </p>
      </div>

      <div className={cn("space-y-1.5 sm:col-span-2", className)}>
        <Label htmlFor={`${idPrefix}-unit-of-measure`} className={errors.unitOfMeasure ? "text-red-500" : ""}>
          {requiredFieldLabel("Unit of measure", required)}
        </Label>
        <select
          id={`${idPrefix}-unit-of-measure`}
          value={unitOfMeasure}
          onChange={(event) => handleUnitChange(event.target.value)}
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
        <InputField
          id={`${idPrefix}-units-per-pack`}
          label={inventoryPackSizeLabel()}
          type="number"
          min="1"
          required={required}
          value={unitsPerPack}
          onChange={(event) => onUnitsPerPackChange?.(event.target.value)}
          placeholder="e.g. 8"
          error={errors.unitsPerPack}
          className={inputClassName}
        />
      ) : null}

      <div className={cn("space-y-1.5 sm:col-span-2", className)}>
        <Label htmlFor={`${idPrefix}-total-quantity`}>
          Total base quantity ({baseUnitLabel(resolvedBaseUnit).toLowerCase()}s)
        </Label>
        <div id={`${idPrefix}-total-quantity`} className={readOnlyClassName}>
          {quantity !== "" && totalQuantity != null
            ? formatTotalBaseQuantity(totalQuantity, resolvedBaseUnit)
            : "—"}
        </div>
        <p className="text-[10px] text-slate-400">
          {summary || (showPackSize ? "Quantity × units per package" : "Same as quantity when receiving in pieces")}
        </p>
      </div>
    </>
  );
}
