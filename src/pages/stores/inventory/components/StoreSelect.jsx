import React, { useEffect, useState } from "react";
import ConfiguredSearchSelectField from "../../../../components/common/fields/ConfiguredSearchSelectField";
import { listStores } from "../../../../services/storesService";
import { formatStoreLocation } from "../../../../utils/displayFormatters";
import { usePermission } from "../../../../hooks/usePermission";
import { ACTIONS, RESOURCES } from "../../../../permissions/accessMap";

export default function StoreSelect({
  id = "store-search",
  value,
  onChange,
  error,
  label = "Store location",
  placeholder = "Search store…",
  required = true,
  /** Optional preloaded/filtered stores; skips fetch when provided. */
  stores: storesProp,
  formKey = "storeId",
  disabled = false,
}) {
  const { can } = usePermission();
  const canReadStores = can(RESOURCES.stores, ACTIONS.read);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(storesProp == null);

  useEffect(() => {
    if (storesProp != null) {
      setStores(storesProp);
      setLoading(false);
      return undefined;
    }

    if (!canReadStores) {
      setStores([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    listStores()
      .then((rows) => {
        if (!cancelled) {
          setStores(rows.filter((store) => store.isActive !== false));
        }
      })
      .catch(() => {
        if (!cancelled) setStores([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [storesProp, canReadStores]);

  const denied = !canReadStores;
  const options = denied
    ? []
    : stores.map((store) => ({
        value: String(store.id),
        label: formatStoreLocation(store.name),
      }));

  return (
    <ConfiguredSearchSelectField
      id={id}
      field={{
        key: formKey,
        title: label,
        placeholder: denied ? "Access denied" : placeholder,
        options,
      }}
      values={{ [formKey]: value == null ? "" : String(value) }}
      error={error}
      loading={loading && !denied}
      disabled={disabled || denied}
      onChange={(_key, next) => {
        if (denied || disabled) return;
        onChange?.(next ?? "");
      }}
      required={required}
    />
  );
}
