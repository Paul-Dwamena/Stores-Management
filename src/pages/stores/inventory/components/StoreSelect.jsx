import React, { useEffect, useState } from "react";
import { cn } from "../../../../utils/cn";
import { listStores } from "../../../../services/storesService";

export default function StoreSelect({
  id,
  value,
  onChange,
  error,
  className,
  label = "Store location",
}) {
  const [stores, setStores] = useState([]);

  useEffect(() => {
    let cancelled = false;
    listStores()
      .then((rows) => {
        if (!cancelled) setStores(rows.filter((store) => store.isActive !== false));
      })
      .catch(() => {
        if (!cancelled) setStores([]);
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
        className={cn(
          "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 transition-colors text-slate-700",
          error && "border-red-500 bg-red-50",
          className,
        )}
      >
        <option value="">Select store location…</option>
        {stores.map((store) => (
          <option key={store.id} value={String(store.id)}>
            {store.name}
          </option>
        ))}
      </select>
      {error ? <p className="text-[10px] font-medium text-red-500">{error}</p> : null}
    </div>
  );
}
