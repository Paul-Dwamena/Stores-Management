import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Replace,
  Search,
} from "lucide-react";
import AddModal from "../../../../components/common/AddModal";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import InputField from "../../../../components/common/fields/InputField";
import ChoiceOption from "../../../../components/common/fields/ChoiceOption";
import { ConfiguredCustomFields, ShowConfiguredField } from "../../../../components/common/ConfiguredFormSections";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import { useFormTreeSections } from "../../../../hooks/useFormTreeSections";
import {
  NEW_ACCESSORIES_FORM_FIELD_CATALOG,
  NEW_ACCESSORIES_FORM_SETUP_CHANGED_EVENT,
  RECEIVE_REGISTERED_ITEMS_FORM_FIELD_CATALOG,
  RECEIVE_REGISTERED_ITEMS_FORM_SETUP_CHANGED_EVENT,
  getActiveNewAccessoriesFormSections,
  getActiveReceiveRegisteredItemsFormSections,
  getNewAccessoriesFormSetup,
  getReceiveRegisteredItemsFormSetup,
} from "../../../../mockdata/setups";
import {
  getAccessories,
  getVehicleParts,
  formatAccessoryMoney,
  getStoreLocationOptions,
} from "../../../../mockdata/stores";
import { getSupplierContact } from "../../../../mockdata/org";
import { generateAccessoryItemCode, ACCESSORY_BRAND_OPTIONS } from "../../../../mockdata/stores/accessories";
import {
  VEHICLE_PART_MAKE_OPTIONS,
  getVehiclePartModelOptions,
  getVehiclePartYearOptions,
} from "../../../../mockdata/stores/vehiclePartsInventory";
import ComponentLevelSelects from "../../vehicleParts/ComponentLevelSelects";
import { VEHICLE_COMPONENT_LEVEL_KEYS } from "../../vehicleParts/vehicleComponentTreeHelpers";
import BulkInventoryReceiptModal from "./BulkInventoryReceiptModal";
import ItemPhotoField, { ItemPhotoThumb } from "./ItemPhotoField";
import AddSupplierModal from "./AddSupplierModal";
import SupplierPicker from "./SupplierPicker";

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 transition-colors text-slate-700";

const readOnlyClassName =
  "w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-[12px] text-slate-600 cursor-not-allowed";

const ITEM_CONDITION_OPTIONS = [
  { value: "GOOD", label: "Good" },
  { value: "BAD", label: "Bad" },
  { value: "BROKEN", label: "Broken" },
  { value: "PARTIALLY_DAMAGED", label: "Partially damaged" },
  { value: "DAMAGED", label: "Damaged" },
];

const SUPPLYING_FIELDS = {
  supplierId: "",
  waybillNumber: "",
  deliveredByName: "",
  supplierPhone: "",
  supplierEmail: "",
  condition: "",
  notes: "",
};

const INITIAL_ACCESSORY = {
  itemCode: "",
  name: "",
  brand: "",
  description: "",
  quantity: "",
  unitPrice: "",
  location: "",
  photo: "",
  ...SUPPLYING_FIELDS,
};

const INITIAL_VEHICLE_PART = {
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
  unitPrice: "",
  location: "",
  ...SUPPLYING_FIELDS,
};

const INITIAL_REGISTERED = {
  itemId: "",
  make: "",
  model: "",
  year: "",
  level1: "",
  level2: "",
  level3: "",
  level4: "",
  level5: "",
  level6: "",
  quantity: "",
  unitPrice: "",
  location: "",
  ...SUPPLYING_FIELDS,
};

function resolveComponentName(form) {
  const levels = VEHICLE_COMPONENT_LEVEL_KEYS.map((key) => form[key]).filter(Boolean);
  return levels[levels.length - 1] || "";
}

function calcTotalPrice(quantity, unitPrice) {
  const qty = Number(quantity);
  const unit = Number(unitPrice);
  if (Number.isNaN(qty) || Number.isNaN(unit) || quantity === "" || unitPrice === "") return "";
  return (qty * unit).toFixed(2);
}

function RegistrationTabs({ value, onChange }) {
  return (
    <div className="tab-track w-full">
      {[
        { id: "registered", label: "Registered items" },
        { id: "unregistered", label: "Unregistered items" },
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

function CollapsibleSection({ title, description, open, onToggle, children }) {
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
            "text-brand shrink-0 transition-transform duration-200",
            !open && "-rotate-90",
          )}
        />
        <span className="min-w-0">
          <span className="block text-[10px] font-bold text-brand uppercase tracking-wider">
            {title}
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

function SelectedItemCard({ item, onChange }) {
  const meta = [
    item.itemCode,
    item.brand,
    item.make
      ? `${item.make} ${item.model || ""} ${item.year || ""}`.trim()
      : null,
    `On hand ${item.quantity ?? 0}`,
    item.unitCost != null ? `Avg cost ${formatAccessoryMoney(item.unitCost)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-brand/15 bg-brand-muted px-3 py-1.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <ItemPhotoThumb src={item.photo} name={item.name} className="h-9 w-9" />
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-slate-900">{item.name}</p>
          {meta ? (
            <p className="truncate text-[10px] leading-tight text-slate-500">{meta}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onChange}
        className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-brand hover:text-brand-hover"
      >
        <Replace size={12} />
        Change
      </button>
    </div>
  );
}

function applySupplierContact(form, supplierId) {
  return { ...form, supplierId, ...getSupplierContact(supplierId) };
}

function SupplyingDetails({ form, errors, onChange, prefix, visibleKeys, onAddSupplier }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ShowConfiguredField visibleKeys={visibleKeys} fieldKey="supplierId">
        <SupplierPicker
          id={`${prefix}Supplier`}
          value={form.supplierId}
          onChange={(next) => onChange("supplierId")({ target: { value: next } })}
          error={errors.supplierId}
          onAddClick={onAddSupplier}
        />
        </ShowConfiguredField>
        <ShowConfiguredField visibleKeys={visibleKeys} fieldKey="waybillNumber">
        <InputField
          label="Waybill number"
          id={`${prefix}Waybill`}
          value={form.waybillNumber}
          onChange={onChange("waybillNumber")}
          placeholder="e.g. WB-2026-0041"
        />
        </ShowConfiguredField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ShowConfiguredField visibleKeys={visibleKeys} fieldKey="deliveredByName">
        <InputField
          label="Delivered by"
          id={`${prefix}DeliveredBy`}
          value={form.deliveredByName}
          onChange={onChange("deliveredByName")}
          error={errors.deliveredByName}
          placeholder="Full name"
        />
        </ShowConfiguredField>
        <ShowConfiguredField visibleKeys={visibleKeys} fieldKey="condition">
        <div className="space-y-1.5">
          <label
            htmlFor={`${prefix}Condition`}
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              errors.condition ? "text-red-500" : "text-slate-500",
            )}
          >
            Item condition
          </label>
          <select
            id={`${prefix}Condition`}
            value={form.condition}
            onChange={onChange("condition")}
            className={cn(fieldClassName, errors.condition && "border-red-500 bg-red-50")}
          >
            <option value="">Select condition…</option>
            {ITEM_CONDITION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.condition && (
            <p className="text-[10px] font-medium text-red-500">{errors.condition}</p>
          )}
        </div>
        </ShowConfiguredField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ShowConfiguredField visibleKeys={visibleKeys} fieldKey="supplierPhone">
        <InputField
          label="Supplier phone"
          id={`${prefix}SupplierPhone`}
          type="tel"
          value={form.supplierPhone}
          readOnly
          placeholder={form.supplierId ? "—" : "Select a supplier"}
          error={errors.supplierContact}
          className={readOnlyClassName}
        />
        </ShowConfiguredField>
        <ShowConfiguredField visibleKeys={visibleKeys} fieldKey="supplierEmail">
        <InputField
          label="Supplier email"
          id={`${prefix}SupplierEmail`}
          type="email"
          value={form.supplierEmail}
          readOnly
          placeholder={form.supplierId ? "—" : "Select a supplier"}
          error={errors.supplierEmail}
          className={readOnlyClassName}
        />
        </ShowConfiguredField>
      </div>
    </div>
  );
}

function StoreLocationField({ id, value, onChange, error }) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className={cn(
          "text-[10px] font-bold uppercase tracking-wider",
          error ? "text-red-500" : "text-slate-500",
        )}
      >
        Store location
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={cn(fieldClassName, error && "border-red-500 bg-red-50")}
      >
        <option value="">Select store location…</option>
        {getStoreLocationOptions().map((location) => (
          <option key={location} value={location}>{location}</option>
        ))}
      </select>
      {error ? <p className="text-[10px] font-medium text-red-500">{error}</p> : null}
    </div>
  );
}

function validateSupplyingDetails(form, errors, visibleKeys) {
  const show = (key) => !visibleKeys || visibleKeys.has(key);
  if (show("supplierId") && !form.supplierId) errors.supplierId = "Select a supplier.";
  if (show("deliveredByName") && !form.deliveredByName.trim()) {
    errors.deliveredByName = "Enter the name of the person who delivered the item.";
  }
  if (show("condition") && !form.condition) errors.condition = "Select the item condition.";
  if (
    (show("supplierPhone") || show("supplierEmail"))
    && !form.supplierPhone.trim()
    && !form.supplierEmail.trim()
  ) {
    errors.supplierContact = "Enter a supplier phone number or email address.";
  }
  if (
    show("supplierEmail")
    && form.supplierEmail.trim()
    && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.supplierEmail.trim())
  ) {
    errors.supplierEmail = "Enter a valid email address.";
  }
}

function validateStockFields(form, errors, visibleKeys) {
  const show = (key) => !visibleKeys || visibleKeys.has(key);
  if (
    show("quantity")
    && (
    form.quantity === ""
    || Number.isNaN(Number(form.quantity))
    || Number(form.quantity) <= 0
    )
  ) {
    errors.quantity = "Enter a valid quantity.";
  }
  if (
    show("unitPrice")
    && (
    form.unitPrice === ""
    || Number.isNaN(Number(form.unitPrice))
    || Number(form.unitPrice) < 0
    )
  ) {
    errors.unitPrice = "Enter a valid unit price.";
  }
  if (show("location") && !form.location?.trim()) errors.location = "Select a store location.";
}

export default function NewInventoryItemModal({ isOpen, onClose, onSave, onBulkSave }) {
  const [step, setStep] = useState("setup");
  const [itemType, setItemType] = useState("accessory");
  const [entryMode, setEntryMode] = useState("");
  const [registrationMode, setRegistrationMode] = useState("registered");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [accessoryForm, setAccessoryForm] = useState(INITIAL_ACCESSORY);
  const [vehicleForm, setVehicleForm] = useState(INITIAL_VEHICLE_PART);
  const [registeredForm, setRegisteredForm] = useState(INITIAL_REGISTERED);
  const [itemSearch, setItemSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [pendingSave, setPendingSave] = useState(null);
  const [catalogTick, setCatalogTick] = useState(0);
  const [itemDetailsOpen, setItemDetailsOpen] = useState(true);
  const [supplyingDetailsOpen, setSupplyingDetailsOpen] = useState(true);
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [componentFilterOpen, setComponentFilterOpen] = useState(true);
  const { sections: registeredSections, visibleKeys: registeredVisibleKeys } = useFormTreeSections(
    RECEIVE_REGISTERED_ITEMS_FORM_SETUP_CHANGED_EVENT,
    getReceiveRegisteredItemsFormSetup,
    getActiveReceiveRegisteredItemsFormSections,
  );
  const { sections: unregisteredSections, visibleKeys: unregisteredVisibleKeys } = useFormTreeSections(
    NEW_ACCESSORIES_FORM_SETUP_CHANGED_EVENT,
    getNewAccessoriesFormSetup,
    getActiveNewAccessoriesFormSections,
  );
  const registeredSystemKeys = new Set(RECEIVE_REGISTERED_ITEMS_FORM_FIELD_CATALOG.map((field) => field.key));
  const unregisteredSystemKeys = new Set(NEW_ACCESSORIES_FORM_FIELD_CATALOG.map((field) => field.key));

  useEffect(() => {
    if (!isOpen) return;
    setStep("setup");
    setItemType("accessory");
    setEntryMode("");
    setRegistrationMode("registered");
    setBulkOpen(false);
    setAccessoryForm(INITIAL_ACCESSORY);
    setVehicleForm(INITIAL_VEHICLE_PART);
    setRegisteredForm(INITIAL_REGISTERED);
    setItemSearch("");
    setErrors({});
    setPendingSave(null);
    setItemDetailsOpen(true);
    setSupplyingDetailsOpen(true);
    setAddSupplierOpen(false);
    setComponentFilterOpen(true);
    setCatalogTick((tick) => tick + 1);
  }, [isOpen]);

  const catalogItems = useMemo(() => {
    void catalogTick;
    return itemType === "vehicle_part" ? getVehicleParts() : getAccessories();
  }, [itemType, catalogTick]);

  const registeredMakeOptions = useMemo(() => {
    if (itemType !== "vehicle_part") return [];
    return [...new Set(catalogItems.map((item) => item.make).filter(Boolean))].sort();
  }, [catalogItems, itemType]);

  const registeredModelOptions = useMemo(() => {
    if (!registeredForm.make) return [];
    return [
      ...new Set(
        catalogItems
          .filter((item) => item.make === registeredForm.make)
          .map((item) => item.model)
          .filter(Boolean),
      ),
    ].sort();
  }, [catalogItems, registeredForm.make]);

  const registeredYearOptions = useMemo(() => {
    if (!registeredForm.make || !registeredForm.model) return [];
    return [
      ...new Set(
        catalogItems
          .filter(
            (item) =>
              item.make === registeredForm.make
              && item.model === registeredForm.model,
          )
          .map((item) => String(item.year))
          .filter(Boolean),
      ),
    ].sort((a, b) => Number(b) - Number(a));
  }, [catalogItems, registeredForm.make, registeredForm.model]);

  const hasVehiclePartFilters =
    itemType !== "vehicle_part"
    || Boolean(registeredForm.make && registeredForm.model && registeredForm.year);

  const filteredCatalog = useMemo(() => {
    let list = catalogItems;
    if (itemType === "vehicle_part") {
      if (!hasVehiclePartFilters) return [];
      list = catalogItems.filter((item) => {
        if (item.make !== registeredForm.make) return false;
        if (item.model !== registeredForm.model) return false;
        if (String(item.year) !== String(registeredForm.year)) return false;
        for (let i = 0; i < 6; i += 1) {
          const key = `level${i + 1}`;
          const selected = registeredForm[key];
          if (selected && item[key] !== selected) return false;
        }
        return true;
      });
    }
    const q = itemSearch.trim().toLowerCase();
    if (!q) return list.slice(0, 20);
    return list
      .filter((item) =>
        [item.itemCode, item.name, item.brand, item.description, item.make, item.model]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 20);
  }, [
    catalogItems,
    itemSearch,
    itemType,
    hasVehiclePartFilters,
    registeredForm.make,
    registeredForm.model,
    registeredForm.year,
    registeredForm.level1,
    registeredForm.level2,
    registeredForm.level3,
    registeredForm.level4,
    registeredForm.level5,
    registeredForm.level6,
  ]);

  const selectedRegisteredItem = useMemo(
    () => catalogItems.find((item) => item.id === registeredForm.itemId) ?? null,
    [catalogItems, registeredForm.itemId],
  );

  const accessoryTotal = useMemo(
    () => calcTotalPrice(accessoryForm.quantity, accessoryForm.unitPrice),
    [accessoryForm.quantity, accessoryForm.unitPrice],
  );

  const vehicleTotal = useMemo(
    () => calcTotalPrice(vehicleForm.quantity, vehicleForm.unitPrice),
    [vehicleForm.quantity, vehicleForm.unitPrice],
  );

  const registeredTotal = useMemo(
    () => calcTotalPrice(registeredForm.quantity, registeredForm.unitPrice),
    [registeredForm.quantity, registeredForm.unitPrice],
  );

  const componentName = useMemo(() => resolveComponentName(vehicleForm), [vehicleForm]);

  const vehicleModelOptions = useMemo(
    () => getVehiclePartModelOptions(vehicleForm.make),
    [vehicleForm.make],
  );

  const vehicleYearOptions = useMemo(() => getVehiclePartYearOptions(), []);

  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleAccessoryChange = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setAccessoryForm((prev) =>
      field === "supplierId" ? applySupplierContact(prev, value) : { ...prev, [field]: value },
    );
    clearError(field);
    if (field === "supplierId") {
      clearError("supplierPhone");
      clearError("supplierEmail");
      clearError("supplierContact");
    }
    if (field === "supplierPhone" || field === "supplierEmail") clearError("supplierContact");
  };

  const handleVehicleChange = (field) => (event) => {
    const value = event.target.value;
    setVehicleForm((prev) => {
      if (field === "make") {
        return { ...prev, make: value, model: "", year: "" };
      }
      if (field === "model") {
        return { ...prev, model: value, year: "" };
      }
      if (field === "supplierId") {
        return applySupplierContact(prev, value);
      }
      return { ...prev, [field]: value };
    });
    clearError(field);
    if (field === "supplierId") {
      clearError("supplierPhone");
      clearError("supplierEmail");
      clearError("supplierContact");
    }
    if (field === "supplierPhone" || field === "supplierEmail") clearError("supplierContact");
    if (field === "make") {
      clearError("model");
      clearError("year");
    } else if (field === "model") {
      clearError("year");
    }
  };

  const handleRegisteredChange = (field) => (event) => {
    const value = event.target.value;
    setRegisteredForm((prev) =>
      field === "supplierId" ? applySupplierContact(prev, value) : { ...prev, [field]: value },
    );
    clearError(field);
    if (field === "supplierId") {
      clearError("supplierPhone");
      clearError("supplierEmail");
      clearError("supplierContact");
    }
    if (field === "supplierPhone" || field === "supplierEmail") clearError("supplierContact");
  };

  const handleRegisteredVehicleFilterChange = (field) => (event) => {
    const value = event.target.value;
    setRegisteredForm((prev) => {
      if (field === "make") {
        return {
          ...prev,
          make: value,
          model: "",
          year: "",
          itemId: "",
          level1: "",
          level2: "",
          level3: "",
          level4: "",
          level5: "",
          level6: "",
        };
      }
      if (field === "model") {
        return {
          ...prev,
          model: value,
          year: "",
          itemId: "",
          level1: "",
          level2: "",
          level3: "",
          level4: "",
          level5: "",
          level6: "",
        };
      }
      if (field === "year") {
        return {
          ...prev,
          year: value,
          itemId: "",
        };
      }
      return { ...prev, [field]: value };
    });
    setItemSearch("");
    clearError("itemId");
    clearError(field);
  };

  const selectRegisteredItem = (item) => {
    setRegisteredForm((prev) => ({
      ...prev,
      itemId: item.id,
      unitPrice:
        prev.unitPrice
        || (item.unitCost != null ? String(item.unitCost) : ""),
    }));
    setItemSearch("");
    clearError("itemId");
  };

  const switchRegistrationMode = (nextMode) => {
    if (nextMode === registrationMode) return;
    setRegistrationMode(nextMode);
    setErrors({});
  };

  const continueFromSetup = () => {
    const nextErrors = {};
    if (!entryMode) nextErrors.entryMode = "Select single or multiple items to continue.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Select whether you are receiving a single item or multiple items.");
      return;
    }
    if (entryMode === "multiple") {
      setBulkOpen(true);
      return;
    }
    setRegistrationMode("registered");
    setRegisteredForm(INITIAL_REGISTERED);
    setItemSearch("");
    setComponentFilterOpen(true);
    setItemType("accessory");
    setAccessoryForm((prev) => ({
      ...prev,
      itemCode: generateAccessoryItemCode(),
    }));
    setStep("form");
  };

  const submitRegistered = () => {
    const nextErrors = {};
    if (!registeredForm.itemId || !selectedRegisteredItem) {
      nextErrors.itemId = "Search and select a registered item.";
    }
    validateStockFields(registeredForm, nextErrors, registeredVisibleKeys);
    validateSupplyingDetails(registeredForm, nextErrors, registeredVisibleKeys);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.warning("Fix the highlighted fields before saving.");
      return;
    }

    setPendingSave({
      type: itemType === "vehicle_part" ? "vehicle_part" : "accessory",
      mode: "existing",
      label: selectedRegisteredItem.name,
      payload: {
        itemId: registeredForm.itemId,
        quantity: registeredForm.quantity,
        unitCost: registeredForm.unitPrice,
        location: registeredForm.location,
        supplierId: registeredForm.supplierId,
        waybillNumber: registeredForm.waybillNumber,
        deliveredByName: registeredForm.deliveredByName,
        supplierPhone: registeredForm.supplierPhone,
        supplierEmail: registeredForm.supplierEmail,
        condition: registeredForm.condition,
        notes: registeredForm.notes,
      },
    });
  };

  const submitAccessory = () => {
    const nextErrors = {};
    if (!accessoryForm.name.trim()) nextErrors.name = "Enter an item name.";
    if (!accessoryForm.brand.trim()) nextErrors.brand = "Select a brand.";
    validateStockFields(accessoryForm, nextErrors, unregisteredVisibleKeys);
    validateSupplyingDetails(accessoryForm, nextErrors, unregisteredVisibleKeys);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.warning("Fix the highlighted fields before saving.");
      return;
    }

    setPendingSave({
      type: "accessory",
      mode: "new",
      label: accessoryForm.name.trim(),
      payload: {
        itemCode: accessoryForm.itemCode,
        name: accessoryForm.name,
        brand: accessoryForm.brand,
        description: accessoryForm.description,
        quantity: accessoryForm.quantity,
        unitCost: accessoryForm.unitPrice,
        totalPurchaseCost: accessoryTotal,
        supplierId: accessoryForm.supplierId,
        location: accessoryForm.location,
        photo: accessoryForm.photo,
        waybillNumber: accessoryForm.waybillNumber,
        deliveredByName: accessoryForm.deliveredByName,
        supplierPhone: accessoryForm.supplierPhone,
        supplierEmail: accessoryForm.supplierEmail,
        condition: accessoryForm.condition,
        notes: accessoryForm.notes,
      },
    });
  };

  const submitVehiclePart = () => {
    const nextErrors = {};
    if (!vehicleForm.make.trim()) nextErrors.make = "Select a make.";
    if (!vehicleForm.model.trim()) nextErrors.model = "Select a model.";
    if (!vehicleForm.year.trim()) nextErrors.year = "Select a year.";
    if (!vehicleForm.level1) nextErrors.level1 = "Select at least Level 1 component.";
    validateStockFields(vehicleForm, nextErrors, unregisteredVisibleKeys);
    validateSupplyingDetails(vehicleForm, nextErrors, unregisteredVisibleKeys);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.warning("Fix the highlighted fields before saving.");
      return;
    }

    setPendingSave({
      type: "vehicle_part",
      mode: "new",
      label: componentName || `${vehicleForm.make} ${vehicleForm.model}`.trim(),
      payload: {
        make: vehicleForm.make,
        model: vehicleForm.model,
        year: vehicleForm.year,
        chassisNumber: vehicleForm.chassisNumber,
        level1: vehicleForm.level1,
        level2: vehicleForm.level2,
        level3: vehicleForm.level3,
        level4: vehicleForm.level4,
        level5: vehicleForm.level5,
        level6: vehicleForm.level6,
        name: componentName,
        quantity: vehicleForm.quantity,
        unitCost: vehicleForm.unitPrice,
        totalPurchaseCost: vehicleTotal,
        supplierId: vehicleForm.supplierId,
        location: vehicleForm.location,
        waybillNumber: vehicleForm.waybillNumber,
        deliveredByName: vehicleForm.deliveredByName,
        supplierPhone: vehicleForm.supplierPhone,
        supplierEmail: vehicleForm.supplierEmail,
        condition: vehicleForm.condition,
        notes: vehicleForm.notes,
      },
    });
  };

  const handleConfirmSave = () => {
    if (!pendingSave) return;
    onSave({
      type: pendingSave.type,
      mode: pendingSave.mode,
      payload: pendingSave.payload,
    });
    setPendingSave(null);
  };

  const handleFormSave = () => {
    if (registrationMode === "registered") {
      submitRegistered();
      return;
    }
    submitAccessory();
  };

  const isSetupStep = step === "setup";
  const isFormStep = step === "form";
  const isRegistered = registrationMode === "registered";

  return (
    <>
      <AddModal
        isOpen={isOpen && !bulkOpen && !addSupplierOpen}
        onClose={onClose}
        onSave={isSetupStep ? continueFromSetup : handleFormSave}
        title={
          isSetupStep
            ? "New Inventory Item"
            : isRegistered
              ? "Receive registered item"
              : "Receive unregistered item"
        }
        subtitle={
          isSetupStep
            ? "Select whether you are receiving a single item or multiple items."
            : isRegistered
              ? "Search an existing store item, then capture quantity and supply details."
              : "Capture details for an item that is not yet in the store."
        }
        saveLabel={
          isSetupStep
            ? "Continue"
            : isRegistered
              ? "Submit for approval"
              : "Save item"
        }
        dialogClassName={isSetupStep ? "max-w-lg" : "max-w-3xl"}
        contentClassName="space-y-4"
        secondaryAction={
          isFormStep
            ? {
                label: "Back",
                onClick: () => {
                  setStep("setup");
                  setErrors({});
                },
              }
            : undefined
        }
      >
        {isSetupStep && (
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <p
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  errors.entryMode ? "text-red-500" : "text-slate-500",
                )}
              >
                Number of items
              </p>
              <div role="radiogroup" aria-label="Number of items" className="flex flex-nowrap gap-2">
                <ChoiceOption
                  type="radio"
                  id="inventoryItemCountSingle"
                  name="inventoryItemCount"
                  value="single"
                  label="Single"
                  className="min-w-0 flex-1"
                  checked={entryMode === "single"}
                  onChange={() => {
                    setEntryMode("single");
                    clearError("entryMode");
                  }}
                />
                <ChoiceOption
                  type="radio"
                  id="inventoryItemCountMultiple"
                  name="inventoryItemCount"
                  value="multiple"
                  label="Multiple"
                  className="min-w-0 flex-1"
                  checked={entryMode === "multiple"}
                  onChange={() => {
                    setEntryMode("multiple");
                    clearError("entryMode");
                  }}
                />
              </div>
              {errors.entryMode ? (
                <p className="text-[10px] font-medium text-red-500">{errors.entryMode}</p>
              ) : null}
            </div>
          </div>
        )}

        {isFormStep && (
          <div className="space-y-4">
            <RegistrationTabs value={registrationMode} onChange={switchRegistrationMode} />

            <CollapsibleSection
              title="Item Details"
              open={itemDetailsOpen}
              onToggle={() => setItemDetailsOpen((prev) => !prev)}
            >
            {isRegistered ? (
              <>
                <div className="space-y-3">
                  {!selectedRegisteredItem ? (
                    <>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="regItemSearch"
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            errors.itemId ? "text-red-500" : "text-slate-500",
                          )}
                        >
                          Search registered item
                        </label>
                        <div className="relative">
                          <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            id="regItemSearch"
                            value={itemSearch}
                            onChange={(event) => setItemSearch(event.target.value)}
                            className={cn(
                              fieldClassName,
                              "pl-9",
                              errors.itemId && "border-red-500 bg-red-50",
                            )}
                            placeholder="Search by code, name, brand…"
                          />
                        </div>
                        {errors.itemId ? (
                          <p className="text-[10px] font-medium text-red-500">{errors.itemId}</p>
                        ) : null}
                      </div>
                      <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                        {filteredCatalog.length === 0 ? (
                          <p className="px-3 py-3 text-[11px] text-slate-400">
                            No registered items found.
                          </p>
                        ) : (
                          filteredCatalog.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => selectRegisteredItem(item)}
                              className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-slate-50"
                            >
                              <div className="flex min-w-0 items-center gap-2.5">
                                <ItemPhotoThumb src={item.photo} name={item.name} className="h-9 w-9" />
                                <div className="min-w-0">
                                  <p className="text-[12px] font-semibold text-slate-800">{item.name}</p>
                                  <p className="text-[10px] text-slate-500">
                                    {item.itemCode}
                                    {item.brand ? ` · ${item.brand}` : ""}
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
                    </>
                  ) : (
                    <SelectedItemCard
                      item={selectedRegisteredItem}
                      onChange={() => {
                        setRegisteredForm((prev) => ({ ...prev, itemId: "" }));
                        clearError("itemId");
                      }}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ShowConfiguredField visibleKeys={registeredVisibleKeys} fieldKey="quantity">
                  <InputField
                    label="Quantity"
                    id="regQty"
                    type="number"
                    value={registeredForm.quantity}
                    onChange={handleRegisteredChange("quantity")}
                    error={errors.quantity}
                  />
                  </ShowConfiguredField>
                  <ShowConfiguredField visibleKeys={registeredVisibleKeys} fieldKey="unitPrice">
                  <InputField
                    label="Unit price (GH₵)"
                    id="regUnitPrice"
                    type="number"
                    value={registeredForm.unitPrice}
                    onChange={handleRegisteredChange("unitPrice")}
                    error={errors.unitPrice}
                  />
                  </ShowConfiguredField>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Total price (GH₵)
                    </p>
                    <div className={readOnlyClassName}>{registeredTotal || "—"}</div>
                    <p className="text-[10px] text-slate-400">
                      Auto-calculated from quantity × unit price
                    </p>
                  </div>
                  <ShowConfiguredField visibleKeys={registeredVisibleKeys} fieldKey="location">
                  <StoreLocationField
                    id="regLocation"
                    value={registeredForm.location}
                    onChange={handleRegisteredChange("location")}
                    error={errors.location}
                  />
                  </ShowConfiguredField>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="newAccItemCode"
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      Item code
                    </label>
                    <div id="newAccItemCode" className={readOnlyClassName}>
                      {accessoryForm.itemCode || "—"}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="newAccBrand"
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        errors.brand ? "text-red-500" : "text-slate-500",
                      )}
                    >
                      Brand
                    </label>
                    <select
                      id="newAccBrand"
                      value={accessoryForm.brand}
                      onChange={handleAccessoryChange("brand")}
                      className={cn(
                        fieldClassName,
                        errors.brand && "border-red-500 bg-red-50",
                      )}
                    >
                      <option value="">Select brand…</option>
                      {ACCESSORY_BRAND_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.brand ? (
                      <p className="text-[10px] font-medium text-red-500">{errors.brand}</p>
                    ) : null}
                  </div>
                </div>
                <InputField
                  label="Name"
                  id="newAccName"
                  value={accessoryForm.name}
                  onChange={handleAccessoryChange("name")}
                  error={errors.name}
                  placeholder="Accessory name"
                />
                <div className="space-y-1.5">
                  <label
                    htmlFor="newAccDescription"
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    Description
                  </label>
                  <textarea
                    id="newAccDescription"
                    rows={3}
                    value={accessoryForm.description}
                    onChange={handleAccessoryChange("description")}
                    className={cn(fieldClassName, "resize-none")}
                    placeholder="Short description…"
                  />
                </div>
                <ItemPhotoField
                  id="newAccPhoto"
                  value={accessoryForm.photo}
                  onChange={(photo) => handleAccessoryChange("photo")(photo)}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ShowConfiguredField visibleKeys={unregisteredVisibleKeys} fieldKey="quantity">
                  <InputField
                    label="Quantity"
                    id="newAccQty"
                    type="number"
                    value={accessoryForm.quantity}
                    onChange={handleAccessoryChange("quantity")}
                    error={errors.quantity}
                  />
                  </ShowConfiguredField>
                  <ShowConfiguredField visibleKeys={unregisteredVisibleKeys} fieldKey="unitPrice">
                  <InputField
                    label="Unit price (GH₵)"
                    id="newAccUnitPrice"
                    type="number"
                    value={accessoryForm.unitPrice}
                    onChange={handleAccessoryChange("unitPrice")}
                    error={errors.unitPrice}
                  />
                  </ShowConfiguredField>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Total price (GH₵)
                    </p>
                    <div className={readOnlyClassName}>{accessoryTotal || "—"}</div>
                    <p className="text-[10px] text-slate-400">
                      Auto-calculated from quantity × unit price
                    </p>
                  </div>
                  <ShowConfiguredField visibleKeys={unregisteredVisibleKeys} fieldKey="location">
                  <StoreLocationField
                    id="newAccLocation"
                    value={accessoryForm.location}
                    onChange={handleAccessoryChange("location")}
                    error={errors.location}
                  />
                  </ShowConfiguredField>
                </div>
              </>
            )}
            </CollapsibleSection>

            <CollapsibleSection
              title="Supplying Details"
              open={supplyingDetailsOpen}
              onToggle={() => setSupplyingDetailsOpen((prev) => !prev)}
            >
              <SupplyingDetails
                form={isRegistered ? registeredForm : accessoryForm}
                errors={errors}
                onChange={isRegistered ? handleRegisteredChange : handleAccessoryChange}
                prefix={isRegistered ? "reg" : "newAcc"}
                visibleKeys={isRegistered ? registeredVisibleKeys : unregisteredVisibleKeys}
                onAddSupplier={() => setAddSupplierOpen(true)}
              />
            </CollapsibleSection>
            <ConfiguredCustomFields
              sections={isRegistered ? registeredSections : unregisteredSections}
              systemKeys={isRegistered ? registeredSystemKeys : unregisteredSystemKeys}
              form={isRegistered ? registeredForm : accessoryForm}
              formErrors={errors}
              handleChange={isRegistered ? handleRegisteredChange : handleAccessoryChange}
              idPrefix={isRegistered ? "rri" : "nac"}
            />
          </div>
        )}
      </AddModal>

      <ConfirmationModal
        isOpen={Boolean(pendingSave)}
        onClose={() => setPendingSave(null)}
        onConfirm={handleConfirmSave}
        title={pendingSave?.mode === "existing" ? "Submit stock receipt?" : "Save item?"}
        message={
          pendingSave?.mode === "existing"
            ? `Submit stock receipt for ${pendingSave?.label || "this item"} for approval? It will be added to receivables only after approval.`
            : `Add ${pendingSave?.label || "this item"} to inventory?`
        }
        confirmText={pendingSave?.mode === "existing" ? "Submit for approval" : "Save item"}
      />

      <AddSupplierModal
        isOpen={addSupplierOpen}
        onClose={() => setAddSupplierOpen(false)}
        onCreated={(created) => {
          const patch = {
            supplierId: created.id,
            supplierPhone: created.phone || "",
            supplierEmail: created.email || "",
          };
          if (isRegistered) {
            setRegisteredForm((prev) => ({ ...prev, ...patch }));
          } else {
            setAccessoryForm((prev) => ({ ...prev, ...patch }));
          }
          setErrors((prev) => {
            const next = { ...prev };
            delete next.supplierId;
            delete next.supplierPhone;
            delete next.supplierEmail;
            delete next.supplierContact;
            return next;
          });
        }}
      />

      <BulkInventoryReceiptModal
        isOpen={isOpen && bulkOpen}
        onClose={() => setBulkOpen(false)}
        inventoryType="accessory"
        items={catalogItems}
        onSave={(payload) => {
          onBulkSave?.(payload);
          setBulkOpen(false);
        }}
      />
    </>
  );
}
