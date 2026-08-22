import React, { useState } from "react";
import { cn } from "../../../../utils/cn";
import InputField from "../../../../components/common/fields/InputField";
import { fieldRequiredLabel } from "../../../../components/common/fields/requiredFieldLabel";
import FormOthersBlock from "../../../../components/common/FormOthersBlock";
import CollapsibleFormSection from "../../../../components/common/CollapsibleFormSection";
import { renderCanonicalConfiguredField } from "../../../../components/common/fields/canonicalConfiguredField";
import { ADD_RECEIVER_FORM_FIELD_CATALOG } from "../../../../mockdata/setups";
import { RECEIVER_ROLE_OPTIONS } from "../../../../mockdata/stores";

const SYSTEM_KEYS = new Set(ADD_RECEIVER_FORM_FIELD_CATALOG.map((field) => field.key));

const selectClass =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 text-slate-700";

function sectionGridClass(section, fallback = 1) {
  const cols = Math.min(Math.max(section?.columns ?? fallback, 1), 4);
  return cn(
    "grid grid-cols-1 gap-4",
    cols >= 4 && "sm:grid-cols-4",
    cols === 3 && "sm:grid-cols-3",
    cols === 2 && "sm:grid-cols-2",
  );
}

function fieldSpanClass(field, sectionColumns = 1) {
  const span = Math.min(Math.max(field?.colSpan ?? 1, 1), sectionColumns);
  if (sectionColumns <= 1 || span >= sectionColumns) {
    return sectionColumns >= 4
      ? "sm:col-span-4"
      : sectionColumns === 3
        ? "sm:col-span-3"
        : sectionColumns === 2
          ? "sm:col-span-2"
          : undefined;
  }
  return "sm:col-span-1";
}

function optionRows(options = []) {
  const rows = (options ?? []).map((option) =>
    typeof option === "string"
      ? { value: option, label: option }
      : { value: option.value, label: option.label ?? option.value },
  );
  if (rows.length) return rows;
  return RECEIVER_ROLE_OPTIONS.map((role) => ({ value: role, label: role }));
}

export default function AddReceiverConfiguredFields({
  sections = [],
  form,
  formErrors = {},
  handleChange,
}) {
  const orderedSections = sections.filter((section) => {
    if (section.id === "others") return Boolean(section.fields?.length);
    return true;
  });
  const [openExtraSections, setOpenExtraSections] = useState({});

  const renderCustomField = (field, sectionColumns = 1) =>
    renderCanonicalConfiguredField({
      field,
      id: `arf-field-${field.id}`,
      values: form,
      errors: formErrors,
      onChange: handleChange,
      spanClass: fieldSpanClass(field, sectionColumns),
      label: fieldRequiredLabel(field),
    });

  const renderSystemField = (field, columns) => {
    const spanClass = fieldSpanClass(field, columns);
    const id = `arf-field-${field.id}`;

    if (field.key === "role") {
      return (
        <div key={field.id} className={cn("space-y-1.5", spanClass)}>
          <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {fieldRequiredLabel(field)}
          </label>
          <select
            id={id}
            value={form.role ?? ""}
            onChange={handleChange("role")}
            className={cn(selectClass, formErrors.role && "border-rose-500 bg-rose-50")}
          >
            <option value="">{field.placeholder || "Select role"}</option>
            {optionRows(field.options).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {formErrors.role ? (
            <p className="text-[10px] font-medium text-rose-600">{formErrors.role}</p>
          ) : null}
        </div>
      );
    }

    return (
      <div key={field.id} className={spanClass}>
        <InputField
          id={id}
          type={field.key === "email" ? "email" : "text"}
          label={field.title}
          required={field.required === true}
          value={form[field.key] ?? ""}
          onChange={handleChange(field.key)}
          placeholder={field.placeholder}
          error={formErrors[field.key]}
        />
      </div>
    );
  };

  const renderMainFormSection = (section) => {
    const columns = section.columns ?? 1;
    const systemFields = (section.fields || []).filter((field) => SYSTEM_KEYS.has(field.key));
    const customFields = (section.fields || []).filter((field) => !SYSTEM_KEYS.has(field.key));
    return (
      <section key={section.id} className="space-y-4">
        <div className={sectionGridClass(section, 1)}>
          {systemFields.map((field) => renderSystemField(field, columns))}
        </div>
        {customFields.length ? (
          <FormOthersBlock>
            <div className={sectionGridClass(section, 1)}>
              {customFields.map((field) => renderCustomField(field, columns))}
            </div>
          </FormOthersBlock>
        ) : null}
      </section>
    );
  };

  const renderSection = (section) => {
    if (section.id === "main_form") return renderMainFormSection(section);
    if (!section.fields?.length) return null;
    const extraOpen = openExtraSections[section.id] !== false;
    return (
      <CollapsibleFormSection
        key={section.id}
        title={section.label}
        description={section.description}
        open={extraOpen}
        onToggle={() =>
          setOpenExtraSections((current) => ({ ...current, [section.id]: !extraOpen }))
        }
      >
        <div className={sectionGridClass(section, 1)}>
          {section.fields.map((field) => renderCustomField(field, section.columns ?? 1))}
        </div>
      </CollapsibleFormSection>
    );
  };

  return (
    <div className="space-y-4">
      {orderedSections.map((section) => renderSection(section))}
    </div>
  );
}

export { SYSTEM_KEYS as ADD_RECEIVER_FORM_SYSTEM_KEYS };
