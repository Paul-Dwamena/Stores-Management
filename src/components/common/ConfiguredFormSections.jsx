import React, { useState } from "react";
import { cn } from "../../utils/cn";
import FormOthersBlock from "./FormOthersBlock";
import CollapsibleFormSection from "./CollapsibleFormSection";
import { fieldRequiredLabel } from "./fields/requiredFieldLabel";
import { renderCanonicalConfiguredField } from "./fields/canonicalConfiguredField";

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
  const parentColumns = Math.min(Math.max(field?.groupColumns ?? sectionColumns ?? 1, 1), 4);
  const span = Math.min(Math.max(field?.colSpan ?? 1, 1), parentColumns);
  if (parentColumns <= 1) return undefined;
  if (span >= parentColumns) {
    return parentColumns >= 4
      ? "sm:col-span-4"
      : parentColumns === 3
        ? "sm:col-span-3"
        : "sm:col-span-2";
  }
  return "sm:col-span-1";
}

export function ShowConfiguredField({ visibleKeys, fieldKey, children }) {
  if (visibleKeys && fieldKey && !visibleKeys.has(fieldKey)) return null;
  return children;
}

export function flattenConfiguredFields(sections = []) {
  return sections.flatMap((section) => section.fields || []);
}

export function configuredFieldIsVisible(sections = [], key) {
  return flattenConfiguredFields(sections).some((field) => field.key === key);
}

/**
 * Renders Forms & Templates sections. System keys use `renderSystemField`;
 * other leaves go through the canonical field renderer under Others.
 */
export default function ConfiguredFormSections({
  sections = [],
  form,
  formErrors = {},
  handleChange,
  systemKeys,
  renderSystemField,
  idPrefix = "cfg",
  fallbackColumns = 1,
}) {
  const keys = systemKeys instanceof Set ? systemKeys : new Set(systemKeys || []);
  const orderedSections = sections.filter((section) => {
    if (section.id === "others") return Boolean(section.fields?.length);
    return true;
  });
  const [openExtraSections, setOpenExtraSections] = useState({});

  const renderCustomField = (field, sectionColumns = fallbackColumns) =>
    renderCanonicalConfiguredField({
      field,
      id: `${idPrefix}-field-${field.id}`,
      values: form,
      errors: formErrors,
      onChange: handleChange,
      spanClass: fieldSpanClass(field, sectionColumns),
      label: fieldRequiredLabel(field),
    });

  const renderField = (field, columns) => {
    if (keys.has(field.key)) {
      const rendered = renderSystemField?.(field, columns);
      if (rendered == null) return null;
      return (
        <div key={field.id} className={fieldSpanClass(field, columns)}>
          {rendered}
        </div>
      );
    }
    return renderCustomField(field, columns);
  };

  const renderMainFormSection = (section) => {
    const columns = section.columns ?? fallbackColumns;
    const systemFields = (section.fields || []).filter((field) => keys.has(field.key));
    const customFields = (section.fields || []).filter((field) => !keys.has(field.key));
    return (
      <section key={section.id} className="space-y-4">
        <div className={sectionGridClass(section, fallbackColumns)}>
          {systemFields.map((field) => renderField(field, columns))}
        </div>
        {customFields.length ? (
          <FormOthersBlock>
            <div className={sectionGridClass(section, fallbackColumns)}>
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
        <div className={sectionGridClass(section, fallbackColumns)}>
          {section.fields.map((field) => renderField(field, section.columns ?? fallbackColumns))}
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

export function ConfiguredCustomFields({
  sections = [],
  systemKeys,
  form,
  formErrors,
  handleChange,
  idPrefix = "cfg",
  fallbackColumns = 1,
}) {
  const keys = systemKeys instanceof Set ? systemKeys : new Set(systemKeys || []);
  const customSections = sections
    .map((section) => ({
      ...section,
      fields: (section.fields || []).filter((field) => field.key && !keys.has(field.key)),
    }))
    .filter((section) => section.fields.length);
  if (!customSections.length) return null;
  return (
    <ConfiguredFormSections
      sections={customSections}
      form={form}
      formErrors={formErrors}
      handleChange={handleChange}
      systemKeys={new Set()}
      idPrefix={idPrefix}
      fallbackColumns={fallbackColumns}
    />
  );
}
