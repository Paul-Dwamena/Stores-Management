import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import AddModal from "../../../components/common/AddModal";
import InputField from "../../../components/common/fields/InputField";
import ConfiguredSearchSelectField from "../../../components/common/fields/ConfiguredSearchSelectField";
import ToggleField from "../../../components/common/fields/ToggleField";
import SectionLoadState from "../../../components/common/SectionLoadState";
import { cn } from "../../../utils/cn";

const selectClass =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-brand transition-colors text-slate-700 appearance-none pr-9";

export default function CatalogFormModal({
  isOpen,
  onClose,
  onSave,
  title,
  subtitle,
  fields,
  initialValues = {},
  saveLabel = "Save",
  overlayClassName,
  dialogClassName = "max-w-lg",
  loading = false,
  error = null,
  onRetry,
}) {
  const [form, setForm] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    // Wait until async edit/detail load finishes so fields populate on first open.
    if (loading) return;
    setForm({ ...initialValues });
    setErrors({});
    setSaving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, loading]);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleSave = async () => {
    const nextErrors = {};
    fields.forEach((field) => {
      if (field.hidden?.(form)) return;
      if (!field.required) return;
      const value = String(form[field.key] ?? "").trim();
      if (!value) nextErrors[field.key] = `${field.label} is required.`;
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    try {
      await onSave?.(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title={title}
      subtitle={subtitle}
      saveLabel={saving ? "Saving…" : saveLabel}
      saveDisabled={saving || loading || Boolean(error)}
      dialogClassName={dialogClassName}
      overlayClassName={overlayClassName}
    >
      <SectionLoadState
        loading={loading}
        error={error}
        onRetry={onRetry}
        loadingLabel="Loading form…"
        errorTitle="Couldn’t load this form"
      >
        <div className={cn("relative min-h-[160px]", saving && "pointer-events-none opacity-60")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((field) => {
              if (field.hidden?.(form)) return null;
              const span = field.span === 2 ? "sm:col-span-2" : "";
              if (field.type === "toggle") {
                const activeValue = field.activeValue ?? true;
                const inactiveValue = field.inactiveValue ?? false;
                const checked = form[field.key] === activeValue || form[field.key] === true;
                return (
                  <div key={field.key} className={span}>
                    <ToggleField
                      label={field.label}
                      description={field.description}
                      checked={checked}
                      onChange={(next) => setField(field.key, next ? activeValue : inactiveValue)}
                    />
                  </div>
                );
              }
              if (field.type === "search-select") {
                return (
                  <ConfiguredSearchSelectField
                    key={field.key}
                    id={field.key}
                    field={{
                      key: field.key,
                      title: field.label,
                      placeholder: field.placeholder,
                      options: field.options,
                    }}
                    values={form}
                    error={errors[field.key]}
                    onChange={(key, value) => setField(key, value)}
                    spanClass={span}
                    required={field.required}
                  />
                );
              }
              if (field.type === "select") {
                return (
                  <div key={field.key} className={cn("space-y-1.5", span)}>
                    <label
                      htmlFor={field.key}
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        errors[field.key] ? "text-red-500" : "text-slate-500",
                      )}
                    >
                      {field.label}
                      {field.required ? <span className="normal-case text-red-500"> *</span> : null}
                    </label>
                    <div className="relative">
                      <select
                        id={field.key}
                        value={form[field.key] ?? ""}
                        onChange={(e) => setField(field.key, e.target.value)}
                        className={cn(selectClass, errors[field.key] && "border-red-500 bg-red-50")}
                      >
                        <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
                        {(field.options || []).map((option) => (
                          <option key={option.value ?? option} value={option.value ?? option}>
                            {option.label ?? option}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                    </div>
                    {errors[field.key] ? (
                      <p className="text-[10px] font-medium text-red-500">{errors[field.key]}</p>
                    ) : null}
                  </div>
                );
              }
              return (
                <div key={field.key} className={span}>
                  <InputField
                    id={field.key}
                    label={field.label}
                    required={field.required}
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    value={form[field.key] ?? ""}
                    onChange={(e) => setField(field.key, e.target.value)}
                    error={errors[field.key]}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </SectionLoadState>
    </AddModal>
  );
}
