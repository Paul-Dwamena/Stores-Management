import React, { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import AddModal from "../../../../components/common/AddModal";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import CheckboxMultiSelect from "../../../../components/common/fields/CheckboxMultiSelect";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import { getLocationStock, getStockLocationsForRequisition, sumStoreQuantities } from "./RaiseSupplyRequestModal";

const fieldClassName =
  "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 transition-colors text-slate-700";

function RemoveRowButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
      aria-label={label}
    >
      <Trash2 size={14} />
    </button>
  );
}

export default function BatchRaiseSupplyRequestModal({
  isOpen,
  onClose,
  requisitions = [],
  onSubmit,
}) {
  const items = useMemo(
    () => requisitions.filter((row) => row?.status === "PENDING_SUPPLY_REQUEST"),
    [requisitions],
  );
  const [visibleIds, setVisibleIds] = useState([]);
  const [rowForms, setRowForms] = useState({});
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const stockByRequestId = useMemo(() => {
    const map = {};
    items.forEach((row) => {
      map[row.id] = getStockLocationsForRequisition(row);
    });
    return map;
  }, [items]);

  useEffect(() => {
    if (!isOpen) return;
    setVisibleIds(items.map((row) => row.id));
    setRowForms(
      Object.fromEntries(
        items.map((row) => [
          row.id,
          {
            quantityRequested: String(row.quantityRequested ?? row.quantity ?? ""),
            storeLocations: [],
            quantitiesByLocation: {},
            comment: row.comment || "",
          },
        ]),
      ),
    );
    setErrors({});
    setConfirmOpen(false);
  }, [isOpen, items]);

  const visibleItems = items.filter((row) => visibleIds.includes(row.id));

  const removeRow = (id) => {
    setVisibleIds((current) => current.filter((itemId) => itemId !== id));
    setErrors((current) => {
      const next = { ...current };
      delete next[id];
      delete next.items;
      return next;
    });
  };

  const setRowField = (id, field, value) => {
    setRowForms((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }));
    setErrors((current) => {
      if (!current[id]?.[field]) return current;
      const next = { ...current, [id]: { ...current[id] } };
      delete next[id][field];
      if (Object.keys(next[id]).length === 0) delete next[id];
      return next;
    });
  };

  const setRowLocations = (id, storeLocations) => {
    setRowForms((current) => {
      const form = current[id] || {};
      const quantitiesByLocation = {};
      storeLocations.forEach((location) => {
        quantitiesByLocation[location] = form.quantitiesByLocation?.[location] ?? "";
      });
      return {
        ...current,
        [id]: { ...form, storeLocations, quantitiesByLocation },
      };
    });
    setErrors((current) => {
      if (!current[id]) return current;
      const next = { ...current, [id]: { ...current[id] } };
      delete next[id].storeLocations;
      delete next[id].storeQuantities;
      if (Object.keys(next[id]).length === 0) delete next[id];
      return next;
    });
  };

  const allocatedFor = (id) => {
    const form = rowForms[id] || {};
    return sumStoreQuantities(form.quantitiesByLocation, form.storeLocations || []);
  };

  const totalStockFor = (id) =>
    (stockByRequestId[id] || []).reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);

  const setLocationQuantity = (id, location, value) => {
    setRowForms((current) => {
      const form = current[id] || {};
      const stock = getLocationStock(stockByRequestId[id] || [], location);
      const requested = Number(form.quantityRequested) || 0;
      const others = (form.storeLocations || [])
        .filter((item) => item !== location)
        .reduce((sum, item) => sum + (Number(form.quantitiesByLocation?.[item]) || 0), 0);
      const maxAllowed = Math.min(stock, Math.max(0, requested - others));
      let nextValue = value;
      if (nextValue !== "" && Number(nextValue) > maxAllowed) nextValue = String(maxAllowed);
      return {
        ...current,
        [id]: {
          ...form,
          quantitiesByLocation: {
            ...(form.quantitiesByLocation || {}),
            [location]: nextValue,
          },
        },
      };
    });
    setErrors((current) => {
      if (!current[id]) return current;
      const next = { ...current, [id]: { ...current[id] } };
      delete next[id][`qty-${location}`];
      delete next[id].storeQuantities;
      if (Object.keys(next[id]).length === 0) delete next[id];
      return next;
    });
  };

  const requestSubmit = () => {
    const nextErrors = {};
    if (visibleItems.length === 0) nextErrors.items = "Keep at least one request, or close this window.";
    visibleItems.forEach((row) => {
      const form = rowForms[row.id] || {};
      const rowErrors = {};
      const requested = Number(form.quantityRequested);
      const locations = form.storeLocations || [];
      const allocated = allocatedFor(row.id);
      if (form.quantityRequested === "" || Number.isNaN(requested) || requested <= 0) {
        rowErrors.quantityRequested = "Enter quantity requested.";
      }
      if (!locations.length) {
        rowErrors.storeLocations = "Select location(s).";
      }
      locations.forEach((location) => {
        const qty = Number(form.quantitiesByLocation?.[location]);
        const stock = getLocationStock(stockByRequestId[row.id] || [], location);
        if (form.quantitiesByLocation?.[location] === "" || Number.isNaN(qty) || qty <= 0) {
          rowErrors[`qty-${location}`] = "Enter a quantity.";
        } else if (qty > stock) {
          rowErrors[`qty-${location}`] = `Max ${stock}`;
        }
      });
      if (allocated > requested) {
        rowErrors.storeQuantities = `Cannot exceed requested (${requested}).`;
      } else if (locations.length > 0 && allocated !== requested) {
        rowErrors.storeQuantities = `Must total ${requested}. Now ${allocated}.`;
      }
      if (!form.comment?.trim()) rowErrors.comment = "Add a comment.";
      if (Object.keys(rowErrors).length) nextErrors[row.id] = rowErrors;
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning(nextErrors.items || "Complete the highlighted row details.");
      return;
    }
    setConfirmOpen(true);
  };

  const confirmSubmit = () => {
    onSubmit?.({
      requests: visibleItems.map((row) => {
        const form = rowForms[row.id];
        const storeAllocations = (form.storeLocations || []).map((location) => ({
          location,
          quantity: Number(form.quantitiesByLocation[location]),
        }));
        return {
          id: row.id,
          quantityRequested: Number(form.quantityRequested),
          storeLocations: form.storeLocations,
          storeAllocations,
          actualQuantity: allocatedFor(row.id),
          comment: form.comment.trim(),
        };
      }),
    });
    setConfirmOpen(false);
  };

  return (
    <>
      <AddModal
        isOpen={isOpen && !confirmOpen}
        onClose={onClose}
        onSave={requestSubmit}
        title="Raise supply request"
        subtitle="Choose stores and enter how many units come from each. Remove a row to leave it out. Totals must equal the requested quantity."
        saveLabel={`Submit supply request (${visibleItems.length})`}
        fillViewport
      >
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[1500px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Request</th>
                  <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Item</th>
                  <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Total stock</th>
                  <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Qty requested</th>
                  <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Locations & qty</th>
                  <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Comment</th>
                  <th className="w-12 px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 text-right"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-slate-50/40">
                {visibleItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-[12px] text-slate-400">
                      No requests left in this list. Close and select items again.
                    </td>
                  </tr>
                ) : visibleItems.map((row) => {
                  const locations = stockByRequestId[row.id] || [];
                  const selected = rowForms[row.id]?.storeLocations || [];
                  const requested = Number(rowForms[row.id]?.quantityRequested) || 0;
                  const allocated = allocatedFor(row.id);
                  return (
                    <tr key={row.id}>
                      <td className="px-4 py-3 text-[12px] font-bold text-slate-900">{row.requestNumber}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-700">{row.itemName || row.itemCode}</td>
                      <td className="px-4 py-3 text-[12px] font-semibold text-slate-800">
                        {totalStockFor(row.id)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="min-w-[110px] rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-[12px] text-slate-700">
                          {rowForms[row.id]?.quantityRequested || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="min-w-[320px] space-y-2">
                          {locations.length === 0 ? (
                            <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] text-slate-400">
                              No stocked locations
                            </p>
                          ) : (
                            <CheckboxMultiSelect
                              id={`batchRaiseLocations-${row.id}`}
                              placeholder="Select locations…"
                              searchable
                              searchPlaceholder="Search locations…"
                              options={locations.map((loc) => ({
                                value: loc.location,
                                label: loc.location,
                                description: `Available Stock: ${loc.quantity}`,
                              }))}
                              value={selected}
                              onChange={(storeLocations) => setRowLocations(row.id, storeLocations)}
                              error={errors[row.id]?.storeLocations}
                              formatSelectionLabel={(count) =>
                                count === 1
                                  ? "1 location selected"
                                  : `${count} locations selected`
                              }
                            />
                          )}
                          {selected.length > 0 ? (
                            <div className="space-y-1.5">
                              <p className={`text-[10px] font-bold ${
                                allocated === requested && requested > 0
                                  ? "text-emerald-600"
                                  : allocated > requested
                                    ? "text-rose-600"
                                    : "text-slate-500"
                              }`}>
                                Total {allocated} / {requested || "—"}
                              </p>
                              {selected.map((location) => {
                                const stock = getLocationStock(locations, location);
                                return (
                                  <div key={location} className="flex items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[11px] font-medium text-slate-700 leading-snug">{location}</p>
                                      <p className="text-[10px] text-slate-400">Stock {stock}</p>
                                    </div>
                                    <div className="w-24 shrink-0">
                                      <input
                                        type="number"
                                        min="1"
                                        max={stock}
                                        value={rowForms[row.id]?.quantitiesByLocation?.[location] ?? ""}
                                        onChange={(event) =>
                                          setLocationQuantity(row.id, location, event.target.value)
                                        }
                                        className={cn(
                                          fieldClassName,
                                          "py-1.5",
                                          errors[row.id]?.[`qty-${location}`] && "border-rose-500 bg-rose-50",
                                        )}
                                      />
                                      {errors[row.id]?.[`qty-${location}`] ? (
                                        <p className="mt-0.5 text-[10px] font-medium text-rose-600">
                                          {errors[row.id][`qty-${location}`]}
                                        </p>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })}
                              {errors[row.id]?.storeQuantities ? (
                                <p className="text-[10px] font-medium text-rose-600">
                                  {errors[row.id].storeQuantities}
                                </p>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <textarea
                          rows={2}
                          value={rowForms[row.id]?.comment ?? ""}
                          onChange={(event) =>
                            setRowField(row.id, "comment", event.target.value)
                          }
                          className={cn(
                            fieldClassName,
                            "min-w-[220px] resize-none",
                            errors[row.id]?.comment && "border-rose-500 bg-rose-50",
                          )}
                          placeholder="Supply request comment…"
                        />
                        {errors[row.id]?.comment && (
                          <p className="mt-1 text-[10px] font-medium text-rose-600">
                            {errors[row.id].comment}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <RemoveRowButton
                          onClick={() => removeRow(row.id)}
                          label={`Remove ${row.requestNumber}`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {errors.items && <p className="text-[10px] font-medium text-rose-600">{errors.items}</p>}
        </div>
      </AddModal>

      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmSubmit}
        className="!z-[10001]"
        title="Submit supply requests?"
        message={`Submit ${visibleItems.length} supply request${visibleItems.length === 1 ? "" : "s"} for approval?`}
        confirmText="Submit supply request"
      />
    </>
  );
}
