import React, { useEffect, useState } from "react";
import ConfiguredSearchSelectField from "../../../../components/common/fields/ConfiguredSearchSelectField";
import { listSuppliers } from "../../../../services/suppliersService";
import { AddSupplierButton } from "./AddSupplierModal";
import { usePermission } from "../../../../hooks/usePermission";
import { ACTIONS, RESOURCES } from "../../../../permissions/accessMap";

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
  const { can } = usePermission();
  const canReadSuppliers = can(RESOURCES.suppliers, ACTIONS.read);
  const canCreateSuppliers = can(RESOURCES.suppliers, ACTIONS.create);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canReadSuppliers) {
      setSuppliers([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    listSuppliers()
      .then((rows) => {
        if (!cancelled) {
          setSuppliers(rows.filter((row) => row.isActive !== false));
        }
      })
      .catch(() => {
        if (!cancelled) setSuppliers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken, canReadSuppliers]);

  const denied = !canReadSuppliers;
  const options = denied
    ? []
    : suppliers.map((supplier) => ({
        value: String(supplier.id),
        label: supplier.name,
      }));

  return (
    <ConfiguredSearchSelectField
      id={id}
      field={{
        key: "supplierId",
        title: label,
        placeholder: denied ? "Access denied" : placeholder,
        options,
      }}
      values={{ supplierId: value == null ? "" : String(value) }}
      error={error}
      loading={loading && !denied}
      disabled={denied}
      onChange={(_key, next) => {
        if (denied) return;
        const match = suppliers.find((row) => String(row.id) === String(next));
        onChange?.(next ?? "", match || null);
      }}
      required={required}
      action={
        !denied && canCreateSuppliers && onAddClick
          ? <AddSupplierButton onClick={onAddClick} />
          : null
      }
    />
  );
}
