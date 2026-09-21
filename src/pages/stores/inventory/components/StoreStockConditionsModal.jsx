import React, { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import AddModal from "../../../../components/common/AddModal";
import SectionLoadState from "../../../../components/common/SectionLoadState";
import { StoreLocationDisplay } from "../../../../components/common/display/FormattedDisplay";
import { EMPTY_DISPLAY } from "../../../../utils/apiResponseHelpers";
import {
  STOCK_CONDITION_OPTIONS,
  formatStockCondition,
  getStoreItemConditions,
} from "../../../../services/stockConditionsService";

export default function StoreStockConditionsModal({
  isOpen,
  onClose,
  item,
  store,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conditions, setConditions] = useState([]);

  const storeItemId = store?.storeItemId;

  const reload = async () => {
    if (!storeItemId) {
      setConditions([]);
      setError("Missing store item id for this store.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await getStoreItemConditions(storeItemId);
      setConditions(rows);
    } catch (err) {
      setConditions([]);
      setError(err.message || "Unable to load stock conditions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !storeItemId) return;
    reload();
  }, [isOpen, storeItemId]);

  const qtyByCondition = STOCK_CONDITION_OPTIONS.map((option) => {
    const match = conditions.find((row) => row.condition === option.value);
    return {
      condition: option.value,
      label: option.label,
      quantity: match ? Number(match.quantity) || 0 : 0,
    };
  });

  const totalTracked = qtyByCondition.reduce((sum, row) => sum + row.quantity, 0);

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={onClose}
      title="Stock conditions"
      subtitle={
        store
          ? `${item?.itemCode || item?.name || `Item #${item?.id}`} — condition breakdown for this store.`
          : "Condition breakdown for this store."
      }
      saveLabel="Close"
      hideCancelButton
      dialogClassName="max-w-lg"
      overlayClassName="!z-[10002]"
    >
      <SectionLoadState
        loading={loading}
        error={error}
        onRetry={reload}
        loadingLabel="Loading conditions…"
        errorTitle="Couldn't load conditions"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Store
              </p>
              <p className="mt-0.5 text-[13px] font-semibold text-slate-800">
                <StoreLocationDisplay value={store?.name} />
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                On hand
              </p>
              <p className="mt-0.5 text-[14px] font-bold tabular-nums text-slate-900">
                {store?.quantity ?? totalTracked}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Condition
                  </th>
                  <th className="px-4 py-2.5 text-right text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {qtyByCondition.map((row) => (
                  <tr key={row.condition} className="align-middle">
                    <td className="px-4 py-3 text-[13px] font-semibold text-slate-800">
                      <span className="inline-flex items-center gap-1.5">
                        <Layers size={14} className="text-slate-400" />
                        {formatStockCondition(row.condition) || row.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] tabular-nums text-slate-700">
                      {row.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && conditions.length === 0 ? (
            <p className="text-center text-[12px] text-slate-400">
              No condition records for this store yet.
              {store?.quantity != null
                ? ` Store reports ${store.quantity} on hand.`
                : ` ${EMPTY_DISPLAY}`}
            </p>
          ) : null}
        </div>
      </SectionLoadState>
    </AddModal>
  );
}
