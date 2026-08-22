import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Plus, Replace, Search, Trash2 } from "lucide-react";
import Button from "../../../../components/common/base/Button";
import InputField from "../../../../components/common/fields/InputField";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import ComponentLevelSelects from "../../vehicleParts/ComponentLevelSelects";
import { ItemPhotoThumb } from "../../inventory/components/ItemPhotoField";

const fieldClassName =
  "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 transition-colors text-slate-700";

const thClass =
  "px-3 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-left";

const tdClass = "px-3 py-3 align-middle text-[12px] text-slate-700";

export function createEmptyAccessoryLine() {
  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    source: "catalog",
    accessoryId: "",
    itemCode: "",
    name: "",
    brand: "",
    description: "",
    quantity: "1",
    photo: "",
  };
}

export function createEmptyVehiclePartLine() {
  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    partId: "",
    quantity: "1",
    justification: "",
    levels: {
      level1: "",
      level2: "",
      level3: "",
      level4: "",
      level5: "",
      level6: "",
    },
  };
}

function DetailLine({ label, value }) {
  return (
    <div className="flex flex-wrap gap-x-2 text-[12px]">
      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] min-w-[72px]">
        {label}
      </span>
      <span className="font-medium text-slate-800">{value || "—"}</span>
    </div>
  );
}

function SelectedAccessoryCard({ item, onChange }) {
  const meta = [item.itemCode, item.brand].filter(Boolean).join(" · ");

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

/** Multi-line accessory requisition: search/add above, items table below. */
export function MultiAccessoryRequisitionTable({
  lines,
  accessories,
  errors = {},
  onAddItem,
  onRemoveLine,
  onChangeQuantity,
}) {
  const [tab, setTab] = useState("catalog");
  const [search, setSearch] = useState("");
  const [selectedAccessoryId, setSelectedAccessoryId] = useState("");
  const [catalogQty, setCatalogQty] = useState("1");
  const [otherName, setOtherName] = useState("");
  const [otherQty, setOtherQty] = useState("1");
  const [otherDescription, setOtherDescription] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [findItemsOpen, setFindItemsOpen] = useState(true);

  const filteredAccessories = useMemo(() => {
    const addedIds = new Set(
      lines
        .filter((line) => line.source === "catalog" && line.accessoryId)
        .map((line) => line.accessoryId),
    );
    const available = accessories.filter((item) => !addedIds.has(item.id));
    const q = search.trim().toLowerCase();
    if (!q) return available;
    return available.filter((item) =>
      [item.itemCode, item.name, item.brand, item.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [accessories, search, lines]);

  const selectedAccessory = useMemo(
    () => accessories.find((item) => item.id === selectedAccessoryId) || null,
    [accessories, selectedAccessoryId],
  );

  useEffect(() => {
    if (!selectedAccessoryId) return;
    const added = lines.some(
      (line) => line.source === "catalog" && line.accessoryId === selectedAccessoryId,
    );
    if (added) setSelectedAccessoryId("");
  }, [lines, selectedAccessoryId]);

  const clearFormError = (key) => {
    setFormErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const resetCatalogForm = () => {
    setSelectedAccessoryId("");
    setCatalogQty("1");
    setSearch("");
    setFormErrors({});
  };

  const resetOtherForm = () => {
    setOtherName("");
    setOtherQty("1");
    setOtherDescription("");
    setFormErrors({});
  };

  const handleAddFromCatalog = () => {
    const nextErrors = {};
    if (!selectedAccessory) nextErrors.selectedAccessoryId = "Select an accessory.";
    if (
      catalogQty === ""
      || Number.isNaN(Number(catalogQty))
      || Number(catalogQty) <= 0
    ) {
      nextErrors.catalogQty = "Enter a valid quantity.";
    }
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Fix the highlighted fields before adding.");
      return;
    }

    const alreadyAdded = lines.some(
      (line) => line.source === "catalog" && line.accessoryId === selectedAccessory.id,
    );
    if (alreadyAdded) {
      toast.warning("That accessory is already in the table.");
      return;
    }

    onAddItem({
      id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      source: "catalog",
      accessoryId: selectedAccessory.id,
      itemCode: selectedAccessory.itemCode,
      name: selectedAccessory.name,
      brand: selectedAccessory.brand || "—",
      description: selectedAccessory.description || "—",
      quantity: String(Number(catalogQty)),
      photo: selectedAccessory.photo || "",
    });
    resetCatalogForm();
    toast.success("Item added to table.");
  };

  const handleAddOther = () => {
    const nextErrors = {};
    if (!otherName.trim()) nextErrors.otherName = "Enter an item name.";
    if (
      otherQty === ""
      || Number.isNaN(Number(otherQty))
      || Number(otherQty) <= 0
    ) {
      nextErrors.otherQty = "Enter a valid quantity.";
    }
    if (!otherDescription.trim()) nextErrors.otherDescription = "Enter a description.";
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Fix the highlighted fields before adding.");
      return;
    }

    onAddItem({
      id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      source: "other",
      accessoryId: null,
      itemCode: "—",
      name: otherName.trim(),
      brand: "—",
      description: otherDescription.trim(),
      quantity: String(Number(otherQty)),
      photo: "",
    });
    resetOtherForm();
    toast.success("Item added to table.");
  };

  return (
    <div className="space-y-5">
      {/* Upper: search / add */}
      <section className="rounded-xl bg-slate-50/80 px-4 py-3 space-y-0">
        <button
          type="button"
          onClick={() => setFindItemsOpen((open) => !open)}
          className="w-full text-left group"
          aria-expanded={findItemsOpen}
        >
          <div className="flex items-center gap-1.5">
            <ChevronDown
              size={16}
              className={cn(
                "shrink-0 text-slate-400 transition-transform duration-200",
                findItemsOpen ? "rotate-0" : "-rotate-90",
              )}
            />
            <p className="text-[13px] font-bold text-slate-800 group-hover:text-slate-900">
              Find items
            </p>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Search inventory or describe an item not in the list, then add it to the table.
          </p>
        </button>

        {findItemsOpen ? (
          <div className="pt-4 space-y-4">
            <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => {
                  setTab("catalog");
                  setFormErrors({});
                }}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-bold rounded-md transition-colors",
                  tab === "catalog"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                From inventory
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("other");
                  setFormErrors({});
                }}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-bold rounded-md transition-colors",
                  tab === "other"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                Other (not in list)
              </button>
            </div>

            {tab === "catalog" ? (
              <div className="space-y-3">
                {selectedAccessory ? (
                  <SelectedAccessoryCard
                    item={selectedAccessory}
                    onChange={() => {
                      setSelectedAccessoryId("");
                      clearFormError("selectedAccessoryId");
                    }}
                  />
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider",
                          formErrors.selectedAccessoryId ? "text-red-500" : "text-slate-500",
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
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className={cn(
                            fieldClassName,
                            "pl-9 h-[38px]",
                            formErrors.selectedAccessoryId && "border-red-500 bg-red-50",
                          )}
                          placeholder="Search by code, name, or brand…"
                        />
                      </div>
                      {formErrors.selectedAccessoryId ? (
                        <p className="text-[10px] font-medium text-red-500">
                          {formErrors.selectedAccessoryId}
                        </p>
                      ) : null}
                    </div>
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-50">
                      {filteredAccessories.length === 0 ? (
                        <p className="px-4 py-6 text-center text-[12px] text-slate-400">
                          {accessories.length > 0
                            && lines.some((line) => line.source === "catalog" && line.accessoryId)
                            && !search.trim()
                            ? "All matching accessories are already in the table."
                            : "No accessories match your search."}
                        </p>
                      ) : (
                        filteredAccessories.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSelectedAccessoryId(item.id);
                              clearFormError("selectedAccessoryId");
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors"
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="w-full sm:w-28 shrink-0 space-y-1.5">
                    <label
                      htmlFor="multiAccQty"
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      Quantity
                    </label>
                    <input
                      id="multiAccQty"
                      type="number"
                      min="1"
                      value={catalogQty}
                      onChange={(e) => {
                        setCatalogQty(e.target.value);
                        clearFormError("catalogQty");
                      }}
                      className={cn(
                        fieldClassName,
                        "h-[38px]",
                        formErrors.catalogQty && "border-red-500 bg-red-50",
                      )}
                    />
                    {formErrors.catalogQty ? (
                      <p className="text-[10px] font-medium text-red-500">
                        {formErrors.catalogQty}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0">
                    <Button
                      type="button"
                      onClick={handleAddFromCatalog}
                      className="h-[38px] px-4 text-[12px]"
                    >
                      <Plus size={14} /> Add to table
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="flex-1 min-w-0">
                    <InputField
                      label="Name"
                      id="multiOtherName"
                      value={otherName}
                      onChange={(e) => {
                        setOtherName(e.target.value);
                        clearFormError("otherName");
                      }}
                      error={formErrors.otherName}
                      placeholder="Item name"
                      className="bg-white focus:bg-white"
                    />
                  </div>
                  <div className="w-full sm:w-28 shrink-0">
                    <InputField
                      label="Quantity"
                      id="multiOtherQty"
                      type="number"
                      value={otherQty}
                      onChange={(e) => {
                        setOtherQty(e.target.value);
                        clearFormError("otherQty");
                      }}
                      error={formErrors.otherQty}
                      className="bg-white focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="multiOtherDescription"
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    Description
                  </label>
                  <textarea
                    id="multiOtherDescription"
                    rows={2}
                    value={otherDescription}
                    onChange={(e) => {
                      setOtherDescription(e.target.value);
                      clearFormError("otherDescription");
                    }}
                    className={cn(
                      fieldClassName,
                      "resize-none min-h-[64px]",
                      formErrors.otherDescription && "border-red-500 bg-red-50",
                    )}
                    placeholder="Describe the item needed…"
                  />
                  {formErrors.otherDescription ? (
                    <p className="text-[10px] font-medium text-red-500">
                      {formErrors.otherDescription}
                    </p>
                  ) : null}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleAddOther}
                    className="h-[38px] px-4 text-[12px] w-full sm:w-auto"
                  >
                    <Plus size={14} /> Add to table
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </section>

      {/* Lower: items table */}
      <section className="space-y-3">
        <div>
          <p className="text-[13px] font-bold text-slate-800">Items to request</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {lines.length === 0
              ? "No items yet — add from the section above."
              : `${lines.length} item${lines.length === 1 ? "" : "s"} ready to submit.`}
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className={thClass}>Photo</th>
                <th className={thClass}>Code</th>
                <th className={thClass}>Name</th>
                <th className={thClass}>Brand</th>
                <th className={cn(thClass, "min-w-[160px]")}>Description</th>
                <th className={cn(thClass, "min-w-[100px]")}>Qty requested</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {lines.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-[12px] text-slate-400"
                  >
                    Added items will appear here.
                  </td>
                </tr>
              ) : (
                lines.map((line) => {
                  const rowError = errors[line.id] || {};
                  const catalogItem = accessories.find((item) => item.id === line.accessoryId);
                  return (
                    <tr key={line.id}>
                      <td className={tdClass}>
                        <ItemPhotoThumb
                          src={line.photo || catalogItem?.photo}
                          name={line.name}
                          className="h-9 w-9"
                        />
                      </td>
                      <td className={cn(tdClass, "font-mono text-[11px] text-slate-600")}>
                        {line.itemCode?.trim() ? line.itemCode : "—"}
                      </td>
                      <td className={cn(tdClass, "font-semibold text-slate-900")}>
                        {line.name || "—"}
                      </td>
                      <td className={tdClass}>{line.brand || "—"}</td>
                      <td className={cn(tdClass, "max-w-[220px]")}>
                        <span className="line-clamp-2">{line.description || "—"}</span>
                      </td>
                      <td className={tdClass}>
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => onChangeQuantity?.(line.id, e.target.value)}
                          className={cn(
                            fieldClassName,
                            "w-24",
                            rowError.quantity && "border-red-500 bg-red-50",
                          )}
                        />
                        {rowError.quantity ? (
                          <p className="text-[10px] text-red-500 mt-1">{rowError.quantity}</p>
                        ) : null}
                      </td>
                      <td className={tdClass}>
                        <button
                          type="button"
                          onClick={() => onRemoveLine(line.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/** Multi-line vehicle part requisition: find/add above, items table below. */
export function MultiVehiclePartRequisitionTable({
  make,
  model,
  year,
  makeOptions,
  modelOptions,
  yearOptions,
  onMakeChange,
  onModelChange,
  onYearChange,
  lines,
  parts,
  errors = {},
  headerErrors = {},
  onAddItem,
  onRemoveLine,
  onChangeQuantity,
  onChangeJustification,
}) {
  const [findItemsOpen, setFindItemsOpen] = useState(true);
  const [levelFilterOpen, setLevelFilterOpen] = useState(false);
  const [partSearch, setPartSearch] = useState("");
  const [selectedPartId, setSelectedPartId] = useState("");
  const [partQty, setPartQty] = useState("1");
  const [partJustification, setPartJustification] = useState("");
  const [componentLevels, setComponentLevels] = useState({
    level1: "",
    level2: "",
    level3: "",
    level4: "",
    level5: "",
    level6: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const filteredParts = useMemo(() => {
    if (!make || !model || !year) return [];
    const addedIds = new Set(lines.map((line) => line.partId).filter(Boolean));
    const q = partSearch.trim().toLowerCase();
    return parts.filter((part) => {
      if (addedIds.has(part.id)) return false;
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
  }, [parts, make, model, year, componentLevels, partSearch, lines]);

  const selectedPart = useMemo(
    () => parts.find((part) => part.id === selectedPartId) || null,
    [parts, selectedPartId],
  );

  useEffect(() => {
    if (!selectedPartId) return;
    const added = lines.some((line) => line.partId === selectedPartId);
    if (added) setSelectedPartId("");
  }, [lines, selectedPartId]);

  const clearFormError = (key) => {
    setFormErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const resetAddForm = () => {
    setSelectedPartId("");
    setPartQty("1");
    setPartJustification("");
    setPartSearch("");
    setComponentLevels({
      level1: "",
      level2: "",
      level3: "",
      level4: "",
      level5: "",
      level6: "",
    });
    setFormErrors({});
  };

  const handleAddPart = () => {
    const nextErrors = {};
    if (!make) nextErrors.make = "Select a make.";
    if (!model) nextErrors.model = "Select a model.";
    if (!year) nextErrors.year = "Select a year.";
    if (!selectedPart) nextErrors.selectedPartId = "Select a vehicle part.";
    if (
      partQty === ""
      || Number.isNaN(Number(partQty))
      || Number(partQty) <= 0
    ) {
      nextErrors.partQty = "Enter a valid quantity.";
    }
    if (!partJustification.trim()) {
      nextErrors.partJustification = "Enter a justification.";
    }
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Fix the highlighted fields before adding.");
      return;
    }

    const alreadyAdded = lines.some((line) => line.partId === selectedPart.id);
    if (alreadyAdded) {
      toast.warning("That part is already in the table.");
      return;
    }

    const mergedLevels = {
      level1: selectedPart.level1 || componentLevels.level1 || "",
      level2: selectedPart.level2 || componentLevels.level2 || "",
      level3: selectedPart.level3 || componentLevels.level3 || "",
      level4: selectedPart.level4 || componentLevels.level4 || "",
      level5: selectedPart.level5 || componentLevels.level5 || "",
      level6: selectedPart.level6 || componentLevels.level6 || "",
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
    const description =
      pathParts.length >= 2
        ? componentPath
        : (selectedPart.description || componentPath || selectedPart.name || "—");

    onAddItem({
      id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      partId: selectedPart.id,
      itemCode: selectedPart.itemCode || "—",
      name: selectedPart.name || "—",
      brand: selectedPart.brand || "—",
      description,
      quantity: String(Number(partQty)),
      justification: partJustification.trim(),
      make: selectedPart.make || null,
      model: selectedPart.model || null,
      year: selectedPart.year ?? null,
      chassisNumber: selectedPart.chassisNumber || null,
      levels: mergedLevels,
    });
    resetAddForm();
    toast.success("Part added to table.");
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl bg-slate-50/80 px-4 py-3 space-y-0">
        <button
          type="button"
          onClick={() => setFindItemsOpen((open) => !open)}
          className="w-full text-left group"
          aria-expanded={findItemsOpen}
        >
          <div className="flex items-center gap-1.5">
            <ChevronDown
              size={16}
              className={cn(
                "shrink-0 text-slate-400 transition-transform duration-200",
                findItemsOpen ? "rotate-0" : "-rotate-90",
              )}
            />
            <p className="text-[13px] font-bold text-slate-800 group-hover:text-slate-900">
              Find parts
            </p>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Filter by vehicle, search inventory parts, then add them to the table.
          </p>
        </button>

        {findItemsOpen ? (
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Make
                </label>
                <select
                  value={make}
                  onChange={(e) => {
                    onMakeChange(e.target.value);
                    setSelectedPartId("");
                    setPartSearch("");
                    clearFormError("make");
                  }}
                  className={cn(
                    fieldClassName,
                    "bg-white",
                    (headerErrors.make || formErrors.make) && "border-red-500 bg-red-50",
                  )}
                >
                  <option value="">Select make…</option>
                  {makeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Model
                </label>
                <select
                  value={model}
                  disabled={!make}
                  onChange={(e) => {
                    onModelChange(e.target.value);
                    setSelectedPartId("");
                    setPartSearch("");
                    clearFormError("model");
                  }}
                  className={cn(
                    fieldClassName,
                    "bg-white",
                    (headerErrors.model || formErrors.model) && "border-red-500 bg-red-50",
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
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Year
                </label>
                <select
                  value={year}
                  disabled={!model}
                  onChange={(e) => {
                    onYearChange(e.target.value);
                    setSelectedPartId("");
                    setPartSearch("");
                    clearFormError("year");
                  }}
                  className={cn(
                    fieldClassName,
                    "bg-white",
                    (headerErrors.year || formErrors.year) && "border-red-500 bg-red-50",
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
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setLevelFilterOpen((open) => !open)}
                className={cn(
                  "w-full bg-slate-50/70 px-3 py-2 text-left group",
                  levelFilterOpen && "border-b border-slate-200",
                )}
                aria-expanded={levelFilterOpen}
              >
                <div className="flex items-center gap-1.5">
                  <ChevronDown
                    size={14}
                    className={cn(
                      "shrink-0 text-slate-400 transition-transform duration-200",
                      levelFilterOpen ? "rotate-0" : "-rotate-90",
                    )}
                  />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-600">
                    Filter by vehicle part level (optional)
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium normal-case tracking-normal pl-5">
                  Narrow the parts list by selecting component levels from Level 1 downward.
                </p>
              </button>
              {levelFilterOpen ? (
                <div className="px-3 py-3">
                  <ComponentLevelSelects
                    levels={componentLevels}
                    onChange={(levels) => {
                      setComponentLevels(levels);
                      setSelectedPartId("");
                    }}
                  />
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              {make && model && year ? (
                <div className="space-y-1.5 flex-1 min-w-0">
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
                      className={cn(fieldClassName, "pl-9 h-[38px] bg-white")}
                      placeholder="Search by code, name, or brand…"
                    />
                  </div>
                </div>
              ) : null}
              <div className="w-full lg:w-28 shrink-0 space-y-1.5">
                <label
                  htmlFor="multiVpQty"
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                >
                  Quantity
                </label>
                <input
                  id="multiVpQty"
                  type="number"
                  min="1"
                  value={partQty}
                  onChange={(e) => {
                    setPartQty(e.target.value);
                    clearFormError("partQty");
                  }}
                  className={cn(
                    fieldClassName,
                    "h-[38px] bg-white",
                    formErrors.partQty && "border-red-500 bg-red-50",
                  )}
                />
                {formErrors.partQty ? (
                  <p className="text-[10px] font-medium text-red-500">{formErrors.partQty}</p>
                ) : null}
              </div>
              <div className="shrink-0">
                <Button
                  type="button"
                  onClick={handleAddPart}
                  className="h-[38px] px-4 text-[12px]"
                >
                  <Plus size={14} /> Add to table
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="multiVpJustification"
                className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
              >
                Justification
              </label>
              <textarea
                id="multiVpJustification"
                rows={2}
                value={partJustification}
                onChange={(e) => {
                  setPartJustification(e.target.value);
                  clearFormError("partJustification");
                }}
                className={cn(
                  fieldClassName,
                  "resize-none min-h-[64px] bg-white",
                  formErrors.partJustification && "border-red-500 bg-red-50",
                )}
                placeholder="Why is this part needed?"
              />
              {formErrors.partJustification ? (
                <p className="text-[10px] font-medium text-red-500">
                  {formErrors.partJustification}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-start">
              <div className="min-w-0 space-y-1.5">
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-50">
                  {!make || !model || !year ? (
                    <p className="px-4 py-6 text-center text-[12px] text-slate-400">
                      Select make, model, and year to see parts.
                    </p>
                  ) : filteredParts.length === 0 ? (
                    <p className="px-4 py-6 text-center text-[12px] text-slate-400">
                      {parts.some(
                        (part) =>
                          part.make === make
                          && part.model === model
                          && String(part.year) === String(year)
                          && lines.some((line) => line.partId === part.id),
                      )
                        && !partSearch.trim()
                        ? "All matching parts for this vehicle are already in the table."
                        : "No vehicle parts match these filters."}
                    </p>
                  ) : (
                    filteredParts.map((part) => (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => {
                          setSelectedPartId(part.id);
                          clearFormError("selectedPartId");
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 transition-colors",
                          selectedPartId === part.id ? "bg-emerald-50" : "hover:bg-slate-50",
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
                {formErrors.selectedPartId ? (
                  <p className="text-[10px] font-medium text-red-500">
                    {formErrors.selectedPartId}
                  </p>
                ) : null}
              </div>

              <div
                className={cn(
                  "rounded-xl border border-slate-200 bg-white p-4 space-y-2 overflow-y-auto",
                  selectedPart ? "max-h-48" : "",
                )}
              >
                {selectedPart ? (
                  <>
                    <DetailLine label="Code" value={selectedPart.itemCode} />
                    <DetailLine label="Name" value={selectedPart.name} />
                    <DetailLine
                      label="Vehicle"
                      value={`${selectedPart.make} ${selectedPart.model} (${selectedPart.year})`}
                    />
                    <DetailLine label="Chassis" value={selectedPart.chassisNumber} />
                    <DetailLine label="Brand" value={selectedPart.brand} />
                  </>
                ) : (
                  <p className="px-0 py-2 text-[12px] text-slate-400 text-center">
                    Select a part from the list to preview details.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-[13px] font-bold text-slate-800">Parts to request</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {lines.length === 0
              ? "No parts yet — add from the section above."
              : `${lines.length} part${lines.length === 1 ? "" : "s"} ready to submit.`}
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[920px] text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className={thClass}>Code</th>
                <th className={thClass}>Name</th>
                <th className={thClass}>Brand</th>
                <th className={cn(thClass, "min-w-[160px]")}>Description</th>
                <th className={cn(thClass, "min-w-[100px]")}>Qty requested</th>
                <th className={cn(thClass, "min-w-[180px]")}>Justification</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {lines.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-[12px] text-slate-400"
                  >
                    Added parts will appear here.
                  </td>
                </tr>
              ) : (
                lines.map((line) => {
                  const rowError = errors[line.id] || {};
                  return (
                    <tr key={line.id}>
                      <td className={cn(tdClass, "font-mono text-[11px] text-slate-600")}>
                        {line.itemCode?.trim() ? line.itemCode : "—"}
                      </td>
                      <td className={cn(tdClass, "font-semibold text-slate-900")}>
                        {line.name || "—"}
                      </td>
                      <td className={tdClass}>{line.brand || "—"}</td>
                      <td className={cn(tdClass, "max-w-[220px]")}>
                        <span className="line-clamp-2">{line.description || "—"}</span>
                      </td>
                      <td className={tdClass}>
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => onChangeQuantity?.(line.id, e.target.value)}
                          className={cn(
                            fieldClassName,
                            "w-24",
                            rowError.quantity && "border-red-500 bg-red-50",
                          )}
                        />
                        {rowError.quantity ? (
                          <p className="text-[10px] text-red-500 mt-1">{rowError.quantity}</p>
                        ) : null}
                      </td>
                      <td className={tdClass}>
                        <textarea
                          rows={2}
                          value={line.justification || ""}
                          onChange={(e) => onChangeJustification?.(line.id, e.target.value)}
                          className={cn(
                            fieldClassName,
                            "w-full min-w-[160px] resize-none",
                            rowError.justification && "border-red-500 bg-red-50",
                          )}
                          placeholder="Justification…"
                        />
                        {rowError.justification ? (
                          <p className="text-[10px] text-red-500 mt-1">{rowError.justification}</p>
                        ) : null}
                      </td>
                      <td className={tdClass}>
                        <button
                          type="button"
                          onClick={() => onRemoveLine(line.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          aria-label="Remove part"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
