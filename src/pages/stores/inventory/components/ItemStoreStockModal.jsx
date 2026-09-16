import React, { useEffect, useState } from "react";
import { Warehouse } from "lucide-react";
import AddModal from "../../../../components/common/AddModal";
import SectionLoadState from "../../../../components/common/SectionLoadState";
import { StoreLocationDisplay } from "../../../../components/common/display/FormattedDisplay";
import { getItemStoreStock } from "../../../../services/inventoryService";

export default function ItemStoreStockModal({ isOpen, onClose, item }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [stores, setStores] = useState([]);

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
    reload();
  }, [isOpen, itemId]);

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={onClose}
      title="Store stock"
      subtitle={
        item
          ? `${item.itemCode || item.name || `Item #${item.id}`} — quantity on hand per store.`
          : "Quantity on hand per store."
      }
      saveLabel="Close"
      hideCancelButton
      dialogClassName="max-w-2xl"
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
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Store
                    </th>
                    <th className="px-4 py-2.5 text-right text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Qty on hand
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stores.map((store) => (
                    <tr key={store.id} className="align-middle">
                      <td className="px-4 py-3 text-[13px] font-semibold text-slate-800">
                        <StoreLocationDisplay value={store.name} />
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] tabular-nums text-slate-700">
                        {store.quantity ?? 0}
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
  );
}
