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

export function useBrandSelectOptions(enabled = true) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;

    refreshCatalogOptions("brands")
      .then((rows) => {
        if (!cancelled) {
          setOptions(activeCatalogOptions(rows, { formatLabel: formatBrand }));
        }
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return options;
}

export function useCategorySelectOptions(enabled = true) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;

    refreshCatalogOptions("item-categories")
      .then((rows) => {
        if (!cancelled) {
          setOptions(activeCatalogOptions(rows));
        }
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return options;
}
