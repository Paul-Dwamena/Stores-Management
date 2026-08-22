import React from "react";
import { MapPin } from "lucide-react";
import { cn } from "../../../utils/cn";

export function locationLatKey(key) {
  return `${key}Lat`;
}

export function locationLngKey(key) {
  return `${key}Lng`;
}

export function emitConfiguredValue(onChange, key, value) {
  if (typeof onChange !== "function") return;
  const maybe = onChange(key, value);
  if (typeof maybe === "function") {
    maybe({ target: { value } });
  }
}

const LocationField = ({
  label,
  id,
  value,
  onChange,
  placeholder = "Enter location",
  required = false,
  error,
}) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-wider text-subtle">
          {label}
          {required ? " *" : ""}
        </label>
      )}
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
        <input
          id={id}
          type="text"
          value={value ?? ""}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-[12px] outline-none focus:border-brand focus:bg-surface transition-colors text-text",
            error ? "border-danger" : "border-border",
          )}
        />
      </div>
      {error && <p className="text-[10px] font-medium text-danger">{error}</p>}
    </div>
  );
};

export default LocationField;

export function ConfiguredLocationField({
  field,
  id,
  values = {},
  error,
  onChange,
  spanClass,
  required = false,
}) {
  const formKey = field.formKey || field.key;
  const value = values[formKey];
  return (
    <div className={cn(spanClass, "col-span-full")}>
      <LocationField
        label={field.title}
        id={id}
        value={typeof value === "string" ? value : ""}
        onChange={(next) => emitConfiguredValue(onChange, formKey, next)}
        placeholder={field.placeholder || undefined}
        required={required === true}
        error={error}
      />
    </div>
  );
}
