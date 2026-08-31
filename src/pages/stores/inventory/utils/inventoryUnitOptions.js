export const INVENTORY_UNIT_OPTIONS = [
  { value: "pieces", label: "Pieces" },
  { value: "carton", label: "Carton" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
];

export function normalizeInventoryUnit(unit) {
  const key = String(unit || "").trim().toLowerCase();
  if (!key || key === "pc" || key === "pcs" || key === "piece" || key === "pieces") {
    return "pieces";
  }
  return INVENTORY_UNIT_OPTIONS.some((option) => option.value === key) ? key : "";
}

export function inventoryUnitRequiresPackSize(unit) {
  const key = normalizeInventoryUnit(unit);
  return Boolean(key) && key !== "pieces";
}

export function inventoryUnitLabel(unit) {
  const key = normalizeInventoryUnit(unit);
  return INVENTORY_UNIT_OPTIONS.find((option) => option.value === key)?.label || "Unit";
}

export function inventoryPackSizeLabel(unit) {
  return `Number per ${inventoryUnitLabel(unit)}`;
}

export function inventoryUnitApiValue(unit) {
  const key = normalizeInventoryUnit(unit);
  if (!key || key === "pieces") return "pcs";
  return key;
}

export function calcInventoryTotalQuantity(quantity, unitsPerPack, unitOfMeasure) {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) return null;
  if (!inventoryUnitRequiresPackSize(unitOfMeasure)) return qty;

  const perPack = Number(unitsPerPack);
  if (!Number.isFinite(perPack) || perPack <= 0) return null;
  return qty * perPack;
}

export function buildInventoryUnitNotes({ unitOfMeasure, unitsPerPack, notes = "" } = {}) {
  const base = String(notes || "").trim();
  if (!inventoryUnitRequiresPackSize(unitOfMeasure)) return base;

  const count = Number(unitsPerPack);
  if (!Number.isFinite(count) || count <= 0) return base;

  const packNote = `${count} pieces per ${inventoryUnitLabel(unitOfMeasure).toLowerCase()}`;
  return base ? `${base} | ${packNote}` : packNote;
}

export function validateInventoryUnitFields(form, errors, { required = true } = {}) {
  const unit = normalizeInventoryUnit(form.unitOfMeasure);
  if (required && !unit) {
    errors.unitOfMeasure = "Select a unit of measure.";
    return;
  }
  if (!inventoryUnitRequiresPackSize(unit)) return;

  const count = Number(form.unitsPerPack);
  if (
    form.unitsPerPack === ""
    || Number.isNaN(count)
    || count <= 0
  ) {
    errors.unitsPerPack = `Enter how many pieces are in each ${inventoryUnitLabel(unit).toLowerCase()}.`;
  }
}
