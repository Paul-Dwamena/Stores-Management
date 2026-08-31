import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Pencil, Plus, Replace, Search, Trash2, X } from "lucide-react";
import AddModal from "../../../../components/common/AddModal";
import Button from "../../../../components/common/base/Button";
import SlideOverSheet from "../../../../components/common/SlideOverSheet";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import InputField from "../../../../components/common/fields/InputField";
import MoneyInputField from "../../../../components/common/fields/MoneyInputField";
import TableIconAction from "../../../../components/common/tableActions/TableIconAction";
import TableRowActions from "../../../../components/common/tableActions/TableRowActions";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import { formatInventoryMoney, sendDeliveryOtp } from "../../../../services/inventoryService";
import { formatMoneyAmount } from "../../../../utils/displayFormatters";
import { useBrandSelectOptions, useCategorySelectOptions } from "../../../../hooks/useCatalogOptions";
import { catalogOptionLabel } from "../../../../utils/catalogRefHelpers";
import {
  VEHICLE_PART_MAKE_OPTIONS,
  getVehiclePartModelOptions,
  getVehiclePartYearOptions,
} from "../../../../mockdata/stores/vehiclePartsInventory";
import ComponentLevelSelects from "../../vehicleParts/ComponentLevelSelects";
import { VEHICLE_COMPONENT_LEVEL_KEYS } from "../../vehicleParts/vehicleComponentTreeHelpers";
import ItemPhotoField, { ItemPhotoThumb } from "./ItemPhotoField";
import {
  ItemNameDisplay,
  StoreLocationDisplay,
} from "../../../../components/common/display/FormattedDisplay";
import { formatBrand } from "../../../../utils/displayFormatters";
import { listStores } from "../../../../services/storesService";
import AddSupplierModal from "./AddSupplierModal";
import DeliveryPersonOtpSection from "./DeliveryPersonOtpSection";
import SupplierPicker from "./SupplierPicker";
import StoreSelect from "./StoreSelect";
import InventoryUnitFields from "./InventoryUnitFields";
import {
  baseUnitApiValue,
  buildInventoryUnitNotes,
  calcInventoryTotalQuantity,
  normalizeBaseUnit,
  normalizeInventoryUnit,
  resolveItemBaseUnit,
  validateInventoryUnitFields,
} from "../utils/inventoryUnitOptions";

const fieldClassName =
  "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 transition-colors text-slate-700";

const readOnlyClassName =
  "w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-[12px] text-slate-600 cursor-not-allowed";

const whiteInputClassName = "bg-white focus:bg-white";

const changeItemButtonClassName =
  "inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-600";

const CONDITION_OPTIONS = [
  { value: "GOOD", label: "Good" },
  { value: "BAD", label: "Bad" },
  { value: "BROKEN", label: "Broken" },
  { value: "PARTIALLY_DAMAGED", label: "Partially damaged" },
  { value: "DAMAGED", label: "Damaged" },
];

const INITIAL_SHARED = {
  supplierId: "",
  supplierPhone: "",
  supplierEmail: "",
  waybillNumber: "",
  deliveredByName: "",
  deliveredByPhone: "",
  deliveredByEmail: "",
  condition: "GOOD",
  notes: "",
};

function createLine(inventoryType, mode) {
  return {
    clientId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemId: "",
    name: "",
    brand: "",
    category: "",
    description: "",
    make: "",
    model: "",
    year: "",
    chassisNumber: "",
    level1: "",
    level2: "",
    level3: "",
    level4: "",
    level5: "",
    level6: "",
    quantity: "",
    baseUnit: "piece",
    unitOfMeasure: "",
    unitsPerPack: "",
    unitCost: "",
    location: "",
    photo: "",
    condition: "",
    notes: "",
    inventoryType,
    mode,
  };
}

function lineName(line, inventoryType, mode, items) {
  if (mode === "existing") {
    return items.find((item) => item.id === line.itemId)?.name || "Selected item";
  }
  if (inventoryType === "accessory") return line.name.trim() || "New accessory";
  const levels = VEHICLE_COMPONENT_LEVEL_KEYS.map((key) => line[key]).filter(Boolean);
  return levels.at(-1) || "New vehicle part";
}

function linePhoto(line, mode, items) {
  if (line.photo) return line.photo;
  if (mode === "existing" && line.itemId) {
    return items.find((item) => item.id === line.itemId)?.photo || "";
  }
  return "";
}

function calcLineTotal(quantity, unitCost) {
  const qty = Number(quantity);
  const unit = Number(unitCost);
  if (Number.isNaN(qty) || Number.isNaN(unit) || quantity === "" || unitCost === "") return null;
  return qty * unit;
}

function getLineErrors(line, mode, inventoryType) {
  const next = {};
  if (mode === "existing" && !line.itemId) next.itemId = "Select an inventory item.";
  if (mode === "new" && inventoryType === "accessory") {
    if (!line.brand) next.brand = "Select a brand.";
    if (!line.category) next.category = "Select a category.";
    if (!line.name.trim()) next.name = "Enter an item name.";
  }
  if (mode === "new" && inventoryType === "vehicle_part") {
    if (!line.make) next.make = "Select a make.";
    if (!line.model) next.model = "Select a model.";
    if (!line.year) next.year = "Select a year.";
    if (!line.level1) next.level1 = "Select at least the first component level.";
  }
  if (!line.quantity || Number(line.quantity) <= 0) {
    next.quantity = "Enter a quantity greater than zero.";
  }
  if (line.unitCost === "" || Number(line.unitCost) < 0) {
    next.unitCost = "Enter a valid unit price.";
  }
  if (!line.location?.trim()) next.location = "Select a store location.";
  validateInventoryUnitFields(line, next, {
    baseUnitRequired: mode === "new" && inventoryType === "accessory",
  });
  return next;
}

function ErrorText({ children }) {
  return children ? <p className="mt-1 text-[10px] font-medium text-rose-600">{children}</p> : null;
}

function FieldLabel({ children, required = false, error = false, htmlFor }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "text-[10px] font-bold uppercase tracking-wider",
        error ? "text-red-500" : "text-slate-500",
      )}
    >
      {children}
      {required ? (
        <span className="normal-case !text-red-500" aria-hidden="true"> *</span>
      ) : null}
    </label>
  );
}

function RegistrationTabs({ value, onChange }) {
  return (
    <div className="tab-track w-full">
      {[
        { id: "existing", label: "Registered items" },
        { id: "new", label: "Unregistered items" },
      ].map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn("tab-pill flex-1", value === tab.id && "tab-pill-active")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function CollapsibleSection({ title, description, open, onToggle, children, errorCount = 0 }) {
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-1.5 px-3 py-2.5 text-left transition-colors",
          "bg-slate-50 hover:bg-slate-100/80",
          open && "border-b border-slate-200",
        )}
        aria-expanded={open}
      >
        <ChevronDown
          size={14}
          className={cn(
            "text-primary shrink-0 transition-transform duration-200",
            !open && "-rotate-90",
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="block text-[10px] font-bold text-primary uppercase tracking-wider">
              {title}
            </span>
            {errorCount > 0 ? (
              <span className="rounded-full bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 normal-case tracking-normal">
                {errorCount}
              </span>
            ) : null}
          </span>
          {description ? (
            <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-slate-400">
              {description}
            </span>
          ) : null}
        </span>
      </button>
      {open ? <div className="space-y-3 bg-white px-3 py-3">{children}</div> : null}
    </div>
  );
}

function SharedSupplyFields({ value, errors, onChange, onAddSupplier, supplierTick }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SupplierPicker
          value={value.supplierId}
          onChange={(supplierId, supplier) => {
            onChange("supplierId", supplierId);
            onChange("supplierPhone", supplier?.phone || "");
            onChange("supplierEmail", supplier?.email || "");
          }}
          error={errors.supplierId}
          onAddClick={onAddSupplier}
          reloadToken={supplierTick}
        />
        <InputField
          label="Supplier phone"
          type="tel"
          value={value.supplierPhone}
          readOnly
          placeholder={value.supplierId ? "—" : "Select a supplier"}
          className={readOnlyClassName}
        />
        <InputField
          label="Supplier email"
          type="email"
          value={value.supplierEmail}
          readOnly
          placeholder={value.supplierId ? "—" : "Select a supplier"}
          className={readOnlyClassName}
        />
        <InputField
          label="Delivered by (full name)"
          required
          value={value.deliveredByName}
          onChange={(event) => onChange("deliveredByName", event.target.value)}
          error={errors.deliveredByName}
          placeholder="Full name"
        className={whiteInputClassName}
        />
        <InputField
          label="Delivered by (phone)"
          required
          type="tel"
          value={value.deliveredByPhone}
          onChange={(event) => onChange("deliveredByPhone", event.target.value)}
          placeholder="e.g. +233 24 000 0000"
          error={errors.deliveredByPhone}
          className={whiteInputClassName}
        />
        <InputField
          label="Delivered by (email)"
          type="email"
          required
          value={value.deliveredByEmail}
          onChange={(event) => onChange("deliveredByEmail", event.target.value)}
          placeholder="e.g. driver@supplier.com"
          error={errors.deliveredByEmail}
          className={whiteInputClassName}
        />
        <InputField
          label="Waybill number"
          value={value.waybillNumber}
          onChange={(event) => onChange("waybillNumber", event.target.value)}
          placeholder="e.g. WB-2026-0041"
        className={whiteInputClassName}
        />
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Item condition *
          </label>
          <select
            value={value.condition}
            onChange={(event) => onChange("condition", event.target.value)}
            className={fieldClassName}
          >
            {CONDITION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
    </div>
  );
}

function LocationSelect({ value, onChange, error }) {
  return (
    <StoreSelect
      value={value}
      onChange={onChange}
      error={error}
      className="mt-1 bg-white"
    />
  );
}

function ReceiveLineFields({ line, errors, onChange, mode, items = [] }) {
  const selectedItem = line.itemId ? items.find((item) => item.id === line.itemId) : null;
  const baseUnit = line.itemId
    ? resolveItemBaseUnit(selectedItem?.unit)
    : normalizeBaseUnit(line.baseUnit || "piece");
  const total = calcLineTotal(line.quantity, line.unitCost);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <InputField
        label="Package quantity"
        required
        type="number"
        min="1"
        value={line.quantity}
        onChange={(event) => onChange("quantity", event.target.value)}
        error={errors.quantity}
        className={whiteInputClassName}
      />
      <MoneyInputField
        label="Unit price (GHS)"
        required
        placeholder="0.00"
        value={line.unitCost}
        onChange={(event) => onChange("unitCost", event.target.value)}
        error={errors.unitCost}
        className={whiteInputClassName}
      />
      <InventoryUnitFields
        idPrefix={`bulk-${line.clientId}`}
        quantity={line.quantity}
        baseUnit={baseUnit}
        baseUnitEditable={mode === "new" && !line.itemId}
        unitOfMeasure={line.unitOfMeasure}
        unitsPerPack={line.unitsPerPack}
        onBaseUnitChange={(value) => onChange("baseUnit", value)}
        onUnitChange={(value) => {
          onChange("unitOfMeasure", value);
          if (normalizeInventoryUnit(value) === "pieces") {
            onChange("unitsPerPack", "");
          }
        }}
        onUnitsPerPackChange={(value) => onChange("unitsPerPack", value)}
        errors={errors}
        inputClassName={whiteInputClassName}
      />
      <div className="sm:col-span-2 space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Total price (GHS)
        </p>
        <div className={readOnlyClassName}>
          {total == null ? "—" : formatMoneyAmount(total)}
        </div>
        <p className="text-[10px] text-slate-400">
          Auto-calculated from quantity × unit price
        </p>
      </div>
      <div className="sm:col-span-2">
        <LocationSelect
          value={line.location}
          onChange={(value) => onChange("location", value)}
          error={errors.location}
        />
      </div>
    </div>
  );
}

function EditorPane({ step, title, children }) {
  return (
    <section className="flex min-h-0 min-w-0 flex-col border-b border-slate-100 lg:border-b-0 lg:border-r lg:last:border-r-0">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
          {step}. {title}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
    </section>
  );
}

function ExistingLineFields({
  line,
  items,
  errors,
  onChange,
  usedItemIds,
  inventoryType,
  splitPanes = false,
}) {
  const [search, setSearch] = useState("");
  const [componentFilterOpen, setComponentFilterOpen] = useState(true);
  const selected = items.find((item) => item.id === line.itemId) ?? null;
  const isVehiclePart = inventoryType === "vehicle_part";

  const makeOptions = useMemo(() => {
    if (!isVehiclePart) return [];
    return [...new Set(items.map((item) => item.make).filter(Boolean))].sort();
  }, [items, isVehiclePart]);

  const modelOptions = useMemo(() => {
    if (!line.make) return [];
    return [
      ...new Set(
        items
          .filter((item) => item.make === line.make)
          .map((item) => item.model)
          .filter(Boolean),
      ),
    ].sort();
  }, [items, line.make]);

  const yearOptions = useMemo(() => {
    if (!line.make || !line.model) return [];
    return [
      ...new Set(
        items
          .filter((item) => item.make === line.make && item.model === line.model)
          .map((item) => String(item.year))
          .filter(Boolean),
      ),
    ].sort((a, b) => Number(b) - Number(a));
  }, [items, line.make, line.model]);

  const hasVehiclePartFilters =
    !isVehiclePart || Boolean(line.make && line.model && line.year);

  const filtered = useMemo(() => {
    let available = items.filter(
      (item) => !usedItemIds.has(item.id) || item.id === line.itemId,
    );
    if (isVehiclePart) {
      if (!hasVehiclePartFilters) return [];
      available = available.filter((item) => {
        if (item.make !== line.make) return false;
        if (item.model !== line.model) return false;
        if (String(item.year) !== String(line.year)) return false;
        for (let i = 0; i < 6; i += 1) {
          const key = `level${i + 1}`;
          const selectedLevel = line[key];
          if (selectedLevel && item[key] !== selectedLevel) return false;
        }
        return true;
      });
    }
    const q = search.trim().toLowerCase();
    if (!q) return available.slice(0, 12);
    return available
      .filter((item) =>
        [item.itemCode, item.name, item.brand, item.description, item.make, item.model]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 12);
  }, [
    items,
    search,
    usedItemIds,
    line.itemId,
    line.make,
    line.model,
    line.year,
    line.level1,
    line.level2,
    line.level3,
    line.level4,
    line.level5,
    line.level6,
    isVehiclePart,
    hasVehiclePartFilters,
  ]);

  const setVehicleFilter = (field, value) => {
    if (field === "make") {
      onChange("make", value);
      onChange("model", "");
      onChange("year", "");
      onChange("itemId", "");
      onChange("componentLevels", {
        level1: "",
        level2: "",
        level3: "",
        level4: "",
        level5: "",
        level6: "",
      });
    } else if (field === "model") {
      onChange("model", value);
      onChange("year", "");
      onChange("itemId", "");
      onChange("componentLevels", {
        level1: "",
        level2: "",
        level3: "",
        level4: "",
        level5: "",
        level6: "",
      });
    } else if (field === "year") {
      onChange("year", value);
      onChange("itemId", "");
    }
    setSearch("");
  };

  const findBlock = (
    <div className="space-y-3">
      {!selected ? (
        <>
          {isVehiclePart ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <FieldLabel required>Make</FieldLabel>
                  <select
                    value={line.make}
                    onChange={(event) => setVehicleFilter("make", event.target.value)}
                    className={cn(fieldClassName, "mt-1")}
                  >
                    <option value="">Select make</option>
                    {makeOptions.map((make) => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel required>Model</FieldLabel>
                  <select
                    value={line.model}
                    onChange={(event) => setVehicleFilter("model", event.target.value)}
                    disabled={!line.make}
                    className={cn(fieldClassName, "mt-1", !line.make && "opacity-60")}
                  >
                    <option value="">{!line.make ? "Select make first" : "Select model"}</option>
                    {modelOptions.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <FieldLabel required>Year</FieldLabel>
                  <select
                    value={line.year}
                    onChange={(event) => setVehicleFilter("year", event.target.value)}
                    disabled={!line.model}
                    className={cn(fieldClassName, "mt-1", !line.model && "opacity-60")}
                  >
                    <option value="">{!line.model ? "Select model first" : "Select year"}</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              <CollapsibleSection
                title="Vehicle part component"
                description="Optional. Narrow the list by component level."
                open={componentFilterOpen}
                onToggle={() => setComponentFilterOpen((prev) => !prev)}
              >
                <ComponentLevelSelects
                  levels={Object.fromEntries(
                    VEHICLE_COMPONENT_LEVEL_KEYS.map((key) => [key, line[key]]),
                  )}
                  onChange={(levels) => {
                    onChange("componentLevels", levels);
                    onChange("itemId", "");
                    setSearch("");
                  }}
                />
              </CollapsibleSection>
            </>
          ) : null}
          {hasVehiclePartFilters ? (
            <div>
              <FieldLabel required error={Boolean(errors.itemId)}>
                Search registered item
              </FieldLabel>
              <div className="relative mt-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className={cn(fieldClassName, "pl-9", errors.itemId && "border-rose-500 bg-rose-50")}
                  placeholder="Search by code, name, brand…"
                />
              </div>
              <ErrorText>{errors.itemId}</ErrorText>
              <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                {filtered.length === 0 ? (
                  <p className="px-3 py-2 text-[11px] text-slate-400">No matching items.</p>
                ) : (
                  filtered.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onChange("itemId", item.id);
                        if (!line.unitCost && item.unitCost != null) {
                          onChange("unitCost", String(item.unitCost));
                        }
                        setSearch("");
                      }}
                      className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <ItemPhotoThumb src={item.photo} name={item.name} className="h-9 w-9" />
                        <div className="min-w-0">
                          <p className="text-[12px]">
                            <ItemNameDisplay value={item.name} className="text-slate-800" />
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {item.itemCode}
                            {item.brand ? ` · ${formatBrand(item.brand)}` : ""}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] font-medium text-slate-400">
                        Qty {item.quantity ?? 0}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-3 text-[11px] text-slate-500">
              Select make, model, and year to search registered vehicle parts.
            </p>
          )}
        </>
      ) : (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] text-slate-600">
          Selected{" "}
          <ItemNameDisplay value={selected.name} className="inline text-slate-900" />
          . Change it from Item details.
        </p>
      )}
    </div>
  );

  const detailsBlock = selected ? (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <ItemPhotoThumb src={selected.photo} name={selected.name} className="h-9 w-9" />
            <div className="min-w-0">
              <p className="truncate text-[12px]">
                <ItemNameDisplay value={selected.name} className="text-slate-900" />
              </p>
              <p className="truncate text-[10px] leading-tight text-slate-500">
              {[
                selected.itemCode,
                selected.brand ? formatBrand(selected.brand) : null,
                selected.make
                  ? `${selected.make} ${selected.model || ""} ${selected.year || ""}`.trim()
                  : null,
                `On hand ${selected.quantity ?? 0}`,
              ].filter(Boolean).join(" · ")}
            </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange("itemId", "")}
            className={changeItemButtonClassName}
          >
            <Replace size={12} />
            Change
          </button>
        </div>
      </div>
      <LineOverrideFields line={line} onChange={onChange} />
    </div>
  ) : (
    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-[12px] text-slate-500">
      Select an item to see details.
    </p>
  );

  const receiveBlock = (
    <ReceiveLineFields line={line} errors={errors} onChange={onChange} mode="existing" items={items} />
  );

  return (
    <div className={splitPanes ? "contents" : "space-y-3"}>
      {splitPanes ? <EditorPane step="1" title="Find item">{findBlock}</EditorPane> : findBlock}
      {splitPanes ? <EditorPane step="2" title="Item details">{detailsBlock}</EditorPane> : detailsBlock}
      {splitPanes ? <EditorPane step="3" title="Receive">{receiveBlock}</EditorPane> : receiveBlock}
    </div>
  );
}

function LineOverrideFields({ line, onChange }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Condition override
      </label>
      <select
        value={line.condition}
        onChange={(event) => onChange("condition", event.target.value)}
        className={fieldClassName}
      >
        <option value="">Use shared condition</option>
        {CONDITION_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function NewAccessoryFields({ line, errors, onChange, splitPanes = false }) {
  const brandOptions = useBrandSelectOptions(true);
  const categoryOptions = useCategorySelectOptions(true);
  const identifyBlock = (
    <div className="space-y-3">
      <ItemPhotoField
        id={`bulk-acc-photo-${line.clientId}`}
        value={line.photo}
        onChange={(photo) => onChange("photo", photo)}
      />
      <div>
        <FieldLabel required error={Boolean(errors.brand)}>Brand</FieldLabel>
        <select
          value={line.brand}
          onChange={(event) => onChange("brand", event.target.value)}
          className={cn(fieldClassName, "mt-1", errors.brand && "border-rose-500 bg-rose-50")}
        >
          <option value="">Select brand</option>
          {brandOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <ErrorText>{errors.brand}</ErrorText>
      </div>
      <div>
        <FieldLabel required error={Boolean(errors.category)}>Category</FieldLabel>
        <select
          value={line.category}
          onChange={(event) => onChange("category", event.target.value)}
          className={cn(fieldClassName, "mt-1", errors.category && "border-rose-500 bg-rose-50")}
        >
          <option value="">Select category</option>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <ErrorText>{errors.category}</ErrorText>
      </div>
      <InputField
        label="Name"
        required
        placeholder="Enter item name..."
        value={line.name}
        onChange={(event) => onChange("name", event.target.value)}
        error={errors.name}
        className={whiteInputClassName}
      />
      <InputField
        label="Description"
        placeholder="Enter item description..."
        value={line.description}
        onChange={(event) => onChange("description", event.target.value)}
        className={whiteInputClassName}
      />
    </div>
  );
  const detailsBlock = <LineOverrideFields line={line} onChange={onChange} />;
  const receiveBlock = (
    <ReceiveLineFields line={line} errors={errors} onChange={onChange} mode="new" items={[]} />
  );

  return (
    <div className={splitPanes ? "contents" : "space-y-3"}>
      {splitPanes ? <EditorPane step="1" title="Identify item">{identifyBlock}</EditorPane> : identifyBlock}
      {splitPanes ? <EditorPane step="2" title="Item details">{detailsBlock}</EditorPane> : detailsBlock}
      {splitPanes ? <EditorPane step="3" title="Receive">{receiveBlock}</EditorPane> : receiveBlock}
    </div>
  );
}

function NewVehiclePartFields({ line, errors, onChange, splitPanes = false }) {
  const modelOptions = getVehiclePartModelOptions(line.make);
  const yearOptions = getVehiclePartYearOptions(line.make, line.model);
  const identifyBlock = (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel required error={Boolean(errors.make)}>Make</FieldLabel>
          <select
            value={line.make}
            onChange={(event) => onChange("make", event.target.value)}
            className={cn(fieldClassName, "mt-1", errors.make && "border-rose-500 bg-rose-50")}
          >
            <option value="">Select make</option>
            {VEHICLE_PART_MAKE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ErrorText>{errors.make}</ErrorText>
        </div>
        <div>
          <FieldLabel required error={Boolean(errors.model)}>Model</FieldLabel>
          <select
            value={line.model}
            onChange={(event) => onChange("model", event.target.value)}
            disabled={!line.make}
            className={cn(fieldClassName, "mt-1", errors.model && "border-rose-500 bg-rose-50")}
          >
            <option value="">Select model</option>
            {modelOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ErrorText>{errors.model}</ErrorText>
        </div>
        <div>
          <FieldLabel required error={Boolean(errors.year)}>Year</FieldLabel>
          <select
            value={line.year}
            onChange={(event) => onChange("year", event.target.value)}
            disabled={!line.model}
            className={cn(fieldClassName, "mt-1", errors.year && "border-rose-500 bg-rose-50")}
          >
            <option value="">Select year</option>
            {yearOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ErrorText>{errors.year}</ErrorText>
        </div>
        <InputField
          label="VIN / Chassis"
          value={line.chassisNumber}
          onChange={(event) => onChange("chassisNumber", event.target.value)}
          className={whiteInputClassName}
        />
      </div>
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Vehicle component
          <span className="normal-case !text-red-500" aria-hidden="true"> *</span>
        </p>
        <ComponentLevelSelects
          levels={Object.fromEntries(VEHICLE_COMPONENT_LEVEL_KEYS.map((key) => [key, line[key]]))}
          onChange={(levels) => onChange("componentLevels", levels)}
        />
        <ErrorText>{errors.level1}</ErrorText>
      </div>
    </div>
  );
  const detailsBlock = <LineOverrideFields line={line} onChange={onChange} />;
  const receiveBlock = (
    <ReceiveLineFields line={line} errors={errors} onChange={onChange} mode="new" items={[]} />
  );

  return (
    <div className={splitPanes ? "contents" : "space-y-3"}>
      {splitPanes ? <EditorPane step="1" title="Identify item">{identifyBlock}</EditorPane> : identifyBlock}
      {splitPanes ? <EditorPane step="2" title="Item details">{detailsBlock}</EditorPane> : detailsBlock}
      {splitPanes ? <EditorPane step="3" title="Receive">{receiveBlock}</EditorPane> : receiveBlock}
    </div>
  );
}

function applyLineChange(line, key, value) {
  if (key === "componentLevels") return { ...line, ...value };
  if (key === "make") return { ...line, make: value, model: "", year: "" };
  if (key === "model") return { ...line, model: value, year: "" };
  return { ...line, [key]: value };
}

function lineMeta(line, items, mode, brandOptions = []) {
  if (mode === "existing") {
    const item = items.find((row) => row.id === line.itemId);
    return [item?.itemCode, item?.brand ? formatBrand(item.brand) : null].filter(Boolean).join(" · ") || "—";
  }
  if (line.inventoryType === "vehicle_part" || line.make) {
    return [line.make, line.model, line.year].filter(Boolean).join(" · ") || "—";
  }
  const brandLabel = catalogOptionLabel(brandOptions, line.brand);
  return brandLabel || "—";
}

const thClass =
  "px-3 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-left";
const tdClass = "px-3 py-2.5 align-middle text-[12px] text-slate-700";

function LineEditorPanel({
  line,
  errors,
  mode,
  inventoryType,
  items,
  usedItemIds,
  onChange,
}) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden bg-slate-50/40 lg:grid-cols-3">
      {mode === "existing" ? (
        <ExistingLineFields
          splitPanes
          line={line}
          items={items}
          errors={errors}
          onChange={onChange}
          usedItemIds={usedItemIds}
          inventoryType={inventoryType}
        />
      ) : inventoryType === "vehicle_part" ? (
        <NewVehiclePartFields splitPanes line={line} errors={errors} onChange={onChange} />
      ) : (
        <NewAccessoryFields splitPanes line={line} errors={errors} onChange={onChange} />
      )}
    </div>
  );
}

export default function BulkInventoryReceiptModal({
  isOpen,
  onClose,
  inventoryType,
  items = [],
  onSave,
  forcedMode = null,
}) {
  const [mode, setMode] = useState(forcedMode || "existing");
  const [shared, setShared] = useState(INITIAL_SHARED);
  const [existingLines, setExistingLines] = useState([]);
  const [newLines, setNewLines] = useState([]);
  const [errors, setErrors] = useState({ shared: {}, lines: {} });
  const [pendingSave, setPendingSave] = useState(null);
  const [saving, setSaving] = useState(false);
  const [supplyOpen, setSupplyOpen] = useState(true);
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [supplierTick, setSupplierTick] = useState(0);
  const [editor, setEditor] = useState(null);
  const [editorErrors, setEditorErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [stores, setStores] = useState([]);
  const brandOptions = useBrandSelectOptions(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    listStores()
      .then((rows) => {
        if (!cancelled) {
          setStores(rows.filter((store) => store.isActive !== false));
        }
      })
      .catch(() => {
        if (!cancelled) setStores([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setMode(forcedMode || "existing");
    setShared(INITIAL_SHARED);
    setExistingLines([]);
    setNewLines([]);
    setErrors({ shared: {}, lines: {} });
    setPendingSave(null);
    setSupplyOpen(true);
    setAddSupplierOpen(false);
    setEditor(null);
    setEditorErrors({});
    setOtpSent(false);
    setOtp("");
    setOtpVerified(false);
    setOtpSending(false);
  }, [isOpen, inventoryType, forcedMode]);

  const storeNameById = useMemo(
    () => new Map(stores.map((store) => [String(store.id), store.name])),
    [stores],
  );

  const resolveStoreLabel = (location) => {
    if (!location) return null;
    return storeNameById.get(String(location)) || location;
  };

  const lines = mode === "new" ? newLines : existingLines;
  const setLines = mode === "new" ? setNewLines : setExistingLines;

  const usedItemIds = useMemo(
    () => new Set(lines.map((line) => line.itemId).filter(Boolean)),
    [lines],
  );
  const totalQuantity = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
  const totalValue = lines.reduce(
    (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitCost) || 0),
    0,
  );
  const editorOpen = Boolean(editor);

  const changeMode = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setErrors({ shared: {}, lines: {} });
    setPendingSave(null);
    setEditor(null);
    setEditorErrors({});
  };

  const openAddEditor = () => {
    setSupplyOpen(false);
    setEditor({ type: "add", line: createLine(inventoryType, mode) });
    setEditorErrors({});
  };

  const openEditEditor = (line) => {
    setSupplyOpen(false);
    setEditor({ type: "edit", line: { ...line } });
    setEditorErrors({});
  };

  const closeEditor = () => {
    setEditor(null);
    setEditorErrors({});
  };

  const setEditorField = (key, value) => {
    setEditor((current) => (
      current ? { ...current, line: applyLineChange(current.line, key, value) } : current
    ));
    setEditorErrors((current) => {
      if (!current[key] && key !== "componentLevels") return current;
      const next = { ...current };
      delete next[key === "componentLevels" ? "level1" : key];
      return next;
    });
  };

  const commitEditor = () => {
    if (!editor) return;
    const nextErrors = getLineErrors(editor.line, mode, inventoryType);
    setEditorErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Complete the item details before adding it to the list.");
      return;
    }
    if (editor.type === "edit") {
      setLines((current) =>
        current.map((row) => (row.clientId === editor.line.clientId ? editor.line : row)),
      );
      closeEditor();
      toast.success("Item updated.");
      return;
    }
    setLines((current) => [...current, editor.line]);
    setEditor({ type: "add", line: createLine(inventoryType, mode) });
    setEditorErrors({});
    toast.success("Item added.");
  };

  const removeLine = (clientId) => {
    setLines((current) => current.filter((row) => row.clientId !== clientId));
    if (editor?.line.clientId === clientId) closeEditor();
  };

  const setSharedField = (key, value) => {
    setShared((current) => ({ ...current, [key]: value }));
    if (["deliveredByName", "deliveredByPhone", "deliveredByEmail"].includes(key)) {
      setOtpSent(false);
      setOtp("");
      setOtpVerified(false);
    }
    setErrors((current) => {
      const nextShared = { ...current.shared };
      delete nextShared[key];
      if (key === "deliveredByPhone" || key === "deliveredByEmail") {
        delete nextShared.deliveredByContact;
      }
      return { ...current, shared: nextShared };
    });
  };

  const deliveryContactReady =
    Boolean(shared.deliveredByName.trim())
    && Boolean(shared.deliveredByPhone.trim())
    && Boolean(shared.deliveredByEmail.trim());

  const handleSendDeliveryOtp = async () => {
    if (!shared.deliveredByName.trim()) {
      toast.warning("Enter the delivery person’s full name first.");
      return;
    }
    if (!shared.deliveredByPhone.trim()) {
      toast.warning("Enter the delivery person’s phone number to send the OTP.");
      return;
    }
    if (!shared.deliveredByEmail.trim()) {
      toast.warning("Enter the delivery person’s email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shared.deliveredByEmail.trim())) {
      toast.warning("Enter a valid delivery email address.");
      return;
    }
    setOtpSending(true);
    try {
      await sendDeliveryOtp(shared.deliveredByPhone.trim());
      setOtp("");
      setOtpVerified(false);
      setOtpSent(true);
      toast.success(
        `OTP sent to ${shared.deliveredByName.trim()} on ${shared.deliveredByPhone.trim()}.`,
      );
    } catch (error) {
      toast.error(error.message || "Unable to send delivery OTP.");
    } finally {
      setOtpSending(false);
    }
  };

  const validate = () => {
    const sharedErrors = {};
    if (!shared.supplierId) sharedErrors.supplierId = "Select a supplier.";
    if (!shared.deliveredByName.trim()) {
      sharedErrors.deliveredByName = "Enter the delivery person’s full name.";
    }
    if (!shared.deliveredByPhone.trim()) {
      sharedErrors.deliveredByPhone = "Enter the delivery person’s phone number.";
    }
    if (!shared.deliveredByEmail.trim()) {
      sharedErrors.deliveredByEmail = "Enter the delivery person’s email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shared.deliveredByEmail.trim())) {
      sharedErrors.deliveredByEmail = "Enter a valid email address.";
    }

    const lineErrors = {};
    lines.forEach((line) => {
      const next = getLineErrors(line, mode, inventoryType);
      if (Object.keys(next).length) lineErrors[line.clientId] = next;
    });

    setErrors({ shared: sharedErrors, lines: lineErrors });
    if (Object.keys(sharedErrors).length) setSupplyOpen(true);
    return Object.keys(sharedErrors).length === 0 && Object.keys(lineErrors).length === 0;
  };

  const prepareSave = () => {
    if (editorOpen) {
      toast.warning("Add or close the item in the side panel first.");
      return;
    }
    if (lines.length === 0) {
      toast.warning("Add at least one item to receive.");
      return;
    }
    if (!validate()) {
      toast.warning("Complete the required supply and item fields.");
      return;
    }
    if (!otpVerified) {
      toast.warning("Confirm the delivery OTP before receiving stock.");
      return;
    }
    setPendingSave({
      mode,
      inventoryType,
      shared,
      lines: lines.map((line) => {
        const catalogItem = line.itemId ? items.find((item) => item.id === line.itemId) : null;
        const unitOfMeasure = normalizeInventoryUnit(line.unitOfMeasure);
        const baseUnit = line.itemId
          ? resolveItemBaseUnit(catalogItem?.unit)
          : normalizeBaseUnit(line.baseUnit || "piece");
        const totalQty = calcInventoryTotalQuantity(line.quantity, line.unitsPerPack, unitOfMeasure);
        const unitNotes = buildInventoryUnitNotes({
          quantity: line.quantity,
          unitOfMeasure,
          unitsPerPack: line.unitsPerPack,
          baseUnit,
        });
        const notes = [line.notes.trim(), shared.notes.trim(), unitNotes].filter(Boolean).join(" | ");
        return {
          ...line,
          name: lineName(line, inventoryType, mode, items),
          quantity: totalQty ?? Number(line.quantity),
          unitCost: Number(line.unitCost),
          unitOfMeasure,
          unitsPerPack: line.unitsPerPack,
          baseUnit,
          unit: baseUnitApiValue(baseUnit),
          condition: line.condition || shared.condition,
          notes,
        };
      }),
    });
  };

  const confirmSave = async () => {
    if (!pendingSave || saving) return;
    setSaving(true);
    try {
      await onSave?.(pendingSave);
      setPendingSave(null);
    } catch (error) {
      toast.error(error.message ?? "Could not receive inventory items.");
    } finally {
      setSaving(false);
    }
  };

  const typeLabel = inventoryType === "vehicle_part" ? "vehicle parts" : "accessories";

  return (
    <>
      <AddModal
        isOpen={isOpen && !pendingSave}
        onClose={onClose}
        onSave={prepareSave}
        fillViewport
        flushViewport
        title={
          mode === "existing"
            ? "Receive registered stock"
            : "Add unregistered items"
        }
        subtitle={
          mode === "existing"
            ? `Search and receive stock for existing ${typeLabel} under one supply.`
            : `Create several new ${typeLabel} under one supply.`
        }
        saveLabel={
          mode === "existing"
            ? `Receive ${lines.length} item${lines.length === 1 ? "" : "s"}`
            : `Receive ${lines.length} item${lines.length === 1 ? "" : "s"}`
        }
        saveDisabled={!otpVerified}
        contentClassName="!p-0 overflow-hidden flex flex-col min-h-0"
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="shrink-0 space-y-4 border-b border-slate-100 px-4 py-4 sm:px-6">
            {!forcedMode ? (
              <RegistrationTabs value={mode} onChange={changeMode} />
            ) : null}
            <CollapsibleSection
              title="Shared Supply Details"
              description="Supplier, delivery, and condition details that apply to every item in this receipt."
              open={supplyOpen}
              onToggle={() => setSupplyOpen((prev) => !prev)}
              errorCount={Object.keys(errors.shared || {}).length}
            >
              <SharedSupplyFields
                value={shared}
                errors={errors.shared}
                onChange={setSharedField}
                onAddSupplier={() => setAddSupplierOpen(true)}
                supplierTick={supplierTick}
              />
            </CollapsibleSection>
            <DeliveryPersonOtpSection
              deliveredByName={shared.deliveredByName}
              deliveredByPhone={shared.deliveredByPhone}
              deliveredByEmail={shared.deliveredByEmail}
              otpSent={otpSent}
              otp={otp}
              otpVerified={otpVerified}
              onSendOtp={handleSendDeliveryOtp}
              onOtpChange={setOtp}
              onVerifiedChange={setOtpVerified}
              sendDisabled={!deliveryContactReady}
              sendLoading={otpSending}
            />
          </div>

          <div className="relative shrink-0">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Item details ({lines.length})
                </p>
                <p className="text-[11px] text-slate-500">
                  Total quantity {totalQuantity} · {formatInventoryMoney(totalValue)}
                </p>
              </div>
            </div>

            {lines.length === 0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-10 text-center">
                <p className="text-[13px] font-semibold text-slate-700">No items added yet</p>
                <p className="mt-1 max-w-sm text-[12px] text-slate-500">
                  Use the add button to open the item sheet and build the receipt list.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto pb-24">
                <table className="w-full min-w-[720px] text-left">
                  <thead className="sticky top-0 bg-slate-50/95">
                    <tr className="border-b border-slate-200">
                      <th className={thClass}>#</th>
                      <th className={cn(thClass, "w-14")}>Photo</th>
                      <th className={thClass}>Item</th>
                      <th className={thClass}>Details</th>
                      <th className={thClass}>Qty</th>
                      <th className={thClass}>Unit price</th>
                      <th className={thClass}>Total</th>
                      <th className={thClass}>Store</th>
                      <th className={cn(thClass, "text-right")}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => {
                      const total = calcLineTotal(line.quantity, line.unitCost);
                      const selected = editor?.line.clientId === line.clientId;
                      return (
                        <tr
                          key={line.clientId}
                          className={cn(
                            "border-b border-slate-100",
                            selected && "bg-slate-50",
                          )}
                        >
                          <td className={tdClass}>{index + 1}</td>
                          <td className={tdClass}>
                            <ItemPhotoThumb
                              src={linePhoto(line, mode, items)}
                              name={lineName(line, inventoryType, mode, items)}
                            />
                          </td>
                          <td className={tdClass}>
                            <ItemNameDisplay
                              value={lineName(line, inventoryType, mode, items)}
                              className="text-slate-800"
                            />
                          </td>
                          <td className={cn(tdClass, "text-slate-500")}>
                            {lineMeta(line, items, mode, brandOptions)}
                          </td>
                          <td className={tdClass}>{line.quantity || "—"}</td>
                          <td className={tdClass}>
                            {line.unitCost === ""
                              ? "—"
                              : formatInventoryMoney(Number(line.unitCost))}
                          </td>
                          <td className={tdClass}>
                            {total == null ? "—" : formatInventoryMoney(total)}
                          </td>
                          <td className={cn(tdClass, "max-w-[180px] truncate")}>
                            <StoreLocationDisplay value={resolveStoreLabel(line.location)} />
                          </td>
                          <td className={tdClass}>
                            <TableRowActions>
                              <TableIconAction
                                title="Edit item"
                                icon={Pencil}
                                variant="edit"
                                iconSize={14}
                                onClick={() => openEditEditor(line)}
                              />
                              <TableIconAction
                                title="Remove item"
                                icon={Trash2}
                                variant="delete"
                                iconSize={14}
                                onClick={() => removeLine(line.clientId)}
                              />
                            </TableRowActions>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pointer-events-none sticky bottom-4 flex justify-end px-4 pb-4 sm:px-6">
              <button
                type="button"
                onClick={openAddEditor}
                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-200/80 hover:bg-black"
                aria-label="Add item"
              >
                <Plus size={22} />
              </button>
            </div>
          </div>
        </div>
      </AddModal>

      <SlideOverSheet
        isOpen={Boolean(isOpen && editorOpen && !pendingSave)}
        onClose={closeEditor}
        maxWidth="max-w-5xl"
        backdropClassName="!z-[10040]"
        panelClassName="!z-[10050]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-slate-900">
              {editor?.type === "edit" ? "Edit item" : "Add item"}
            </h2>
            <p className="mt-1 text-[12px] font-medium text-slate-500">
              Identify the item, confirm details, then enter quantity, price, and store.
            </p>
          </div>
          <button
            type="button"
            onClick={closeEditor}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close item sheet"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {editor ? (
            <LineEditorPanel
              line={editor.line}
              errors={editorErrors}
              mode={mode}
              inventoryType={inventoryType}
              items={items}
              usedItemIds={usedItemIds}
              onChange={setEditorField}
            />
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6">
          <Button variant="outline" size="modal" onClick={closeEditor}>
            Back to list
          </Button>
          <Button size="modal" onClick={commitEditor}>
            {editor?.type === "edit" ? "Update item" : "Add to list"}
          </Button>
        </div>
      </SlideOverSheet>

      <AddSupplierModal
        isOpen={addSupplierOpen}
        onClose={() => setAddSupplierOpen(false)}
        onCreated={(created) => {
          setSupplierTick((tick) => tick + 1);
          setShared((current) => ({
            ...current,
            supplierId: created.id,
            supplierPhone: created.phone || "",
            supplierEmail: created.email || "",
          }));
          setErrors((current) => {
            const nextShared = { ...current.shared };
            delete nextShared.supplierId;
            return { ...current, shared: nextShared };
          });
        }}
      />

      <ConfirmationModal
        isOpen={Boolean(pendingSave)}
        onClose={() => {
          if (saving) return;
          setPendingSave(null);
        }}
        onConfirm={confirmSave}
        closeOnConfirm={false}
        confirmLoading={saving}
        title={
          mode === "existing"
            ? "Receive stock?"
            : "Receive multiple inventory items?"
        }
        message={
          mode === "existing"
            ? `Receive ${pendingSave?.lines.length || 0} ${typeLabel} receipt${(pendingSave?.lines.length || 0) === 1 ? "" : "s"}?`
            : `Receive ${pendingSave?.lines.length || 0} ${typeLabel} with a total quantity of ${pendingSave?.lines.reduce((sum, line) => sum + line.quantity, 0) || 0}?`
        }
        confirmText={saving ? "Receiving…" : "Receive stock"}
      />
    </>
  );
}
