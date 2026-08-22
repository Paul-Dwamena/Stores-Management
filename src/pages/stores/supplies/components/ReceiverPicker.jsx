import React from "react";
import { Plus } from "lucide-react";
import { requiredFieldLabel } from "../../../../components/common/fields/requiredFieldLabel";
import { cn } from "../../../../utils/cn";
import { getReceivers } from "../../../../mockdata/stores";

export default function ReceiverPicker({
  value,
  onChange,
  error,
  selectClassName,
  onAddClick,
  required = true,
  label = "Person to receive",
  placeholder = "Select receiver",
  addButtonLabel = "Add receiver",
}) {
  const receivers = getReceivers();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {requiredFieldLabel(label, required)}
        </label>
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
        >
          <Plus size={12} />
          {addButtonLabel}
        </button>
      </div>
      <select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className={cn(selectClassName, error && "border-rose-500 bg-rose-50")}
      >
        <option value="">{placeholder}</option>
        {receivers.map((receiver) => (
          <option key={receiver.id} value={receiver.name}>
            {receiver.name} · {receiver.role}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-[10px] text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}
