export const INVENTORY_UNIT_OPTIONS = [
  { value: "pieces", label: "Pieces" },
  { value: "carton", label: "Carton" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "dozen", label: "Dozen" },
  { value: "can", label: "Can" },
];

export const BASE_UNIT_OPTIONS = [
  { value: "piece", label: "Piece" },
  { value: "set", label: "Set" },
  { value: "pair", label: "Pair" },
  { value: "liter", label: "Liter" },
  { value: "milliliter", label: "Milliliter" },
  { value: "gallon", label: "Gallon" },
  { value: "kilogram", label: "Kilogram" },
  { value: "gram", label: "Gram" },
  { value: "meter", label: "Meter" },
  { value: "centimeter", label: "Centimeter" },
  { value: "roll", label: "Roll" },
  { value: "sheet", label: "Sheet" },
  { value: "bottle", label: "Bottle" },
];

const BASE_UNIT_ALIASES = {
  pc: "piece",
  pcs: "piece",
  pieces: "piece",
  litre: "liter",
  litres: "liter",
  liters: "liter",
  l: "liter",
  ml: "milliliter",
  millilitre: "milliliter",
  milliliters: "milliliter",
  millilitres: "milliliter",
  gal: "gallon",
  gallons: "gallon",
  kg: "kilogram",
  kilograms: "kilogram",
  g: "gram",
  grams: "gram",
  m: "meter",
  metre: "meter",
  metres: "meter",
  meters: "meter",
  cm: "centimeter",
  centimetre: "centimeter",
  centimeters: "centimeter",
  centimetres: "centimeter",
  sets: "set",
  pairs: "pair",
  rolls: "roll",
  sheets: "sheet",
  bottles: "bottle",
};

export function getBaseUnitOptions() {
  return BASE_UNIT_OPTIONS;
}

export function normalizeInventoryUnit(unit) {
  const key = String(unit || "").trim().toLowerCase();
  if (!key || key === "pc" || key === "pcs" || key === "piece" || key === "pieces") {
    return "pieces";
  }
  if (INVENTORY_UNIT_OPTIONS.some((option) => option.value === key)) return key;
  if (key === "cartons") return "carton";
  if (key === "boxes") return "box";
  if (key === "packs") return "pack";
  if (key === "cans") return "can";
  if (key === "dozens") return "dozen";
  return "";
}

export function normalizeBaseUnit(unit) {
  const key = String(unit || "").trim().toLowerCase();
  if (!key) return "piece";
  if (BASE_UNIT_ALIASES[key]) return BASE_UNIT_ALIASES[key];
  const options = getBaseUnitOptions();
  const match = options.find((option) => option.value === key || option.label.toLowerCase() === key);
  return match?.value || key;
}

/** Maps API item.unit (e.g. pcs, liter) → base unit key for display. */
export function resolveItemBaseUnit(apiUnit) {
  const key = String(apiUnit || "").trim().toLowerCase();
  if (!key) return "piece";
  return normalizeBaseUnit(key);
}

/** Maps base unit key → API item.unit value. */
export function baseUnitApiValue(baseUnit) {
  const normalized = normalizeBaseUnit(baseUnit);
  if (normalized === "piece") return "pcs";
  return normalized;
}

export function inventoryUnitRequiresPackSize(unit) {
  const key = normalizeInventoryUnit(unit);
  return Boolean(key) && key !== "pieces";
}

export function inventoryUnitLabel(unit) {
  const key = normalizeInventoryUnit(unit);
  return INVENTORY_UNIT_OPTIONS.find((option) => option.value === key)?.label || "Unit";
}

export function baseUnitLabel(unit) {
  const key = normalizeBaseUnit(unit);
  return getBaseUnitOptions().find((option) => option.value === key)?.label
    || key.charAt(0).toUpperCase() + key.slice(1);
}

export function inventoryPackSizeLabel() {
  return "Units per package";
}

/** @deprecated Use baseUnitApiValue for item.unit. Kept for legacy callers. */
export function inventoryUnitApiValue(unit) {
  return baseUnitApiValue(resolveItemBaseUnit(unit) || "piece");
}

export function calcInventoryTotalQuantity(quantity, unitsPerPack, unitOfMeasure) {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) return null;
  if (!inventoryUnitRequiresPackSize(unitOfMeasure)) return qty;

  const perPack = Number(unitsPerPack);
  if (!Number.isFinite(perPack) || perPack <= 0) return null;
  return qty * perPack;
}

export function formatTotalBaseQuantity(total, baseUnit = "piece") {
  if (total == null || Number.isNaN(Number(total))) return "—";
  const label = baseUnitLabel(baseUnit);
  const count = Number(total);
  const plural = count === 1 ? label.toLowerCase() : `${label.toLowerCase()}s`;
  return `${count.toLocaleString("en-US")} ${plural}`;
}

export function formatPackagingReceiptSummary({
  quantity,
  unitOfMeasure,
  unitsPerPack,
  baseUnit = "piece",
}) {
  const qty = Number(quantity);
  const total = calcInventoryTotalQuantity(quantity, unitsPerPack, unitOfMeasure);
  if (!Number.isFinite(qty) || qty <= 0) return null;

  if (!inventoryUnitRequiresPackSize(unitOfMeasure)) {
    return formatTotalBaseQuantity(qty, baseUnit);
  }

  const perPack = Number(unitsPerPack);
  if (!Number.isFinite(perPack) || perPack <= 0 || total == null) {
    const packLabel = inventoryUnitLabel(unitOfMeasure).toLowerCase();
    return `${qty} ${packLabel}${qty === 1 ? "" : "s"}`;
  }

  const packLabel = inventoryUnitLabel(unitOfMeasure).toLowerCase();
  const packPlural = qty === 1 ? packLabel : `${packLabel}s`;
  const baseLabel = baseUnitLabel(baseUnit).toLowerCase();
  const basePlural = perPack === 1 ? baseLabel : `${baseLabel}s`;
  return `${qty} ${packPlural} × ${perPack} ${basePlural} = ${formatTotalBaseQuantity(total, baseUnit)}`;
}

export function buildInventoryUnitNotes({
  quantity,
  unitOfMeasure,
  unitsPerPack,
  baseUnit = "piece",
  notes = "",
} = {}) {
  const base = String(notes || "").trim();
  const qty = Number(quantity);
  const uom = normalizeInventoryUnit(unitOfMeasure);

  if (!Number.isFinite(qty) || qty <= 0 || !uom) return base;

  let receiptNote;
  if (!inventoryUnitRequiresPackSize(uom)) {
    receiptNote = formatTotalBaseQuantity(qty, baseUnit);
  } else {
    const perPack = Number(unitsPerPack);
    if (!Number.isFinite(perPack) || perPack <= 0) return base;

    const packLabel = inventoryUnitLabel(uom).toLowerCase();
    const packPlural = qty === 1 ? packLabel : `${packLabel}s`;
    const baseLabel = baseUnitLabel(baseUnit).toLowerCase();
    const basePlural = perPack === 1 ? baseLabel : `${baseLabel}s`;
    receiptNote = `${qty} ${packPlural} × ${perPack} ${basePlural}`;

    const total = calcInventoryTotalQuantity(quantity, unitsPerPack, unitOfMeasure);
    if (total != null) {
      receiptNote += ` = ${formatTotalBaseQuantity(total, baseUnit)}`;
    }
  }

  return base ? `${base} | ${receiptNote}` : receiptNote;
}

export function validateInventoryUnitFields(form, errors, { required = true, baseUnitRequired = false } = {}) {
  if (baseUnitRequired && !normalizeBaseUnit(form.baseUnit)) {
    errors.baseUnit = "Select a base unit.";
  }

  const unit = normalizeInventoryUnit(form.unitOfMeasure);
  if (required && !unit) {
    errors.unitOfMeasure = "Select a packaging type.";
    return;
  }
  if (!inventoryUnitRequiresPackSize(unit)) return;

  const count = Number(form.unitsPerPack);
  if (
    form.unitsPerPack === ""
    || Number.isNaN(count)
    || count <= 0
  ) {
    errors.unitsPerPack = "Enter units per package.";
  }
}

export function buildReceiveStockPayload(form, payload = {}, { itemUnit } = {}) {
  const unitOfMeasure = normalizeInventoryUnit(form.unitOfMeasure);
  const baseUnit = payload.itemId != null || itemUnit != null
    ? resolveItemBaseUnit(itemUnit ?? form.baseUnit)
    : normalizeBaseUnit(form.baseUnit || "piece");
  const totalQty = calcInventoryTotalQuantity(form.quantity, form.unitsPerPack, unitOfMeasure);

  return {
    ...payload,
    quantity: totalQty ?? Number(form.quantity),
    unitOfMeasure,
    unitsPerPack: form.unitsPerPack,
    baseUnit,
    unit: baseUnitApiValue(baseUnit),
    notes: buildInventoryUnitNotes({
      quantity: form.quantity,
      unitOfMeasure,
      unitsPerPack: form.unitsPerPack,
      baseUnit,
      notes: form.notes ?? payload.notes ?? "",
    }),
  };
}
