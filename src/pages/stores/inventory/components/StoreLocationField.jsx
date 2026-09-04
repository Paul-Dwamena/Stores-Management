import React from "react";
import StoreSelect from "./StoreSelect";

/** @deprecated Prefer importing StoreSelect directly. */
export default function StoreLocationField({
  id = "store-location",
  value,
  onChange,
  error,
  label = "Store location",
  required = true,
}) {
  return (
    <StoreSelect
      id={id}
      value={value}
      onChange={(next) => onChange?.({ target: { value: next } })}
      error={error}
      label={label}
      required={required}
    />
  );
}
