import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Boxes, PackagePlus, Search } from "lucide-react";
import AddModal from "../../../../components/common/AddModal";
import SectionLoadState from "../../../../components/common/SectionLoadState";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import Button from "../../../../components/common/base/Button";
import { ConfiguredCustomFields } from "../../../../components/common/ConfiguredFormSections";
import { requiredFieldLabel } from "../../../../components/common/fields/requiredFieldLabel";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
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
  getStoreLocationOptions,
  VEHICLE_PART_STATUS_OPTIONS,
} from "../../../../mockdata/stores";
import RequisitionRequestSummary from "./RequisitionRequestSummary";
import RejectRequisitionModal from "./RejectRequisitionModal";
import {
  DescriptionDisplay,
  ItemNameDisplay,
  StoreLocationDisplay,
} from "../../../../components/common/display/FormattedDisplay";
import { formatStoreLocation } from "../../../../utils/displayFormatters";

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 transition-colors text-slate-700 resize-none";

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

  const catalog = getStoreLocationOptions();
  return [
    ...catalog.filter((store) => totals.has(store)),
    ...[...totals.keys()].filter((store) => !catalog.includes(store)),
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
    const catalog = getStoreLocationOptions();
    const aIndex = catalog.indexOf(a);
    const bIndex = catalog.indexOf(b);
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
        storeId: row.storeId ?? null,
        quantity: row.quantity == null || row.quantity === "" ? null : Number(row.quantity),
        quantityIssued: Number(row.quantityIssued) || 0,
        quantityRejected: Number(row.quantityRejected) || 0,
      }));
  }
  return getRequisitionIssuingStores(requisition).map((location) => ({
    location,
    storeId: null,
    quantity: null,
    quantityIssued: 0,
    quantityRejected: 0,
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
    const quantityRejected = Number(row.quantityRejected) || 0;
    return {
      ...row,
      quantity,
      quantityIssued,
      quantityRejected,
      remaining: Math.max(0, quantity - quantityIssued - quantityRejected),
    };
  });
}

export function getStoresWithRemainingQty(requisition) {
  return getRequisitionStoreIssueLines(requisition)
    .filter((row) => row.remaining > 0)
    .map((row) => row.location);
}

/** Request-stage store allocations for issuance (includes zero stock). */
export function buildIssueStoreOptions(requisition, inventoryItem = null) {
  const allocations = getRequisitionStoreAllocations(requisition);
  if (!allocations.length) return [];

  const stockByStoreId = new Map(
    (inventoryItem?.stores || []).map((store) => [
      Number(store.id),
      Number(store.quantity) || 0,
    ]),
  );
  const stockByName = new Map(
    (inventoryItem?.stores || []).map((store) => [
      store.name,
      Number(store.quantity) || 0,
    ]),
  );

  return allocations.map((allocation) => {
    const storeId = allocation.storeId;
    const name = allocation.location;
    const quantity =
      (storeId != null ? stockByStoreId.get(Number(storeId)) : undefined)
      ?? stockByName.get(name)
      ?? 0;

    return {
      id: storeId,
      name,
      quantity,
      quantityRequested: allocation.quantity,
      quantityIssued: allocation.quantityIssued ?? 0,
    };
  });
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

export function getFilledStoreLocations(quantitiesByLocation, locations = []) {
  return locations.filter((location) => {
    const raw = quantitiesByLocation?.[location];
    const qty = Number(raw);
    return raw !== "" && raw != null && !Number.isNaN(qty) && qty > 0;
  });
}

export default function RaiseSupplyRequestModal({
  isOpen,
  onClose,
  requisition,
  onSubmit,
  onReject,
  storeOptions,
  raiseBlockReason = null,
  onReceiveStock,
  onRegisterItem,
  loading = false,
  saving = false,
  error = null,
  onRetry,
}) {
  const busy = loading || Boolean(error) || saving;
  const isBlocked =
    raiseBlockReason === "unregistered" || raiseBlockReason === "out_of_stock";
  const [quantityRequested, setQuantityRequested] = useState("");
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [quantitiesByLocation, setQuantitiesByLocation] = useState({});
  const [storeSearchQuery, setStoreSearchQuery] = useState("");
  const [comment, setComment] = useState("");
  const [customValues, setCustomValues] = useState({});
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const { sections, visibleKeys } = useFormTreeSections(
    RAISE_SUPPLY_REQUEST_FORM_SETUP_CHANGED_EVENT,
    getRaiseSupplyRequestFormSetup,
    getActiveRaiseSupplyRequestFormSections,
  );
  const systemKeys = new Set(RAISE_SUPPLY_REQUEST_FORM_FIELD_CATALOG.map((field) => field.key));

  const stockLocations = useMemo(() => {
    if (Array.isArray(storeOptions)) {
      return storeOptions.map((store) => ({
        location: String(store.id),
        name: store.name,
        quantity: store.quantity,
        storeId: store.id,
      }));
    }
    return getStockLocationsForRequisition(requisition);
  }, [storeOptions, requisition]);

  const selectedLocationSet = useMemo(
    () => new Set(selectedLocations.map(String)),
    [selectedLocations],
  );

  const filteredStockLocations = useMemo(() => {
    const q = storeSearchQuery.trim().toLowerCase();
    if (!q) return stockLocations;
    return stockLocations.filter((row) => {
      const name = formatStoreLocation(row.name || row.location).toLowerCase();
      const id = String(row.location || "").toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }, [stockLocations, storeSearchQuery]);

  const totalStock = useMemo(
    () =>
      stockLocations.reduce((sum, row) => {
        const qty = Number(row.quantity);
        return Number.isFinite(qty) ? sum + qty : sum;
      }, 0),
    [stockLocations],
  );

  const requested = Number(quantityRequested) || 0;
  const filledStoreLocations = getFilledStoreLocations(quantitiesByLocation, selectedLocations);
  const allocated = sumStoreQuantities(quantitiesByLocation, filledStoreLocations);
  const overSupplyTotal = requested > 0 && allocated > requested;

  const remaining = getRequisitionRemainingQuantity(requisition);
  const originalRequested = Number(
    requisition?.quantityRequested ?? requisition?.quantity ?? remaining ?? 0,
  ) || 0;
  const alreadySupplied = Number(requisition?.quantitySupplied || 0);
  const isRemainingRaise = alreadySupplied > 0 || (
    remaining > 0 && originalRequested > 0 && remaining < originalRequested
  );

  const quantityCap = isRemainingRaise ? remaining : originalRequested;

  useEffect(() => {
    if (!isOpen) {
      setConfirmOpen(false);
      setPendingPayload(null);
      setRejectOpen(false);
      return;
    }
    if (!requisition) return;
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
    setStoreSearchQuery("");
    setErrors({});
    setConfirmOpen(false);
    setRejectOpen(false);
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

  const toggleStoreLocation = (location) => {
    const key = String(location);
    const next = selectedLocationSet.has(key)
      ? selectedLocations.filter((value) => String(value) !== key)
      : [...selectedLocations, key];
    handleLocationsChange(next);
  };

  const handleLocationQuantityChange = (location, value) => {
    setQuantitiesByLocation((current) => ({ ...current, [location]: value }));
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
      nextErrors.quantityRequested = isRemainingRaise
        ? "Enter a valid quantity remaining."
        : "Enter a valid quantity to supply.";
    } else if (quantityCap > 0 && requested > quantityCap) {
      nextErrors.quantityRequested = isRemainingRaise
        ? `Cannot exceed remaining quantity (${quantityCap}).`
        : `Cannot exceed quantity requested (${quantityCap}).`;
    }
    if (selectedLocations.length === 0) {
      nextErrors.storeLocations = "Select at least one store.";
    }
    filledStoreLocations.forEach((location) => {
      const qty = Number(quantitiesByLocation[location]);
      const stockRow = stockLocations.find((row) => row.location === location);
      const stock = stockRow?.quantity;
      if (stock != null && qty > Number(stock)) {
        nextErrors[`qty-${location}`] = `Cannot exceed stock (${stock}).`;
      }
    });
    if (selectedLocations.length > 0 && allocated <= 0) {
      nextErrors.storeQuantities = "Enter a quantity from at least one store.";
    } else if (requested > 0 && allocated > requested) {
      nextErrors.storeQuantities = `Total from stores cannot exceed quantity to supply (${requested}).`;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Fix the highlighted fields before submitting.");
      return;
    }

    const storeAllocations = filledStoreLocations.map((location) => {
      const stockRow = stockLocations.find((row) => row.location === location);
      return {
        location: stockRow?.name || location,
        storeId: stockRow?.storeId ?? Number(location),
        quantity: Number(quantitiesByLocation[location]),
      };
    });
    const nextRequested = requested || allocated;
    setPendingPayload({
      quantityRequested: nextRequested,
      storeLocations: filledStoreLocations,
      storeAllocations,
      actualQuantity: allocated,
      comment: comment.trim(),
    });
    setConfirmOpen(true);
  };

  const finalizeSubmit = () => {
    if (!pendingPayload || saving) return;
    onSubmit?.(pendingPayload);
  };

  return (
    <>
      <AddModal
        isOpen={isOpen && !confirmOpen && !rejectOpen}
        onClose={onClose}
        onSave={isBlocked ? undefined : handleSubmit}
        title="Raise supply request"
        subtitle={
          raiseBlockReason === "unregistered"
            ? "This item must be registered before a supply request can be raised."
            : raiseBlockReason === "out_of_stock"
              ? "Receive stock into a store before raising a supply request."
              : isRemainingRaise
                ? `Remaining to supply: ${remaining}. Stores and quantities are not locked — pick any stocked store.`
                : "Choose stores and enter how many units come from each."
        }
        dialogClassName="max-w-2xl"
        saveLabel="Submit supply request"
        saveDisabled={busy}
        hideSaveButton={isBlocked || busy}
        hideCancelButton
        secondaryAction={{ label: "Cancel", onClick: onClose }}
        footerActions={
          busy ? null : (
            <>
              {onReject ? (
                <Button variant="danger" size="modal" onClick={() => setRejectOpen(true)}>
                  Reject
                </Button>
              ) : null}
              {raiseBlockReason === "unregistered" ? (
                <Button size="modal" onClick={() => onRegisterItem?.()}>
                  <PackagePlus size={16} />
                  Register item
                </Button>
              ) : null}
              {raiseBlockReason === "out_of_stock" ? (
                <Button size="modal" onClick={() => onReceiveStock?.()}>
                  <Boxes size={16} />
                  Receive stock
                </Button>
              ) : null}
            </>
          )
        }
      >
        <SectionLoadState
          loading={loading}
          error={error}
          onRetry={onRetry}
          loadingLabel="Loading request…"
          errorTitle="Couldn’t load this request"
        >
        <div className="space-y-4">
          <RequisitionRequestSummary
            requisition={requisition}
            quantityFields={["requested"]}
          />

          {!busy && raiseBlockReason === "unregistered" ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-amber-900">
                    Unregistered item
                  </p>
                  <p className="mt-0.5 text-[11px] text-amber-800/90">
                    This request line is not linked to a catalog item. Register the item
                    before raising supply.
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 w-36">
                        Item name
                      </th>
                      <td className="px-3 py-2 text-[12px]">
                        <ItemNameDisplay value={requisition?.itemName} className="text-slate-900" />
                      </td>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Description
                      </th>
                      <td className="px-3 py-2 text-[12px] text-slate-700">
                        <DescriptionDisplay value={requisition?.description} />
                      </td>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Quantity Requested
                      </th>
                      <td className="px-3 py-2 text-[12px] font-semibold text-slate-900 tabular-nums">
                        {requisition?.quantityRequested ?? requisition?.quantity ?? "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {!busy && raiseBlockReason === "out_of_stock" ? (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-amber-900">
                  No stock available
                </p>
                <p className="mt-0.5 text-[11px] text-amber-800/90">
                  {requisition?.itemName
                    ? `“${requisition.itemName}” is registered but has no stock in any store.`
                    : "This item is registered but has no stock in any store."}{" "}
                  Receive stock before raising a supply request.
                </p>
              </div>
            </div>
          ) : null}

          {!isBlocked && !busy ? (
          <>
          <div className="rounded-lg border border-[#b7d4c8] bg-success-muted px-3.5 py-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#b7d4c8] bg-white text-success">
                <Boxes size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-success">
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
            <label
              htmlFor="raiseQuantityRequested"
              className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
            >
              {isRemainingRaise ? "Quantity remaining" : "Quantity to Supply"}
            </label>
            {isRemainingRaise ? (
              <p className="text-[10px] text-slate-500">
                Remaining of {originalRequested} requested
                {alreadySupplied > 0 ? ` · ${alreadySupplied} already supplied` : ""}.
              </p>
            ) : null}
            <input
              id="raiseQuantityRequested"
              type="number"
              min="1"
              max={quantityCap > 0 ? quantityCap : undefined}
              value={quantityRequested}
              onChange={(e) => {
                setQuantityRequested(e.target.value);
                setErrors((current) => ({ ...current, quantityRequested: undefined }));
              }}
              className={`${fieldClassName} bg-white ${
                errors.quantityRequested ? "border-rose-400 bg-rose-50" : ""
              }`}
            />
            {!errors.quantityRequested && quantityCap > 0 && !isRemainingRaise ? (
              <p className="text-[10px] text-slate-400">
                Maximum {quantityCap} (quantity requested).
              </p>
            ) : null}
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
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {requiredFieldLabel("Store locations", true)}
                </p>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={storeSearchQuery}
                    onChange={(e) => setStoreSearchQuery(e.target.value)}
                    placeholder="Search store locations…"
                    className={cn(fieldClassName, "pl-8 bg-white")}
                  />
                </div>
                <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-50">
                  {filteredStockLocations.length === 0 ? (
                    <p className="px-3 py-4 text-[12px] text-slate-400">
                      No matching store locations.
                    </p>
                  ) : (
                    filteredStockLocations.map((row) => {
                      const selected = selectedLocationSet.has(String(row.location));
                      return (
                        <label
                          key={row.location}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors",
                            selected ? "bg-slate-50" : "hover:bg-slate-50",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleStoreLocation(row.location)}
                            className="rounded border-slate-300 text-primary focus:ring-slate-900/25 shrink-0"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[12px] font-semibold text-slate-800">
                              <StoreLocationDisplay value={row.name || row.location} />
                            </span>
                            <span className="block text-[11px] text-slate-500 mt-0.5">
                              {row.quantity == null
                                ? "Available Stock : —"
                                : `Available Stock : ${row.quantity}`}
                            </span>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
                {errors.storeLocations ? (
                  <p className="text-[10px] text-rose-600">{errors.storeLocations}</p>
                ) : null}
              </div>

              {selectedLocations.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {requiredFieldLabel("Quantity from each store", true)}
                    </p>
                    <p className={cn(
                      "text-[10px] font-bold",
                      overSupplyTotal || errors.storeQuantities
                        ? "text-rose-600"
                        : allocated > 0
                          ? "text-success"
                          : "text-slate-500",
                    )}>
                      Total {allocated || 0}
                      {requested ? ` of ${requested} to supply` : ""}
                    </p>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100">
                          <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">Store</th>
                          <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Available</th>
                          <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                            Qty from store
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {selectedLocations.map((location) => {
                          const stockRow = stockLocations.find((row) => row.location === location);
                          const stock = stockRow?.quantity;
                          const storeQty = Number(quantitiesByLocation[location]);
                          const storeMax = stock == null ? undefined : Number(stock);
                          return (
                            <tr key={location}>
                              <td className="px-3 py-2 text-[12px] text-slate-800">
                                <StoreLocationDisplay value={stockRow?.name || location} />
                              </td>
                              <td className="px-3 py-2 text-[12px] font-semibold text-slate-700 whitespace-nowrap">
                                {stock == null ? "—" : stock}
                              </td>
                              <td className="px-3 py-2 w-36">
                                <input
                                  type="number"
                                  min="1"
                                  max={storeMax > 0 ? storeMax : undefined}
                                  value={quantitiesByLocation[location] ?? ""}
                                  onChange={(e) => handleLocationQuantityChange(location, e.target.value)}
                                  className={`${fieldClassName} bg-white py-1.5 ${
                                    errors[`qty-${location}`] || (overSupplyTotal && storeQty > 0)
                                      ? "border-rose-400 bg-rose-50"
                                      : ""
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
                  ) : overSupplyTotal ? (
                    <p className="text-[10px] text-rose-600">
                      Total from stores cannot exceed quantity to supply ({requested}).
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      Enter the quantity from each selected store. Total cannot exceed quantity to supply.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {visibleKeys.has("comment") ? (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {requiredFieldLabel("Comment", false)}
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
          </>
          ) : null}
        </div>
        </SectionLoadState>
      </AddModal>

      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => {
          if (saving) return;
          setConfirmOpen(false);
          setPendingPayload(null);
        }}
        onConfirm={finalizeSubmit}
        closeOnConfirm={false}
        confirmLoading={saving}
        className="!z-[10001]"
        title="Submit supply request?"
        message={
          requisition?.requestNumber
            ? `Submit ${requisition.requestNumber} for supply approval?`
            : "Submit this supply request for approval?"
        }
        confirmText={saving ? "Submitting…" : "Submit supply request"}
      />

      <RejectRequisitionModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        requestLabel={requisition?.requestNumber}
        saving={saving}
        onConfirm={(reason) => {
          onReject?.(reason);
        }}
      />
    </>
  );
}
