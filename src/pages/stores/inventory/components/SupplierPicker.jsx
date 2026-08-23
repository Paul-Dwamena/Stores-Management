import React from "react";
import ConfiguredSearchSelectField from "../../../../components/common/fields/ConfiguredSearchSelectField";
import { getActiveSuppliers } from "../../../../mockdata/org";
import { AddSupplierButton } from "./AddSupplierModal";

export default function SupplierPicker({
  value,
  onChange,
  error,
  onAddClick,
  required = true,
  label = "Supplier",
  placeholder = "Search supplier…",
  id = "supplier-search",
}) {
  const options = getActiveSuppliers().map((supplier) => ({
    value: supplier.id,
    label: supplier.name,
  }));

  return (
    <ConfiguredSearchSelectField
      id={id}
      field={{
        key: "supplierId",
        title: label,
        placeholder,
        options,
      }}
      values={{ supplierId: value }}
      error={error}
      onChange={(_key, next) => onChange?.(next ?? "")}
      required={required}
      action={onAddClick ? <AddSupplierButton onClick={onAddClick} /> : null}
    />
  );
}
