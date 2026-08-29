import React, { useEffect, useMemo, useState } from "react";
import { Replace, Search } from "lucide-react";
import AddModal from "../../../../components/common/AddModal";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import InputField from "../../../../components/common/fields/InputField";
import ChoiceOption from "../../../../components/common/fields/ChoiceOption";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import { listItems } from "../../../../services/itemsService";
import {
  createGeneralRequest,
  updateGeneralRequest,
} from "../../../../services/generalRequestsService";
import { MultiAccessoryRequisitionTable } from "../../../stores/supplies/components/MultiRequisitionTables";
import { ItemPhotoThumb } from "../../../stores/inventory/components/ItemPhotoField";
import { isPositiveInt, toGeneralRequestWriteBody, UNREGISTERED_ITEM_DESCRIPTION_HELPER, UNREGISTERED_ITEM_DESCRIPTION_PLACEHOLDER } from "../utils/requestHelpers";

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 transition-colors text-slate-700";

function sameId(a, b) {
  if (a == null || b == null || a === "" || b === "") return false;
  return String(a) === String(b);
}

function SelectedItemCard({ item, onChange }) {
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

function ReasonField({ value, onChange, error }) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor="requestReason"
        className={cn(
          "text-[10px] font-bold uppercase tracking-wider",
          error ? "text-red-500" : "text-slate-500",
        )}
      >
        Reason
      </label>
      <textarea
        id="requestReason"
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(fieldClassName, "resize-none", error && "border-red-500 bg-red-50")}
        placeholder="Why these items are needed"
      />
      {error ? <p className="text-[10px] font-medium text-red-500">{error}</p> : null}
    </div>
  );
}

function toCatalogLine(item, quantity) {
  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    source: "catalog",
    accessoryId: item.id,
    itemCode: item.itemCode || item.code || "—",
    name: item.name || "—",
    brand: item.brand || "—",
    description: item.description || "",
    quantity: String(quantity),
    photo: item.photo || "",
  };
}

function toOtherLine({ name, description, quantity }) {
  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    source: "other",
    accessoryId: null,
    itemCode: "—",
    name,
    brand: "—",
    description,
    quantity: String(quantity),
    photo: "",
  };
}

function editingToMultiLines(editing, catalog) {
  return (editing?.items || []).map((item) => {
    const catalogItem = catalog.find((row) => sameId(row.id, item.itemId));
    if (item.itemId != null && catalogItem) {
      return {
        ...toCatalogLine(catalogItem, item.quantity),
        id: `line-${item.id ?? item.itemId}`,
      };
    }
    return {
      ...toOtherLine({
        name: item.name || "",
        description: item.description || "",
        quantity: item.quantity,
      }),
      id: `line-${item.id ?? Date.now()}`,
    };
  });
}

export default function NewRequestModal({ isOpen, onClose, onSaved, editing = null }) {
  const isEdit = Boolean(editing);
  const [step, setStep] = useState("type");
  const [quantityMode, setQuantityMode] = useState("");
  const [errors, setErrors] = useState({});
  const [lineErrors, setLineErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [catalogReady, setCatalogReady] = useState(false);

  const [accessoryMode, setAccessoryMode] = useState("catalog");
  const [accessorySearch, setAccessorySearch] = useState("");
  const [selectedAccessoryId, setSelectedAccessoryId] = useState("");
  const [accessoryQty, setAccessoryQty] = useState("");
  const [otherName, setOtherName] = useState("");
  const [otherQty, setOtherQty] = useState("");
  const [otherDescription, setOtherDescription] = useState("");
  const [reason, setReason] = useState("");
  const [multiLines, setMultiLines] = useState([]);

  const resetItemFields = () => {
    setAccessoryMode("catalog");
    setAccessorySearch("");
    setSelectedAccessoryId("");
    setAccessoryQty("");
    setOtherName("");
    setOtherQty("");
    setOtherDescription("");
    setReason("");
    setMultiLines([]);
    setLineErrors({});
  };

  const applyEditing = (request, items) => {
    setReason(request?.reason || "");
    const lines = request?.items || [];
    if (lines.length > 1) {
      setQuantityMode("multiple");
      setStep("accessories_multi");
      setMultiLines(editingToMultiLines(request, items));
      return;
    }
    setQuantityMode("single");
    setStep("accessories");
    const item = lines[0];
    const catalogItem = items.find((row) => sameId(row.id, item?.itemId));
    if (item?.itemId != null && catalogItem) {
      setAccessoryMode("catalog");
      setSelectedAccessoryId(catalogItem.id);
      setAccessoryQty(item.quantity != null ? String(item.quantity) : "");
      return;
    }
    if (item) {
      setAccessoryMode("other");
      setOtherName(item.name || "");
      setOtherQty(item.quantity != null ? String(item.quantity) : "");
      setOtherDescription(item.description || "");
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setConfirmOpen(false);
    setPendingPayload(null);
    setSaving(false);
    setCatalogReady(false);
    resetItemFields();
    if (editing) {
      setReason(editing.reason || "");
      if ((editing.items || []).length > 1) {
        setQuantityMode("multiple");
        setStep("accessories_multi");
      } else {
        setQuantityMode("single");
        setStep("accessories");
      }
    } else {
      setStep("type");
      setQuantityMode("");
    }

    const load = async () => {
      try {
        const items = await listItems();
        setCatalog(items);
        if (editing) applyEditing(editing, items);
      } catch (err) {
        setCatalog([]);
        toast.error(err.message || "Unable to load items.");
        if (editing) applyEditing(editing, []);
      } finally {
        setCatalogReady(true);
      }
    };
    load();
  }, [isOpen, editing]);

  const filteredCatalog = useMemo(() => {
    const query = accessorySearch.trim().toLowerCase();
    if (!query) return catalog.slice(0, 20);
    return catalog
      .filter((item) =>
        [item.itemCode, item.name, item.brand, item.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query)),
      )
      .slice(0, 20);
  }, [catalog, accessorySearch]);

  const selectedItem = useMemo(
    () => catalog.find((item) => sameId(item.id, selectedAccessoryId)) ?? null,
    [catalog, selectedAccessoryId],
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
    if (!quantityMode) {
      setErrors({ quantityMode: "Choose single or multiple items." });
      return;
    }
    setErrors({});
    resetItemFields();
    setStep(quantityMode === "single" ? "accessories" : "accessories_multi");
  };

  const buildSingleLines = () => {
    const nextErrors = {};
    if (accessoryMode === "catalog") {
      if (!selectedItem) nextErrors.selectedAccessoryId = "Select an item.";
      if (!isPositiveInt(accessoryQty)) {
        nextErrors.accessoryQty = "Enter a whole quantity greater than zero.";
      }
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) {
        toast.warning("Fix the highlighted fields before submitting.");
        return null;
      }
      return [toCatalogLine(selectedItem, accessoryQty)];
    }

    if (!otherName.trim()) nextErrors.otherName = "Enter an item name.";
    if (!isPositiveInt(otherQty)) nextErrors.otherQty = "Enter a whole quantity greater than zero.";
    if (!otherDescription.trim()) nextErrors.otherDescription = "Enter a description.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Fix the highlighted fields before submitting.");
      return null;
    }
    return [
      toOtherLine({
        name: otherName.trim(),
        description: otherDescription.trim(),
        quantity: otherQty,
      }),
    ];
  };

  const buildMultiLines = () => {
    if (multiLines.length < 2) {
      toast.warning("Add at least two items for a multiple request.");
      return null;
    }

    const nextLineErrors = {};
    multiLines.forEach((line) => {
      const rowErrors = {};
      if (!isPositiveInt(line.quantity)) {
        rowErrors.quantity = "Enter a whole quantity greater than zero.";
      }
      if (line.source === "other" && !line.name?.trim()) {
        rowErrors.name = "Missing item name.";
      }
      if (line.source !== "other" && line.accessoryId == null && !line.name?.trim()) {
        rowErrors.name = "Missing item name.";
      }
      if (Object.keys(rowErrors).length) nextLineErrors[line.id] = rowErrors;
    });
    setLineErrors(nextLineErrors);
    if (Object.keys(nextLineErrors).length) {
      toast.warning("Fix the highlighted rows before submitting.");
      return null;
    }
    return multiLines;
  };

  const buildPayload = () => {
    const lines = step === "accessories" ? buildSingleLines() : buildMultiLines();
    if (!lines) return null;
    return toGeneralRequestWriteBody(reason, lines);
  };

  const persist = async (payload) => {
    setSaving(true);
    try {
      if (isEdit) {
        const saved = await updateGeneralRequest(editing.id, payload);
        toast.success("Request updated.");
        onSaved?.(saved);
        onClose?.();
        return;
      }
      const created = await createGeneralRequest(payload);
      toast.success("Request submitted.");
      onSaved?.(created);
      onClose?.();
    } catch (err) {
      toast.error(err.message || "Could not save request.");
    } finally {
      setSaving(false);
      setConfirmOpen(false);
      setPendingPayload(null);
    }
  };

  const handlePrimaryAction = () => {
    if (step === "type") return continueFromSetup();
    const payload = buildPayload();
    if (!payload) return;
    if (isEdit) {
      persist(payload);
      return;
    }
    setPendingPayload(payload);
    setConfirmOpen(true);
  };

  const handleBack = () => {
    setErrors({});
    setLineErrors({});
    setStep("type");
    resetItemFields();
  };

  const isTypeStep = step === "type";
  const isSingleStep = step === "accessories";
  const isMultiStep = step === "accessories_multi";
  const itemCount = pendingPayload?.items?.length ?? 0;
  const firstItemName = pendingPayload?.items?.[0]?.name || "item";

  const title = isTypeStep
    ? isEdit
      ? "Edit Item Request"
      : "New Item Request"
    : isMultiStep
      ? "Multiple Item Request"
      : "Item Request";

  const subtitle = isTypeStep
    ? "Select whether you are requesting a single item or multiple items."
    : isMultiStep
      ? "Search and add items above, review them in the table, then submit together."
      : "Select an item from inventory, or request a custom item.";

  return (
    <>
      <AddModal
      isOpen={isOpen}
      onClose={onClose}
        onSave={handlePrimaryAction}
        title={title}
        subtitle={subtitle}
        saveLabel={
          saving
            ? "Saving…"
            : isTypeStep
              ? "Continue"
              : isEdit
                ? "Save changes"
                : "Submit request"
        }
        saveDisabled={saving || (!isTypeStep && !catalogReady)}
        fillViewport={false}
        dialogClassName={isMultiStep ? "max-w-5xl" : isSingleStep ? "max-w-3xl" : "max-w-lg"}
        contentClassName="space-y-3"
        secondaryAction={
          !isTypeStep
            ? { label: "Back", onClick: handleBack, disabled: saving }
            : undefined
        }
      >
        {isTypeStep ? (
          <div className="space-y-1.5">
            <p
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                errors.quantityMode ? "text-red-500" : "text-slate-500",
              )}
            >
              Number of items
              <span className="normal-case !text-red-500" aria-hidden="true">
                {" "}
                *
              </span>
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
        ) : null}

        {isSingleStep ? (
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
                {selectedItem ? (
                  <SelectedItemCard
                    item={selectedItem}
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
                        Search items
                      </label>
                      <div className="relative">
                        <Search
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          value={accessorySearch}
                          onChange={(event) => setAccessorySearch(event.target.value)}
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
                      {filteredCatalog.length === 0 ? (
                        <p className="px-4 py-6 text-center text-[12px] text-slate-400">
                          No items match your search.
                        </p>
                      ) : (
                        filteredCatalog.map((item) => (
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
                                  {[item.itemCode, item.brand].filter(Boolean).join(" · ") || "—"}
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
                  id="reqItemQty"
                  type="number"
                  value={accessoryQty}
                  onChange={(event) => {
                    setAccessoryQty(event.target.value);
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
                    onChange={(event) => {
                      setOtherName(event.target.value);
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
                    onChange={(event) => {
                      setOtherQty(event.target.value);
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
                    onChange={(event) => {
                      setOtherDescription(event.target.value);
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

            <ReasonField value={reason} onChange={setReason} />
          </>
        ) : null}

        {isMultiStep ? (
          <>
            <MultiAccessoryRequisitionTable
              lines={multiLines}
              accessories={catalog}
              errors={lineErrors}
              onAddItem={(item) => {
                setMultiLines((prev) => [...prev, item]);
                setLineErrors({});
              }}
              onChangeQuantity={(id, quantity) => {
                setMultiLines((prev) =>
                  prev.map((line) => (line.id === id ? { ...line, quantity } : line)),
                );
                setLineErrors((prev) => {
                  if (!prev[id]) return prev;
                  const next = { ...prev };
                  delete next[id];
                  return next;
                });
              }}
              onRemoveLine={(id) => setMultiLines((prev) => prev.filter((line) => line.id !== id))}
              itemNoun="items"
            />
            <ReasonField value={reason} onChange={setReason} />
          </>
        ) : null}
      </AddModal>

      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => {
          if (saving) return;
          setConfirmOpen(false);
          setPendingPayload(null);
        }}
        onConfirm={() => pendingPayload && persist(pendingPayload)}
        closeOnConfirm={false}
        confirmLoading={saving}
        title="Submit request?"
        message={
          itemCount > 1
            ? `Submit one request for ${itemCount} items?`
            : `Submit request for ${pendingPayload?.items?.[0]?.quantity || ""} × ${firstItemName}?`
        }
        confirmText={saving ? "Submitting…" : "Submit request"}
      />
    </>
  );
}
