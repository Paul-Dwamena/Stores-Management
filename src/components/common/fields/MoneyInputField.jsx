import React, { useState } from "react";
import InputField from "./InputField";
import { formatMoneyAmount, sanitizeMoneyInput } from "../../../utils/displayFormatters";

/**
 * Money input that formats with thousands separators on blur (e.g. 45,584.54).
 * Stores a plain numeric string in form state for API payloads.
 */
export default function MoneyInputField({ value, onChange, onBlur, ...props }) {
  const [focused, setFocused] = useState(false);

  const rawValue = value === "" || value == null ? "" : String(value).replace(/,/g, "");
  const displayValue = focused
    ? rawValue
    : rawValue === ""
      ? ""
      : formatMoneyAmount(rawValue);

  const handleChange = (event) => {
    const next = sanitizeMoneyInput(event.target.value);
    if (next === null) return;
    onChange?.({
      ...event,
      target: { ...event.target, value: next },
    });
  };

  const handleBlur = (event) => {
    setFocused(false);
    onBlur?.(event);
  };

  return (
    <InputField
      {...props}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
    />
  );
}
