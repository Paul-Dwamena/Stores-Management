import React from "react";
import { cn } from "../../../utils/cn";
import { EMPTY_DISPLAY } from "../../../utils/apiResponseHelpers";
import {
  formatItemName,
  formatDescription,
  formatBrand,
  formatUserName,
  formatStoreLocation,
  formatStoreLocationLabel,
  isEmptyDisplayValue,
} from "../../../utils/displayFormatters";

function EmptyDisplay() {
  return <>{EMPTY_DISPLAY}</>;
}

export function ItemNameDisplay({ value, className, ...props }) {
  if (isEmptyDisplayValue(value)) return <EmptyDisplay />;
  return (
    <span className={cn("font-bold uppercase", className)} {...props}>
      {formatItemName(value)}
    </span>
  );
}

export function DescriptionDisplay({ value, className, ...props }) {
  if (isEmptyDisplayValue(value)) return <EmptyDisplay />;
  return (
    <span className={className} {...props}>
      {formatDescription(value)}
    </span>
  );
}

export function BrandDisplay({ value, className, ...props }) {
  if (isEmptyDisplayValue(value)) return <EmptyDisplay />;
  return (
    <span className={cn("uppercase", className)} {...props}>
      {formatBrand(value)}
    </span>
  );
}

export function UserNameDisplay({ value, className, ...props }) {
  if (isEmptyDisplayValue(value)) return <EmptyDisplay />;
  return (
    <span className={className} {...props}>
      {formatUserName(value)}
    </span>
  );
}

export function StoreLocationDisplay({ value, storeCode, className, ...props }) {
  const formatted = storeCode
    ? formatStoreLocationLabel(value, storeCode)
    : formatStoreLocation(value);
  if (formatted === EMPTY_DISPLAY) return <EmptyDisplay />;
  return (
    <span className={cn("uppercase", className)} {...props}>
      {formatted}
    </span>
  );
}
