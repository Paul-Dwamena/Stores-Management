import React, { useEffect, useState } from "react";
import { cn } from "../../../../utils/cn";
import { listStores } from "../../../../services/storesService";
import { formatStoreLocation } from "../../../../utils/displayFormatters";

export default function StoreSelect({
  id,
  value,
  onChange,
  error,
  className,
  label = "Store location",
}) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    listStores()
      .then((rows) => {
        if (!cancelled) {
          setStores(rows.filter((store) => store.isActive !== false));
        }
      })
      .catch(() => {
        if (!cancelled) setStores([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-1.5">
      {label ? (
        <label
          htmlFor={id}
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider",
            error ? "text-red-500" : "text-slate-500",
          )}
        >
          {label}
        </label>
      ) : null}
      <select
        id={id}
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={loading}
        className={cn(
          "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] uppercase outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 transition-colors text-slate-700 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed",
          error && "border-red-500 bg-red-50",
          className,
        )}
      >
        <option value="">
          {loading ? "Loading stores…" : "Select store location…"}
        </option>
        {stores.map((store) => (
          <option key={store.id} value={String(store.id)}>
            {formatStoreLocation(store.name)}
          </option>
        ))}
      </select>
      {error ? <p className="text-[10px] font-medium text-red-500">{error}</p> : null}
    </div>
  );
}
