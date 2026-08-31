import { useEffect, useState } from "react";
import { refreshCatalogOptions } from "../services/catalogOptionsCache";
import { formatBrand } from "../utils/displayFormatters";

function activeCatalogOptions(rows = [], { formatLabel } = {}) {
  return rows
    .filter((row) => row.active !== false)
    .map((row) => {
      const id = row.id;
      const name = String(row.name || "").trim();
      if (id == null || !name) return null;
      return {
        value: String(id),
        label: formatLabel ? formatLabel(name) : name,
      };
    })
    .filter(Boolean);
}

function useCatalogSelectOptions(optionId, enabled = true, { formatLabel } = {}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));

  useEffect(() => {
    if (!enabled) {
      setOptions([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    refreshCatalogOptions(optionId)
      .then((rows) => {
        if (!cancelled) {
          setOptions(activeCatalogOptions(rows, { formatLabel }));
        }
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, optionId, formatLabel]);

  return { options, loading };
}

export function useBrandSelectOptions(enabled = true) {
  return useCatalogSelectOptions("brands", enabled, { formatLabel: formatBrand });
}

export function useCategorySelectOptions(enabled = true) {
  return useCatalogSelectOptions("item-categories", enabled);
}
