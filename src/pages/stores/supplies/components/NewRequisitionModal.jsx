import React, { useEffect, useMemo, useState } from "react";
import { Replace, Search } from "lucide-react";
import AddModal from "../../../../components/common/AddModal";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import InputField from "../../../../components/common/fields/InputField";
import ChoiceOption from "../../../../components/common/fields/ChoiceOption";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import {
  UNREGISTERED_ITEM_DESCRIPTION_HELPER,
  UNREGISTERED_ITEM_DESCRIPTION_PLACEHOLDER,
} from "../../../requests/requests/utils/requestHelpers";
import {
  getAccessories,
  getVehicleParts,
} from "../../../../mockdata/stores";
import ComponentLevelSelects from "../../vehicleParts/ComponentLevelSelects";
import {
  MultiAccessoryRequisitionTable,
  MultiVehiclePartRequisitionTable,
} from "./MultiRequisitionTables";
import { ItemPhotoThumb } from "../../inventory/components/ItemPhotoField";

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 transition-colors text-slate-700";

function DetailBlock({ children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
      {children}
    </div>
  );
}

function DetailLine({ label, value }) {
  return (
    <div className="flex flex-wrap gap-x-2 text-[12px]">
      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] min-w-[88px]">
        {label}
      </span>
      <span className="font-medium text-slate-800">{value || "—"}</span>
    </div>
  );
}

function SelectedAccessoryCard({ item, onChange }) {
  const meta = [item.itemCode, item.brand].filter(Boolean).join(" · ");

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
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
        className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover"
      >
        <Replace size={12} />
        Change
      </button>
    </div>
  );
}

function buildVehiclePartFromSelection(part, quantity, levels = {}, justification = "") {
  const mergedLevels = {
    level1: part.level1 || levels.level1 || "",
    level2: part.level2 || levels.level2 || "",
    level3: part.level3 || levels.level3 || "",
    level4: part.level4 || levels.level4 || "",
    level5: part.level5 || levels.level5 || "",
    level6: part.level6 || levels.level6 || "",
  };
  const pathParts = [
    mergedLevels.level1,
    mergedLevels.level2,
    mergedLevels.level3,
    mergedLevels.level4,
    mergedLevels.level5,
    mergedLevels.level6,
  ].filter(Boolean);
  const componentPath = pathParts.join(" > ");
  // Prefer a full component path; if only a top-level group exists, use the inventory description.
  const description =
    pathParts.length >= 2
      ? componentPath
      : (part.description || componentPath || part.name || "—");

  return {
    kind: "vehicle_parts",
    itemId: part.id,
    itemCode: part.itemCode || "—",
    itemName: part.name || "—",
    brand: part.brand || "—",
    description,
    componentPath: componentPath || part.componentPath || description,
    make: part.make || null,
    model: part.model || null,
    year: part.year ?? null,
    chassisNumber: part.chassisNumber || null,
    ...mergedLevels,
    quantity: Number(quantity),
    justification: String(justification ?? "").trim(),
    isOther: false,
  };
}

export default function NewRequisitionModal({ isOpen, onClose, onSave }) {
  const [step, setStep] = useState("type");
  const [quantityMode, setQuantityMode] = useState("");
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  const [accessoryMode, setAccessoryMode] = useState("catalog");
  const [accessorySearch, setAccessorySearch] = useState("");
  const [selectedAccessoryId, setSelectedAccessoryId] = useState("");
  const [accessoryQty, setAccessoryQty] = useState("");
  const [otherName, setOtherName] = useState("");
  const [otherQty, setOtherQty] = useState("");
  const [otherDescription, setOtherDescription] = useState("");

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [componentLevels, setComponentLevels] = useState({
    level1: "",
    level2: "",
    level3: "",
    level4: "",
    level5: "",
    level6: "",
  });
  const [selectedPartId, setSelectedPartId] = useState("");
  const [partQty, setPartQty] = useState("");
  const [partJustification, setPartJustification] = useState("");
  const [partSearch, setPartSearch] = useState("");

  const [multiAccessoryLines, setMultiAccessoryLines] = useState([]);
  const [multiPartLines, setMultiPartLines] = useState([]);
  const [lineErrors, setLineErrors] = useState({});

  const accessories = useMemo(() => getAccessories(), []);
  const vehicleParts = useMemo(() => getVehicleParts(), []);

  const resetFormFields = () => {
    setAccessoryMode("catalog");
    setAccessorySearch("");
    setSelectedAccessoryId("");
    setAccessoryQty("");
    setOtherName("");
    setOtherQty("");
    setOtherDescription("");
    setMake("");
    setModel("");
    setYear("");
    setComponentLevels({
      level1: "",
      level2: "",
      level3: "",
      level4: "",
      level5: "",
      level6: "",
    });
    setSelectedPartId("");
    setPartQty("");
    setPartJustification("");
    setPartSearch("");
    setMultiAccessoryLines([]);
    setMultiPartLines([]);
    setLineErrors({});
  };

  useEffect(() => {
    if (!isOpen) return;
    setStep("type");
    setQuantityMode("");
    setErrors({});
    setConfirmOpen(false);
    setPendingPayload(null);
    resetFormFields();
  }, [isOpen]);

  const filteredAccessories = useMemo(() => {
    const q = accessorySearch.trim().toLowerCase();
    if (!q) return accessories.slice(0, 20);
    return accessories
      .filter((item) =>
        [item.itemCode, item.name, item.brand, item.description]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 20);
  }, [accessories, accessorySearch]);

  const selectedAccessory = useMemo(
    () => accessories.find((item) => item.id === selectedAccessoryId) ?? null,
    [accessories, selectedAccessoryId],
  );

  const makeOptions = useMemo(
    () => [...new Set(vehicleParts.map((part) => part.make).filter(Boolean))].sort(),
    [vehicleParts],
  );

  const modelOptions = useMemo(() => {
    const list = vehicleParts.filter((part) => !make || part.make === make);
    return [...new Set(list.map((part) => part.model).filter(Boolean))].sort();
  }, [vehicleParts, make]);

  const yearOptions = useMemo(() => {
    const list = vehicleParts.filter(
      (part) => (!make || part.make === make) && (!model || part.model === model),
    );
    return [...new Set(list.map((part) => String(part.year)).filter(Boolean))].sort(
      (a, b) => Number(b) - Number(a),
    );
  }, [vehicleParts, make, model]);

  const filteredVehicleParts = useMemo(() => {
    if (!make || !model || !year) return [];
    const q = partSearch.trim().toLowerCase();
    return vehicleParts.filter((part) => {
      if (part.make !== make || part.model !== model || String(part.year) !== String(year)) {
        return false;
      }
      const levels = [
        part.level1,
        part.level2,
        part.level3,
        part.level4,
        part.level5,
        part.level6,
      ];
      for (let i = 0; i < 6; i += 1) {
        const selected = componentLevels[`level${i + 1}`];
        if (selected && levels[i] !== selected) return false;
      }
      if (!q) return true;
      return [part.itemCode, part.name, part.brand, part.chassisNumber, part.make, part.model]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [vehicleParts, make, model, year, componentLevels, partSearch]);

  const selectedPart = useMemo(
    () => vehicleParts.find((part) => part.id === selectedPartId) ?? null,
    [vehicleParts, selectedPartId],
  );

  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const continueFromSetup = () => {
    const nextErrors = {};
    if (!quantityMode) {
      nextErrors.quantityMode = "Choose single or multiple accessories.";
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    resetFormFields();
    if (quantityMode === "single") {
      setStep("accessories");
      return;
    }
    setStep("accessories_multi");
  };

  const buildSingleAccessoryPayload = () => {
    const nextErrors = {};
    if (accessoryMode === "catalog") {
      if (!selectedAccessoryId) nextErrors.selectedAccessoryId = "Select an accessory.";
      if (
        accessoryQty === ""
        || Number.isNaN(Number(accessoryQty))
        || Number(accessoryQty) <= 0
      ) {
        nextErrors.accessoryQty = "Enter a valid quantity.";
      }
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) {
        toast.warning("Fix the highlighted fields before submitting.");
        return null;
      }
      return {
        kind: "accessories",
        itemId: selectedAccessory.id,
        itemCode: selectedAccessory.itemCode || "—",
        itemName: selectedAccessory.name || "—",
        brand: selectedAccessory.brand || "—",
        description: selectedAccessory.description || "—",
        quantity: Number(accessoryQty),
        photo: selectedAccessory.photo || "",
        isOther: false,
      };
    }

    if (!otherName.trim()) nextErrors.otherName = "Enter an item name.";
    if (otherQty === "" || Number.isNaN(Number(otherQty)) || Number(otherQty) <= 0) {
      nextErrors.otherQty = "Enter a valid quantity.";
    }
    if (!otherDescription.trim()) nextErrors.otherDescription = "Enter a description.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Fix the highlighted fields before submitting.");
      return null;
    }
    return {
      kind: "accessories",
      itemId: null,
      itemCode: "—",
      itemName: otherName.trim() || "—",
      brand: "—",
      description: otherDescription.trim() || "—",
      quantity: Number(otherQty),
      isOther: true,
    };
  };

  const buildSingleVehiclePartPayload = () => {
    const nextErrors = {};
    if (!make) nextErrors.make = "Select a make.";
    if (!model) nextErrors.model = "Select a model.";
    if (!year) nextErrors.year = "Select a year.";
    if (!selectedPartId) nextErrors.selectedPartId = "Select a vehicle part.";
    if (partQty === "" || Number.isNaN(Number(partQty)) || Number(partQty) <= 0) {
      nextErrors.partQty = "Enter a valid quantity.";
    }
    if (!partJustification.trim()) {
      nextErrors.partJustification = "Enter a justification.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Fix the highlighted fields before submitting.");
      return null;
    }
    return buildVehiclePartFromSelection(
      selectedPart,
      partQty,
      componentLevels,
      partJustification,
    );
  };

  const buildMultiAccessoryPayloads = () => {
    if (multiAccessoryLines.length < 2) {
      toast.warning("Add at least two items for a multiple requisition.");
      return null;
    }

    const nextLineErrors = {};
    const payloads = [];
    multiAccessoryLines.forEach((line) => {
      const rowErrors = {};
      if (
        line.quantity === ""
        || Number.isNaN(Number(line.quantity))
        || Number(line.quantity) <= 0
      ) {
        rowErrors.quantity = "Enter a valid quantity.";
      }
      const isOther = line.source === "other";
      const catalogItem = !isOther
        ? accessories.find((item) => item.id === line.accessoryId)
        : null;

      if (!isOther && !catalogItem && !line.name?.trim()) {
        rowErrors.name = "Missing item name.";
      }
      if (isOther && !line.name?.trim()) {
        rowErrors.name = "Missing item name.";
      }
      if (Object.keys(rowErrors).length) {
        nextLineErrors[line.id] = rowErrors;
        return;
      }

      if (isOther) {
        payloads.push({
          kind: "accessories",
          itemId: null,
          itemCode: "—",
          itemName: line.name.trim() || "—",
          brand: "—",
          description: (line.description || "").trim() || "—",
          quantity: Number(line.quantity),
          isOther: true,
        });
        return;
      }

      payloads.push({
        kind: "accessories",
        itemId: catalogItem?.id || line.accessoryId || null,
        itemCode: catalogItem?.itemCode || line.itemCode || "—",
        itemName: catalogItem?.name || line.name || "—",
        brand: catalogItem?.brand || line.brand || "—",
        description: catalogItem?.description || line.description || "—",
        quantity: Number(line.quantity),
        photo: catalogItem?.photo || line.photo || "",
        isOther: false,
      });
    });
    setLineErrors(nextLineErrors);
    if (Object.keys(nextLineErrors).length) {
      toast.warning("Fix the highlighted rows before submitting.");
      return null;
    }
    return payloads;
  };

  const buildMultiVehiclePartPayloads = () => {
    if (multiPartLines.length < 2) {
      toast.warning("Add at least two parts for a multiple requisition.");
      return null;
    }

    const nextLineErrors = {};
    const payloads = [];
    multiPartLines.forEach((line) => {
      const rowErrors = {};
      const part = vehicleParts.find((item) => item.id === line.partId);
      if (!line.partId || !part) rowErrors.partId = "Missing part.";
      if (
        line.quantity === ""
        || Number.isNaN(Number(line.quantity))
        || Number(line.quantity) <= 0
      ) {
        rowErrors.quantity = "Enter a valid quantity.";
      }
      if (!String(line.justification || "").trim()) {
        rowErrors.justification = "Enter a justification.";
      }
      if (Object.keys(rowErrors).length) {
        nextLineErrors[line.id] = rowErrors;
        return;
      }
      payloads.push(
        buildVehiclePartFromSelection(part, line.quantity, line.levels, line.justification),
      );
    });
    setLineErrors(nextLineErrors);
    if (Object.keys(nextLineErrors).length) {
      toast.warning("Fix the highlighted rows before submitting.");
      return null;
    }
    return payloads;
  };

  const handleSubmit = () => {
    if (step === "accessories") {
      const payload = buildSingleAccessoryPayload();
      if (!payload) return;
      setPendingPayload([payload]);
      setConfirmOpen(true);
      return;
    }
    if (step === "vehicle_parts") {
      const payload = buildSingleVehiclePartPayload();
      if (!payload) return;
      setPendingPayload([payload]);
      setConfirmOpen(true);
      return;
    }
    if (step === "accessories_multi") {
      const payloads = buildMultiAccessoryPayloads();
      if (!payloads) return;
      setPendingPayload(payloads);
      setConfirmOpen(true);
      return;
    }
    if (step === "vehicle_parts_multi") {
      const payloads = buildMultiVehiclePartPayloads();
      if (!payloads) return;
      setPendingPayload(payloads);
      setConfirmOpen(true);
    }
  };

  const handleConfirm = () => {
    if (!pendingPayload?.length) return;
    onSave(pendingPayload.length === 1 ? pendingPayload[0] : pendingPayload);
    setConfirmOpen(false);
    setPendingPayload(null);
  };

  const handlePrimaryAction = () => {
    if (step === "type") return continueFromSetup();
    return handleSubmit();
  };

  const handleBack = () => {
    setErrors({});
    setLineErrors({});
    if (
      step === "accessories"
      || step === "vehicle_parts"
      || step === "accessories_multi"
      || step === "vehicle_parts_multi"
    ) {
      setStep("type");
      resetFormFields();
    }
  };

  const isTypeStep = step === "type";
  const isAccessoryStep = step === "accessories";
  const isVehicleStep = step === "vehicle_parts";
  const isAccessoryMultiStep = step === "accessories_multi";
  const isVehicleMultiStep = step === "vehicle_parts_multi";
  const isMultiStep = isAccessoryMultiStep || isVehicleMultiStep;
  const isFormStep = isAccessoryStep || isVehicleStep || isMultiStep;
  const pendingCount = pendingPayload?.length ?? 0;

  const title = isTypeStep
    ? "New Item Request"
    : isAccessoryMultiStep
      ? "Multiple Accessory Requisition"
      : isVehicleMultiStep
        ? "Multiple Vehicle Part Requisition"
        : isAccessoryStep
          ? "Accessory Requisition"
          : "Vehicle Part Requisition";

  const subtitle = isTypeStep
    ? "Select whether you are requesting a single item or multiple items."
    : isAccessoryMultiStep
      ? "Search and add items above, review them in the table, then submit together."
      : isVehicleMultiStep
        ? "Filter by vehicle, search and add parts above, then submit together."
        : isAccessoryStep
          ? "Select an accessory from inventory, or request a custom item."
          : "Filter by make, model, and year, then select the part.";

  return (
    <>
      <AddModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={handlePrimaryAction}
        title={title}
        subtitle={subtitle}
        saveLabel={
          isTypeStep
            ? "Continue"
            : isAccessoryMultiStep
              ? `Submit ${multiAccessoryLines.length} requisitions`
              : isVehicleMultiStep
                ? `Submit ${multiPartLines.length} requisitions`
                : "Submit requisition"
        }
        fillViewport={false}
        dialogClassName={
          isVehicleMultiStep
            ? "max-w-7xl"
            : isAccessoryMultiStep
              ? "max-w-5xl"
              : isFormStep
                ? "max-w-3xl"
                : "max-w-lg"
        }
        contentClassName="space-y-3"
        secondaryAction={
          !isTypeStep
            ? {
                label: "Back",
                onClick: handleBack,
              }
            : undefined
        }
      >
        {isTypeStep && (
          <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <p
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    errors.quantityMode ? "text-red-500" : "text-slate-500",
                  )}
                >
                  Number of items
                  <span className="normal-case !text-red-500" aria-hidden="true"> *</span>
                </p>
                <div role="radiogroup" aria-label="Number of items" className="flex flex-nowrap gap-2">
                  <ChoiceOption
                    type="radio"
                    id="reqItemCountSingle"
                    name="reqItemCount"
                    value="single"
                    label="Single"
                    className="min-w-0 flex-1"
                    checked={quantityMode === "single"}
                    onChange={() => {
                      setQuantityMode("single");
                      clearError("quantityMode");
                    }}
                  />
                  <ChoiceOption
                    type="radio"
                    id="reqItemCountMultiple"
                    name="reqItemCount"
                    value="multiple"
                    label="Multiple"
                    className="min-w-0 flex-1"
                    checked={quantityMode === "multiple"}
                    onChange={() => {
                      setQuantityMode("multiple");
                      clearError("quantityMode");
                    }}
                  />
                </div>
                {errors.quantityMode ? (
                  <p className="text-[10px] font-medium text-red-500">{errors.quantityMode}</p>
                ) : null}
              </div>
          </div>
        )}

        {isAccessoryStep && (
          <>
            <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => setAccessoryMode("catalog")}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-bold rounded-md transition-colors",
                  accessoryMode === "catalog"
                    ? "bg-white text-primary shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                From inventory
              </button>
              <button
                type="button"
                onClick={() => setAccessoryMode("other")}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-bold rounded-md transition-colors",
                  accessoryMode === "other"
                    ? "bg-white text-primary shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                Other (not in list)
              </button>
            </div>

            {accessoryMode === "catalog" ? (
              <>
                {selectedAccessory ? (
                  <SelectedAccessoryCard
                    item={selectedAccessory}
                    onChange={() => {
                      setSelectedAccessoryId("");
                      clearError("selectedAccessoryId");
                    }}
                  />
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider",
                          errors.selectedAccessoryId ? "text-red-500" : "text-slate-500",
                        )}
                      >
                        Search accessories
                      </label>
                      <div className="relative">
                        <Search
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          value={accessorySearch}
                          onChange={(e) => setAccessorySearch(e.target.value)}
                          className={cn(
                            fieldClassName,
                            "pl-9",
                            errors.selectedAccessoryId && "border-red-500 bg-red-50",
                          )}
                          placeholder="Search by code, name, or brand…"
                        />
                      </div>
                      {errors.selectedAccessoryId ? (
                        <p className="text-[10px] font-medium text-red-500">
                          {errors.selectedAccessoryId}
                        </p>
                      ) : null}
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-50">
                      {filteredAccessories.length === 0 ? (
                        <p className="px-4 py-6 text-center text-[12px] text-slate-400">
                          No accessories match your search.
                        </p>
                      ) : (
                        filteredAccessories.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSelectedAccessoryId(item.id);
                              clearError("selectedAccessoryId");
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <ItemPhotoThumb src={item.photo} name={item.name} className="h-9 w-9" />
                              <div className="min-w-0">
                                <p className="text-[12px] font-bold text-slate-900">{item.name}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {item.itemCode} · {item.brand}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
                <InputField
                  label="Quantity"
                  id="reqAccQty"
                  type="number"
                  value={accessoryQty}
                  onChange={(e) => {
                    setAccessoryQty(e.target.value);
                    clearError("accessoryQty");
                  }}
                  error={errors.accessoryQty}
                />
              </>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InputField
                    label="Name"
                    id="reqOtherName"
                    required
                    value={otherName}
                    onChange={(e) => {
                      setOtherName(e.target.value);
                      clearError("otherName");
                    }}
                    error={errors.otherName}
                    placeholder="Item name"
                  />
                  <InputField
                    label="Quantity"
                    id="reqOtherQty"
                    type="number"
                    required
                    value={otherQty}
                    onChange={(e) => {
                      setOtherQty(e.target.value);
                      clearError("otherQty");
                    }}
                    error={errors.otherQty}
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="reqOtherDescription"
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      errors.otherDescription ? "text-red-500" : "text-slate-500",
                    )}
                  >
                    Description
                    <span className="normal-case !text-red-500" aria-hidden="true">
                      {" "}
                      *
                    </span>
                  </label>
                  <p className="text-[10px] font-medium normal-case tracking-normal text-slate-400 leading-snug">
                    {UNREGISTERED_ITEM_DESCRIPTION_HELPER}
                  </p>
                  <textarea
                    id="reqOtherDescription"
                    rows={3}
                    value={otherDescription}
                    onChange={(e) => {
                      setOtherDescription(e.target.value);
                      clearError("otherDescription");
                    }}
                    className={cn(
                      fieldClassName,
                      "resize-none",
                      errors.otherDescription && "border-red-500 bg-red-50",
                    )}
                    placeholder={UNREGISTERED_ITEM_DESCRIPTION_PLACEHOLDER}
                  />
                  <p
                    className={cn(
                      "mt-1 min-h-[14px] text-[10px] font-medium leading-[14px]",
                      errors.otherDescription ? "text-red-500" : "invisible",
                    )}
                    aria-live="polite"
                  >
                    {errors.otherDescription || "\u00A0"}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {isVehicleStep && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Make
                </label>
                <select
                  value={make}
                  onChange={(e) => {
                    setMake(e.target.value);
                    setModel("");
                    setYear("");
                    setSelectedPartId("");
                    setPartSearch("");
                    clearError("make");
                  }}
                  className={cn(fieldClassName, errors.make && "border-red-500 bg-red-50")}
                >
                  <option value="">Select make…</option>
                  {makeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.make && (
                  <p className="text-[10px] font-medium text-red-500">{errors.make}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Model
                </label>
                <select
                  value={model}
                  disabled={!make}
                  onChange={(e) => {
                    setModel(e.target.value);
                    setYear("");
                    setSelectedPartId("");
                    setPartSearch("");
                    clearError("model");
                  }}
                  className={cn(
                    fieldClassName,
                    errors.model && "border-red-500 bg-red-50",
                    !make && "opacity-60",
                  )}
                >
                  <option value="">Select model…</option>
                  {modelOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.model && (
                  <p className="text-[10px] font-medium text-red-500">{errors.model}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Year
                </label>
                <select
                  value={year}
                  disabled={!model}
                  onChange={(e) => {
                    setYear(e.target.value);
                    setSelectedPartId("");
                    setPartSearch("");
                    clearError("year");
                  }}
                  className={cn(
                    fieldClassName,
                    errors.year && "border-red-500 bg-red-50",
                    !model && "opacity-60",
                  )}
                >
                  <option value="">Select year…</option>
                  {yearOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.year && (
                  <p className="text-[10px] font-medium text-red-500">{errors.year}</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50/70 px-3 py-2 border-b border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Filter by vehicle part level (optional)
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium normal-case tracking-normal">
                  Narrow the parts list by selecting component levels from Level 1 downward.
                </p>
              </div>
              <div className="px-3 py-3 bg-white">
                <ComponentLevelSelects
                  levels={componentLevels}
                  onChange={(levels) => {
                    setComponentLevels(levels);
                    setSelectedPartId("");
                  }}
                />
              </div>
            </div>

            {make && model && year ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Search parts
                </label>
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={partSearch}
                    onChange={(e) => setPartSearch(e.target.value)}
                    className={cn(fieldClassName, "pl-9")}
                    placeholder="Search matching parts…"
                  />
                </div>
              </div>
            ) : null}

            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-50">
              {!make || !model || !year ? (
                <p className="px-4 py-6 text-center text-[12px] text-slate-400">
                  Select make, model, and year to see parts.
                </p>
              ) : filteredVehicleParts.length === 0 ? (
                <p className="px-4 py-6 text-center text-[12px] text-slate-400">
                  No vehicle parts match these filters.
                </p>
              ) : (
                filteredVehicleParts.map((part) => (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => {
                      setSelectedPartId(part.id);
                      clearError("selectedPartId");
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors",
                      selectedPartId === part.id && "bg-slate-50",
                    )}
                  >
                    <p className="text-[12px] font-bold text-slate-900">{part.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {part.itemCode} · {part.brand}
                    </p>
                  </button>
                ))
              )}
            </div>
            {errors.selectedPartId && (
              <p className="text-[10px] font-medium text-red-500">{errors.selectedPartId}</p>
            )}

            {selectedPart && (
              <DetailBlock>
                <DetailLine label="Code" value={selectedPart.itemCode} />
                <DetailLine label="Name" value={selectedPart.name} />
                <DetailLine
                  label="Vehicle"
                  value={`${selectedPart.make} ${selectedPart.model} (${selectedPart.year})`}
                />
                <DetailLine label="Chassis" value={selectedPart.chassisNumber} />
                <DetailLine label="Brand" value={selectedPart.brand} />
              </DetailBlock>
            )}

            <InputField
              label="Quantity"
              id="reqVpQty"
              type="number"
              value={partQty}
              onChange={(e) => {
                setPartQty(e.target.value);
                clearError("partQty");
              }}
              error={errors.partQty}
            />
            <div className="space-y-1.5">
              <label
                htmlFor="reqVpJustification"
                className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
              >
                Justification
              </label>
              <textarea
                id="reqVpJustification"
                rows={3}
                value={partJustification}
                onChange={(e) => {
                  setPartJustification(e.target.value);
                  clearError("partJustification");
                }}
                className={cn(
                  fieldClassName,
                  "resize-none",
                  errors.partJustification && "border-red-500 bg-red-50",
                )}
                placeholder="Why is this part needed?"
              />
              {errors.partJustification && (
                <p className="text-[10px] font-medium text-red-500">
                  {errors.partJustification}
                </p>
              )}
            </div>
          </>
        )}

        {isAccessoryMultiStep && (
          <MultiAccessoryRequisitionTable
            lines={multiAccessoryLines}
            accessories={accessories}
            errors={lineErrors}
            onAddItem={(item) => {
              setMultiAccessoryLines((prev) => [...prev, item]);
              setLineErrors({});
            }}
            onChangeQuantity={(id, quantity) => {
              setMultiAccessoryLines((prev) =>
                prev.map((line) => (line.id === id ? { ...line, quantity } : line)),
              );
              setLineErrors((prev) => {
                if (!prev[id]) return prev;
                const next = { ...prev };
                delete next[id];
                return next;
              });
            }}
            onRemoveLine={(id) =>
              setMultiAccessoryLines((prev) => prev.filter((line) => line.id !== id))
            }
          />
        )}

        {isVehicleMultiStep && (
          <MultiVehiclePartRequisitionTable
            make={make}
            model={model}
            year={year}
            makeOptions={makeOptions}
            modelOptions={modelOptions}
            yearOptions={yearOptions}
            onMakeChange={(value) => {
              setMake(value);
              setModel("");
              setYear("");
              clearError("make");
            }}
            onModelChange={(value) => {
              setModel(value);
              setYear("");
              clearError("model");
            }}
            onYearChange={(value) => {
              setYear(value);
              clearError("year");
            }}
            lines={multiPartLines}
            parts={vehicleParts}
            errors={lineErrors}
            headerErrors={errors}
            onAddItem={(item) => {
              setMultiPartLines((prev) => [...prev, item]);
              setLineErrors({});
            }}
            onChangeQuantity={(id, quantity) => {
              setMultiPartLines((prev) =>
                prev.map((line) => (line.id === id ? { ...line, quantity } : line)),
              );
              setLineErrors((prev) => {
                if (!prev[id]) return prev;
                const next = { ...prev };
                delete next[id];
                return next;
              });
            }}
            onChangeJustification={(id, justification) => {
              setMultiPartLines((prev) =>
                prev.map((line) => (line.id === id ? { ...line, justification } : line)),
              );
              setLineErrors((prev) => {
                if (!prev[id]?.justification) return prev;
                const next = { ...prev };
                const row = { ...next[id] };
                delete row.justification;
                if (Object.keys(row).length) next[id] = row;
                else delete next[id];
                return next;
              });
            }}
            onRemoveLine={(id) =>
              setMultiPartLines((prev) => prev.filter((line) => line.id !== id))
            }
          />
        )}
      </AddModal>

      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setPendingPayload(null);
        }}
        onConfirm={handleConfirm}
        title={pendingCount > 1 ? "Submit requisitions?" : "Submit requisition?"}
        message={
          pendingCount > 1
            ? `Submit ${pendingCount} item requisitions in one go?`
            : pendingPayload?.[0]
              ? `Submit requisition for ${pendingPayload[0].quantity} × ${pendingPayload[0].itemName}?`
              : "Submit this requisition?"
        }
        confirmText={pendingCount > 1 ? "Submit all" : "Submit requisition"}
      />
    </>
  );
}
