import React, { useEffect, useMemo, useState } from "react";
import { Boxes } from "lucide-react";
import AddModal from "../../../../components/common/AddModal";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import CheckboxMultiSelect from "../../../../components/common/fields/CheckboxMultiSelect";
import { ConfiguredCustomFields } from "../../../../components/common/ConfiguredFormSections";
import { requiredFieldLabel } from "../../../../components/common/fields/requiredFieldLabel";
import { toast } from "../../../../components/common/ToastNotification";
import { useFormTreeSections } from "../../../../hooks/useFormTreeSections";
import {
  RAISE_SUPPLY_REQUEST_FORM_FIELD_CATALOG,
  RAISE_SUPPLY_REQUEST_FORM_SETUP_CHANGED_EVENT,
  getActiveRaiseSupplyRequestFormSections,
  getRaiseSupplyRequestFormSetup,
} from "../../../../mockdata/setups";
import {
  ACCESSORY_STATUS_OPTIONS,
  getAccessoryById,
  getInventoryStockByLocation,
  getRequisitionRemainingQuantity,
  getVehiclePartById,
  mapInventoryLocationToStore,
  STORE_LOCATION_OPTIONS,
  VEHICLE_PART_STATUS_OPTIONS,
} from "../../../../mockdata/stores";
import RequisitionRequestSummary from "./RequisitionRequestSummary";

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 transition-colors text-slate-700 resize-none";

export function getStockLocationsForRequisition(requisition) {
  if (!requisition?.itemId) return [];
  const item =
    requisition.kind === "vehicle_parts"
      ? getVehiclePartById(requisition.itemId)
      : getAccessoryById(requisition.itemId);
  if (!item) return [];

  const totals = new Map();
  getInventoryStockByLocation(item).forEach((row) => {
    const quantity = Number(row.quantity) || 0;
    if (quantity <= 0) return;
    const store = mapInventoryLocationToStore(row.location) || row.location;
    if (!store) return;
    totals.set(store, (totals.get(store) || 0) + quantity);
  });

  return [
    ...STORE_LOCATION_OPTIONS.filter((store) => totals.has(store)),
    ...[...totals.keys()].filter((store) => !STORE_LOCATION_OPTIONS.includes(store)),
  ].map((location) => ({ location, quantity: totals.get(location) }));
}

export function getRequisitionIssuingStores(requisition) {
  if (!requisition) return [];
  const raw = Array.isArray(requisition.storeLocations) && requisition.storeLocations.length
    ? requisition.storeLocations
    : requisition.storeLocation
      ? [requisition.storeLocation]
      : [];

  const locations = raw
    .flatMap((loc) => String(loc).split("·"))
    .map((loc) => loc.trim())
    .filter(Boolean);

  if (!locations.length) return [];

  return [...new Set(locations)].sort((a, b) => {
    const aIndex = STORE_LOCATION_OPTIONS.indexOf(a);
    const bIndex = STORE_LOCATION_OPTIONS.indexOf(b);
    const aRank = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
    const bRank = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
    if (aRank !== bRank) return aRank - bRank;
    return a.localeCompare(b);
  });
}

export function getRequisitionIssuingStore(requisition) {
  const stores = getRequisitionIssuingStores(requisition);
  return stores.length ? stores.join(" · ") : "—";
}

export function getUniqueIssuingStores(rows = []) {
  return [...new Set(rows.flatMap((row) => getRequisitionIssuingStores(row)))];
}

export function getRequisitionStoreAllocations(requisition) {
  if (!requisition) return [];
  if (Array.isArray(requisition.storeAllocations) && requisition.storeAllocations.length) {
    return requisition.storeAllocations
      .filter((row) => row?.location)
      .map((row) => ({
        location: row.location,
        quantity: row.quantity == null || row.quantity === "" ? null : Number(row.quantity),
        quantityIssued: Number(row.quantityIssued) || 0,
      }));
  }
  return getRequisitionIssuingStores(requisition).map((location) => ({
    location,
    quantity: null,
    quantityIssued: 0,
  }));
}

export function getRequisitionStoreIssueLines(requisition) {
  const allocations = getRequisitionStoreAllocations(requisition);
  const overallRemaining = getRequisitionRemainingQuantity(requisition);
  if (allocations.length === 1 && (allocations[0].quantity == null || allocations[0].quantity === 0)) {
    return [{
      ...allocations[0],
      quantity: overallRemaining,
      remaining: overallRemaining,
    }];
  }
  return allocations.map((row) => {
    const quantity = Number(row.quantity) || 0;
    const quantityIssued = Number(row.quantityIssued) || 0;
    return {
      ...row,
      quantity,
      quantityIssued,
      remaining: Math.max(0, quantity - quantityIssued),
    };
  });
}

export function getStoresWithRemainingQty(requisition) {
  return getRequisitionStoreIssueLines(requisition)
    .filter((row) => row.remaining > 0)
    .map((row) => row.location);
}

export function getStoreIssueRemaining(requisition, location) {
  if (!location) return 0;
  const line = getRequisitionStoreIssueLines(requisition).find((row) => row.location === location);
  return line?.remaining || 0;
}

export function getRequisitionItemState(requisition) {
  if (!requisition?.itemId) return requisition?.isOther ? "Unregistered" : "—";
  const item =
    requisition.kind === "vehicle_parts"
      ? getVehiclePartById(requisition.itemId)
      : getAccessoryById(requisition.itemId);
  if (!item?.status) return "—";
  const options =
    requisition.kind === "vehicle_parts"
      ? VEHICLE_PART_STATUS_OPTIONS
      : ACCESSORY_STATUS_OPTIONS;
  return (
    options.find((option) => option.value === item.status)?.label
    ?? String(item.status)
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

export function getLocationStock(stockLocations, location) {
  return Number(stockLocations.find((row) => row.location === location)?.quantity) || 0;
}

export function sumStoreQuantities(quantitiesByLocation, locations = []) {
  return locations.reduce(
    (sum, location) => sum + (Number(quantitiesByLocation?.[location]) || 0),
    0,
  );
}

export default function RaiseSupplyRequestModal({
  isOpen,
  onClose,
  requisition,
  onSubmit,
}) {
  const [quantityRequested, setQuantityRequested] = useState("");
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [quantitiesByLocation, setQuantitiesByLocation] = useState({});
  const [comment, setComment] = useState("");
  const [customValues, setCustomValues] = useState({});
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const { sections, visibleKeys } = useFormTreeSections(
    RAISE_SUPPLY_REQUEST_FORM_SETUP_CHANGED_EVENT,
    getRaiseSupplyRequestFormSetup,
    getActiveRaiseSupplyRequestFormSections,
  );
  const systemKeys = new Set(RAISE_SUPPLY_REQUEST_FORM_FIELD_CATALOG.map((field) => field.key));

  const stockLocations = useMemo(
    () => getStockLocationsForRequisition(requisition),
    [requisition],
  );

  const locationOptions = useMemo(
    () =>
      stockLocations.map((row) => ({
        value: row.location,
        label: row.location,
        description: `Available Stock: ${row.quantity}`,
      })),
    [stockLocations],
  );

  const totalStock = useMemo(
    () => stockLocations.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0),
    [stockLocations],
  );

  const requested = Number(quantityRequested) || 0;
  const allocated = sumStoreQuantities(quantitiesByLocation, selectedLocations);

  const remaining = getRequisitionRemainingQuantity(requisition);
  const originalRequested = Number(
    requisition?.quantityRequested ?? requisition?.quantity ?? remaining ?? 0,
  ) || 0;
  const alreadySupplied = Number(requisition?.quantitySupplied || 0);
  const isRemainingRaise = alreadySupplied > 0 || (
    remaining > 0 && originalRequested > 0 && remaining < originalRequested
  );

  useEffect(() => {
    if (!isOpen || !requisition) return;
    const remainingQty = getRequisitionRemainingQuantity(requisition);
    const originalQty = Number(
      requisition.quantityRequested ?? requisition.quantity ?? remainingQty ?? 0,
    ) || 0;
    const supplied = Number(requisition.quantitySupplied || 0);
    const remainingFlow = supplied > 0 || (remainingQty > 0 && originalQty > remainingQty);
    setQuantityRequested(String(remainingQty || originalQty || ""));
    if (remainingFlow) {
      setSelectedLocations([]);
      setQuantitiesByLocation({});
    } else {
      const existingAllocations = Array.isArray(requisition.storeAllocations)
        ? requisition.storeAllocations
        : [];
      const locations = existingAllocations.length
        ? existingAllocations.map((row) => row.location)
        : Array.isArray(requisition.storeLocations)
          ? requisition.storeLocations
          : [];
      setSelectedLocations(locations);
      setQuantitiesByLocation(
        Object.fromEntries(
          existingAllocations
            .filter((row) => row.location)
            .map((row) => [row.location, String(row.quantity ?? "")]),
        ),
      );
    }
    setComment(requisition.comment || "");
    setCustomValues({});
    setErrors({});
    setConfirmOpen(false);
    setPendingPayload(null);
  }, [isOpen, requisition]);

  const handleLocationsChange = (locations) => {
    setSelectedLocations(locations);
    setQuantitiesByLocation((current) => {
      const next = {};
      locations.forEach((location) => {
        next[location] = current[location] ?? "";
      });
      return next;
    });
    setErrors((current) => ({
      ...current,
      storeLocations: undefined,
      storeQuantities: undefined,
    }));
  };

  const handleLocationQuantityChange = (location, value) => {
    const stock = getLocationStock(stockLocations, location);
    const others = selectedLocations
      .filter((item) => item !== location)
      .reduce((sum, item) => sum + (Number(quantitiesByLocation[item]) || 0), 0);
    const maxAllowed = Math.min(stock, Math.max(0, requested - others));
    let nextValue = value;
    if (nextValue !== "" && Number(nextValue) > maxAllowed) {
      nextValue = String(maxAllowed);
    }
    setQuantitiesByLocation((current) => ({ ...current, [location]: nextValue }));
    setErrors((current) => ({
      ...current,
      storeLocations: undefined,
      storeQuantities: undefined,
      [`qty-${location}`]: undefined,
    }));
  };

  const handleSubmit = () => {
    const nextErrors = {};
    if (quantityRequested === "" || Number.isNaN(requested) || requested <= 0) {
      if (!isRemainingRaise) nextErrors.quantityRequested = "Enter a valid quantity requested.";
    } else if (isRemainingRaise && requested > remaining) {
      nextErrors.quantityRequested = `Cannot exceed remaining (${remaining}).`;
    }
    if (selectedLocations.length === 0) {
      nextErrors.storeLocations = "Select at least one store.";
    }
    selectedLocations.forEach((location) => {
      const qty = Number(quantitiesByLocation[location]);
      const stock = getLocationStock(stockLocations, location);
      if (quantitiesByLocation[location] === "" || Number.isNaN(qty) || qty <= 0) {
        nextErrors[`qty-${location}`] = "Enter a quantity for this store.";
      } else if (qty > stock) {
        nextErrors[`qty-${location}`] = `Cannot exceed stock (${stock}).`;
      }
    });
    if (isRemainingRaise) {
      if (allocated <= 0) {
        nextErrors.storeQuantities = "Enter the quantity you are supplying now.";
      } else if (allocated > remaining) {
        nextErrors.storeQuantities = `Total cannot exceed remaining (${remaining}).`;
      }
    } else if (allocated > requested) {
      nextErrors.storeQuantities = `Total cannot exceed the requested quantity (${requested}).`;
    } else if (selectedLocations.length > 0 && allocated !== requested) {
      nextErrors.storeQuantities = `Total must equal the requested quantity (${requested}). Currently ${allocated}.`;
    }
    if (visibleKeys.has("comment") && !comment.trim()) nextErrors.comment = "Add a comment.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Fix the highlighted fields before submitting.");
      return;
    }

    const storeAllocations = selectedLocations.map((location) => ({
      location,
      quantity: Number(quantitiesByLocation[location]),
    }));
    const nextRequested = isRemainingRaise ? allocated : requested;
    setPendingPayload({
      quantityRequested: nextRequested,
      storeLocations: selectedLocations,
      storeAllocations,
      actualQuantity: allocated,
      comment: comment.trim(),
    });
    setConfirmOpen(true);
  };

  const finalizeSubmit = () => {
    if (!pendingPayload) return;
    onSubmit?.(pendingPayload);
    setPendingPayload(null);
    setConfirmOpen(false);
  };

  return (
    <>
      <AddModal
        isOpen={isOpen && !confirmOpen}
        onClose={onClose}
        onSave={handleSubmit}
        title="Raise supply request"
        subtitle={
          isRemainingRaise
            ? `Remaining to supply: ${remaining}. Stores and quantities are not locked — pick any stocked store.`
            : "Choose stores and enter how many units come from each. The total must equal the requested quantity."
        }
        dialogClassName="max-w-2xl"
        saveLabel="Submit supply request"
      >
        <div className="space-y-4">
          <RequisitionRequestSummary requisition={requisition} />

          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-3.5 py-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-white text-emerald-600">
                <Boxes size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Available stock
                </p>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-900">
                  Total on hand: {totalStock}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Pick any stocked store{isRemainingRaise ? " — previous stores are not locked" : ""} and enter the quantity from each.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isRemainingRaise ? "Quantity remaining" : "Quantity requested"}
            </p>
            {isRemainingRaise ? (
              <div className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2">
                <p className="text-[13px] font-semibold text-slate-900">{remaining}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Remaining of {originalRequested} requested
                  {alreadySupplied > 0 ? ` · ${alreadySupplied} already supplied` : ""}.
                  Pick any stock and enter the quantity you are supplying now — store and quantity are not locked.
                </p>
              </div>
            ) : (
              <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-[12px] text-slate-700">
                {quantityRequested || "—"}
              </div>
            )}
            {errors.quantityRequested ? (
              <p className="text-[10px] text-rose-600">{errors.quantityRequested}</p>
            ) : null}
          </div>

          {stockLocations.length === 0 ? (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {requiredFieldLabel("Store locations", true)}
              </p>
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-[11px] text-slate-500">
                No stocked locations available for this item.
              </p>
              {errors.storeLocations ? (
                <p className="text-[10px] text-rose-600">{errors.storeLocations}</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              <CheckboxMultiSelect
                id="raiseSupplyStoreLocations"
                label="Store locations"
                required
                placeholder="Select store locations…"
                searchable
                searchPlaceholder="Search store locations…"
                options={locationOptions}
                value={selectedLocations}
                onChange={handleLocationsChange}
                error={errors.storeLocations}
                formatSelectionLabel={(count) =>
                  count === 1 ? "1 location selected" : `${count} locations selected`
                }
              />

              {selectedLocations.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {requiredFieldLabel("Quantity from each store", true)}
                    </p>
                    <p className={`text-[10px] font-bold ${
                      isRemainingRaise
                        ? (allocated > remaining
                          ? "text-rose-600"
                          : allocated > 0
                            ? "text-emerald-600"
                            : "text-slate-500")
                        : allocated === requested && requested > 0
                          ? "text-emerald-600"
                          : allocated > requested
                            ? "text-rose-600"
                            : "text-slate-500"
                    }`}>
                      {isRemainingRaise
                        ? `Supplying ${allocated} of ${remaining} remaining`
                        : `Total ${allocated} / ${requested || "—"}`}
                    </p>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100">
                          <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">Store</th>
                          <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Available</th>
                          <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                            {requiredFieldLabel("Qty from store", true)}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {selectedLocations.map((location) => {
                          const stock = getLocationStock(stockLocations, location);
                          return (
                            <tr key={location}>
                              <td className="px-3 py-2 text-[12px] text-slate-800">{location}</td>
                              <td className="px-3 py-2 text-[12px] font-semibold text-slate-700 whitespace-nowrap">
                                {stock}
                              </td>
                              <td className="px-3 py-2 w-36">
                                <input
                                  type="number"
                                  min="1"
                                  max={stock}
                                  value={quantitiesByLocation[location] ?? ""}
                                  onChange={(e) => handleLocationQuantityChange(location, e.target.value)}
                                  className={`${fieldClassName} bg-white py-1.5 ${
                                    errors[`qty-${location}`] ? "border-rose-400 bg-rose-50" : ""
                                  }`}
                                />
                                {errors[`qty-${location}`] ? (
                                  <p className="text-[10px] text-rose-600 mt-1">{errors[`qty-${location}`]}</p>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {errors.storeQuantities ? (
                    <p className="text-[10px] text-rose-600">{errors.storeQuantities}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      Quantities from selected stores must add up to the requested quantity and cannot go above it.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {visibleKeys.has("comment") ? (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {requiredFieldLabel("Comment", true)}
            </label>
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setErrors((current) => ({ ...current, comment: undefined }));
              }}
              rows={3}
              placeholder="Add a supply request comment…"
              className={fieldClassName}
            />
            {errors.comment ? (
              <p className="text-[10px] text-rose-600">{errors.comment}</p>
            ) : null}
          </div>
          ) : null}
          <ConfiguredCustomFields
            sections={sections}
            systemKeys={systemKeys}
            form={{ ...customValues, comment, storeLocations: selectedLocations }}
            formErrors={errors}
            handleChange={(key) => (event) => {
              const value = event?.target ? event.target.value : event;
              setCustomValues((current) => ({ ...current, [key]: value }));
            }}
            idPrefix="rsq"
          />
        </div>
      </AddModal>

      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setPendingPayload(null);
        }}
        onConfirm={finalizeSubmit}
        className="!z-[10001]"
        title="Submit supply request?"
        message={
          requisition?.requestNumber
            ? `Submit ${requisition.requestNumber} for supply approval?`
            : "Submit this supply request for approval?"
        }
        confirmText="Submit supply request"
      />
    </>
  );
}
