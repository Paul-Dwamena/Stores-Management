import React from "react";
import ConfiguredSearchSelectField from "../../../../components/common/fields/ConfiguredSearchSelectField";
import { useCategorySelectOptions } from "../../../../hooks/useCatalogOptions";
import { usePermission } from "../../../../hooks/usePermission";
import { ACTIONS, RESOURCES } from "../../../../permissions/accessMap";

export default function CategorySelect({
  id = "category-search",
  value,
  onChange,
  error,
  label = "Category",
  placeholder = "Search category…",
  required = false,
  formKey = "categoryId",
  enabled = true,
}) {
  const { can } = usePermission();
  const canRead = can(RESOURCES.categories, ACTIONS.read);
  const denied = !canRead;
  const { options, loading } = useCategorySelectOptions(enabled && canRead);

  return (
    <ConfiguredSearchSelectField
      id={id}
      field={{
        key: formKey,
        title: label,
        placeholder: denied ? "Access denied" : placeholder,
        options: denied ? [] : options,
      }}
      values={{ [formKey]: value == null ? "" : String(value) }}
      error={error}
      loading={loading && !denied}
      disabled={denied}
      onChange={(_key, next) => {
        if (denied) return;
        onChange?.(next ?? "");
      }}
      required={required}
    />
  );
}
