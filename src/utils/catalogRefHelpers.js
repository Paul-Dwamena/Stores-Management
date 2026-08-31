/** Normalize brand/category from API responses (object, id, or legacy string). */
export function normalizeCatalogRef(value, idFallback = null) {
  if (value == null || value === "") {
    return { id: idFallback ?? null, name: "" };
  }
  if (typeof value === "object") {
    return {
      id: value.id ?? idFallback ?? null,
      name: String(value.name || value.short_name || "").trim(),
    };
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return { id: value, name: "" };
  }
  const text = String(value).trim();
  if (/^\d+$/.test(text)) {
    return { id: Number(text), name: "" };
  }
  return { id: idFallback ?? null, name: text };
}

export function catalogDisplayName(ref) {
  if (ref == null || ref === "") return "";
  if (typeof ref === "object") {
    return String(ref.name || ref.short_name || "").trim();
  }
  return String(ref).trim();
}

export function findCatalogOptionValue(options = [], name = "") {
  const target = String(name || "").trim().toLowerCase();
  if (!target) return "";
  const match = options.find((option) => {
    const label = String(option.label || "").trim().toLowerCase();
    return label === target;
  });
  return match?.value ? String(match.value) : "";
}

export function catalogOptionLabel(options = [], id) {
  if (id == null || id === "") return "";
  const key = String(id);
  return options.find((option) => String(option.value) === key)?.label || "";
}

export function toCatalogId(value) {
  if (value == null || value === "") return null;
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}
