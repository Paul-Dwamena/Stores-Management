import React, { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "../../../../utils/cn";
import { getStoreLocationOptions } from "../../../../mockdata/stores";
import StoreFormModal from "../../../setups/components/StoreFormModal";

const defaultSelectClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 transition-colors text-slate-700";

export default function StoreLocationField({
  id,
  value,
  onChange,
  error,
  label = "Store location",
  required = true,
  selectClassName,
}) {
  const [addOpen, setAddOpen] = useState(false);
  const locations = getStoreLocationOptions();

  const setValue = (next) => {
    onChange?.(next);
  };

  return (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={id}
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              error ? "text-red-500" : "text-slate-500",
            )}
          >
            {label}
            {required ? <span className="normal-case text-red-500"> *</span> : null}
          </label>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
          >
            <Plus size={12} />
            Add store
          </button>
        </div>
        <select
          id={id}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={cn(selectClassName || defaultSelectClassName, error && "border-red-500 bg-red-50")}
        >
          <option value="">Select store location…</option>
          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
        {error ? <p className="text-[10px] font-medium text-red-500">{error}</p> : null}
      </div>
      <StoreFormModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        overlayClassName="!z-[10001]"
        onSaved={(created) => {
          setValue(created?.label || created?.name || "");
        }}
      />
    </>
  );
}
