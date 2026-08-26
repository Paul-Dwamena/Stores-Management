import React, { useEffect, useState } from "react";
import ConfiguredSearchSelectField from "../../../../components/common/fields/ConfiguredSearchSelectField";
import { listSuppliers } from "../../../../services/suppliersService";
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
  reloadToken = 0,
}) {
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    let cancelled = false;
    listSuppliers()
      .then((rows) => {
        if (!cancelled) setSuppliers(rows.filter((row) => row.isActive !== false));
      })
      .catch(() => {
        if (!cancelled) setSuppliers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const options = suppliers.map((supplier) => ({
    value: String(supplier.id),
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
      values={{ supplierId: value == null ? "" : String(value) }}
      error={error}
      onChange={(_key, next) => {
        const match = suppliers.find((row) => String(row.id) === String(next));
        onChange?.(next ?? "", match || null);
      }}
      required={required}
      action={onAddClick ? <AddSupplierButton onClick={onAddClick} /> : null}
    />
  );
}
