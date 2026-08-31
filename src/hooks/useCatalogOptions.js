import { useEffect, useState } from "react";
import { refreshCatalogOptions } from "../services/catalogOptionsCache";
import { formatBrand } from "../utils/displayFormatters";

function activeNamedOptions(rows = [], { formatLabel } = {}) {
  return rows
    .filter((row) => row.active !== false)
    .map((row) => {
      const name = String(row.name || "").trim();
      if (!name) return null;
      return {
        value: name,
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
          setOptions(activeNamedOptions(rows, { formatLabel: formatBrand }));
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
        if (!cancelled) setOptions(activeNamedOptions(rows));
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
