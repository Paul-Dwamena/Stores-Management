import React from "react";
import { Check } from "lucide-react";
import { cn } from "../../../utils/cn";

export default function ChoiceOption({
  type = "checkbox",
  id,
  name,
  value,
  checked,
  label,
  onChange,
  bordered = true,
  className,
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "relative flex cursor-pointer items-start gap-2.5 transition-colors",
        bordered
          ? cn(
              "rounded-md border px-3 py-2.5",
              checked
                ? "border-slate-300 bg-slate-50"
                : "border-slate-200 hover:bg-slate-50/80",
            )
          : "py-0.5",
        className,
      )}
    >
      {type === "radio" ? (
        <span
          className={cn(
            "mt-0.5 flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-full border transition-colors",
            checked ? "border-brand bg-brand" : "border-slate-300 bg-white",
          )}
        >
          <span className={cn("size-1.5 rounded-full", checked ? "bg-white" : "bg-transparent")} />
        </span>
      ) : (
        <span
          className={cn(
            "mt-0.5 flex size-4 shrink-0 items-center justify-center overflow-hidden rounded border transition-colors",
            checked
              ? "border-brand bg-brand text-white"
              : "border-slate-300 bg-white text-transparent",
          )}
        >
          <Check size={10} strokeWidth={3} className="block" />
        </span>
      )}
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className="text-[12px] font-medium text-slate-700">{label}</span>
    </label>
  );
}
