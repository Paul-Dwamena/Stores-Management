import React, { useEffect, useState } from "react";
import { Pencil, Warehouse } from "lucide-react";
import AddModal from "../../../../components/common/AddModal";
import Button from "../../../../components/common/base/Button";
import InputField from "../../../../components/common/fields/InputField";
import SectionLoadState from "../../../../components/common/SectionLoadState";
import { toast } from "../../../../components/common/ToastNotification";
import { EMPTY_DISPLAY } from "../../../../utils/apiResponseHelpers";
import {
  getItemStoreStock,
  getStoreItemLocation,
  updateStoreItemLocation,
} from "../../../../services/inventoryService";

export default function ItemStoreStockModal({ isOpen, onClose, item }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [stores, setStores] = useState([]);
  const [editing, setEditing] = useState(null);
  const [locationForm, setLocationForm] = useState({ shelf: "", position: "" });
  const [locationLoading, setLocationLoading] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);

  const itemId = item?.id;

  const reload = async () => {
    if (!itemId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getItemStoreStock(itemId);
      setTotalQuantity(data.totalQuantity);
      setStores(data.stores);
    } catch (err) {
      setStores([]);
      setTotalQuantity(0);
      setError(err.message || "Unable to load store stock.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !itemId) return;
    setEditing(null);
    setLocationForm({ shelf: "", position: "" });
    reload();
  }, [isOpen, itemId]);

  const openEditLocation = async (store) => {
    setEditing(store);
    setLocationForm({
      shelf: store.shelf || "",
      position: store.position || "",
    });
    setLocationLoading(true);
    try {
      const location = await getStoreItemLocation(store.id, itemId);
      setLocationForm({
        shelf: location.shelf || "",
        position: location.position || "",
      });
    } catch (err) {
      // Keep values from the store stock row if location fetch fails.
      toast.warning(err.message || "Could not refresh shelf location.");
    } finally {
      setLocationLoading(false);
    }
  };

  const saveLocation = async () => {
    if (!editing?.id || !itemId || savingLocation) return;
    setSavingLocation(true);
    try {
      const saved = await updateStoreItemLocation(editing.id, itemId, locationForm);
      setStores((current) =>
        current.map((row) =>
          row.id === editing.id
            ? {
                ...row,
                shelf: saved.shelf,
                position: saved.position,
                shelfPosition: [saved.shelf, saved.position].filter(Boolean).join(" / "),
              }
            : row,
        ),
      );
      toast.success("Store location updated.");
      setEditing(null);
    } catch (err) {
      toast.error(err.message || "Could not update location.");
    } finally {
      setSavingLocation(false);
    }
  };

  return (
    <>
      <AddModal
        isOpen={isOpen && !editing}
        onClose={onClose}
        onSave={onClose}
        title="Store stock"
        subtitle={
          item
            ? `${item.itemCode || item.name || `Item #${item.id}`} — quantity and shelf location per store.`
            : "Quantity and shelf location per store."
        }
        saveLabel="Close"
        hideCancelButton
        dialogClassName="max-w-3xl"
        overlayClassName="!z-[10001]"
      >
        <SectionLoadState
          loading={loading}
          error={error}
          onRetry={reload}
          loadingLabel="Loading store stock…"
          errorTitle="Couldn't load store stock"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-4 py-3">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-700">
                <Warehouse size={15} className="text-slate-400" />
                Total on hand
              </div>
              <span className="text-[14px] font-bold tabular-nums text-slate-900">
                {totalQuantity}
              </span>
            </div>

            {stores.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-slate-400">
                This item is not stocked in any store yet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Store
                      </th>
                      <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Qty on hand
                      </th>
                      <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Shelf
                      </th>
                      <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Position
                      </th>
                      <th className="px-4 py-2.5 text-right text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Location
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stores.map((store) => (
                      <tr key={store.id} className="align-middle">
                        <td className="px-4 py-3 text-[13px] font-semibold text-slate-800">
                          {store.name || EMPTY_DISPLAY}
                        </td>
                        <td className="px-4 py-3 text-[13px] tabular-nums text-slate-700">
                          {store.quantity ?? 0}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-slate-600">
                          {store.shelf || EMPTY_DISPLAY}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-slate-600">
                          {store.position || EMPTY_DISPLAY}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="border border-slate-200"
                            onClick={() => openEditLocation(store)}
                          >
                            <Pencil size={13} />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </SectionLoadState>
      </AddModal>

      <AddModal
        isOpen={Boolean(editing)}
        onClose={() => !savingLocation && setEditing(null)}
        onSave={saveLocation}
        title="Edit shelf location"
        subtitle={
          editing
            ? `${editing.name} — shelf and position for this item in this store.`
            : "Shelf and position for this store."
        }
        saveLabel={savingLocation ? "Saving…" : "Save location"}
        saveDisabled={savingLocation || locationLoading}
        dialogClassName="max-w-md"
        overlayClassName="!z-[10002]"
      >
        <SectionLoadState
          loading={locationLoading}
          loadingLabel="Loading location…"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              id="store-item-shelf"
              label="Shelf"
              value={locationForm.shelf}
              onChange={(e) =>
                setLocationForm((current) => ({ ...current, shelf: e.target.value }))
              }
              placeholder="e.g. A1"
            />
            <InputField
              id="store-item-position"
              label="Position"
              value={locationForm.position}
              onChange={(e) =>
                setLocationForm((current) => ({ ...current, position: e.target.value }))
              }
              placeholder="e.g. Bin 3"
            />
          </div>
        </SectionLoadState>
      </AddModal>
    </>
  );
}
