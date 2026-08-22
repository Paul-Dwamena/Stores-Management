import React from "react";

/**
 * Field title with a red asterisk when required.
 * Safe to pass as InputField `label` (renders React nodes).
 */
export function requiredFieldLabel(title, required = false) {
  if (!required) return title;
  return (
    <>
      {title}
      <span className="normal-case !text-red-500" aria-hidden="true">
        {" "}
        *
      </span>
    </>
  );
}

export function fieldRequiredLabel(field) {
  return requiredFieldLabel(field?.title ?? "", field?.required === true);
}
