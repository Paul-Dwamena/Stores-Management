import React from "react";
import ConfiguredSearchSelectField from "../../../../components/common/fields/ConfiguredSearchSelectField";
import { useBrandSelectOptions } from "../../../../hooks/useCatalogOptions";
import { usePermission } from "../../../../hooks/usePermission";
import { ACTIONS, RESOURCES } from "../../../../permissions/accessMap";

export default function BrandSelect({
  id = "brand-search",
  value,
  onChange,
  error,
  label = "Brand",
  placeholder = "Search brand…",
  required = false,
  formKey = "brandId",
  enabled = true,
}) {
  const { can } = usePermission();
  const canRead = can(RESOURCES.brands, ACTIONS.read);
  const denied = !canRead;
  const { options, loading } = useBrandSelectOptions(enabled && canRead);

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
