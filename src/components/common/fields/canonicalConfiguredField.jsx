import React, { useRef, useState } from "react";
import { ChevronDown, FileText, Trash2, UploadCloud } from "lucide-react";
import { cn } from "../../../utils/cn";
import InputField from "./InputField";
import ChoiceOption from "./ChoiceOption";
import { ConfiguredLocationField } from "./LocationField";
import ConfiguredSearchSelectField from "./ConfiguredSearchSelectField";
import {
  FILE_ACCEPT_TYPE_OPTIONS,
  fileAcceptAttr,
  normalizeAcceptedFileTypes,
} from "../../../mockdata/setups";

const selectClass =
  "w-full appearance-none cursor-pointer px-3 py-2 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 focus:bg-white transition-colors text-slate-700 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed";
const textareaClass =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 focus:bg-white transition-colors text-slate-700 resize-y";

function SelectControl({ className, children, ...props }) {
  return (
    <div className="relative">
      <select {...props} className={cn(selectClass, className)}>
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

function optionRows(options = []) {
  return (options ?? []).map((option) =>
    typeof option === "string"
      ? { value: option, label: option }
      : { value: option.value, label: option.label ?? option.value },
  );
}

function fileDisplayName(value) {
  if (value instanceof File) return value.name;
  if (typeof value === "string" && value.trim()) return value.trim();
  return "";
}

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileAcceptHint(types) {
  const normalized = normalizeAcceptedFileTypes(types);
  return FILE_ACCEPT_TYPE_OPTIONS
    .filter((option) => normalized.includes(option.value))
    .map((option) => option.hint)
    .join(", ");
}

export function isUploadFileField(field) {
  return field?.fieldType === "file" || field?.fieldType === "image";
}

export function isFileFilled(value) {
  if (value instanceof File) return true;
  return Boolean(String(value ?? "").trim());
}

export function emptyCanonicalFieldValue(field) {
  if (field?.fieldType === "checklist") return [];
  if (field?.fieldType === "checkbox") return field.defaultValue === true;
  if (isUploadFileField(field)) return null;
  if (field?.fieldType === "location") return "";
  if (field?.defaultValue !== undefined && field.defaultValue !== null && field.defaultValue !== "") {
    return field.defaultValue;
  }
  return "";
}

export function FileDropzone({ field, value, error, onChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const fileName = fileDisplayName(value);
  const hint = field.description?.trim() || fileAcceptHint(field.acceptedFileTypes);
  const setFile = (file) => onChange(field.key)({ target: { value: file || null } });

  return (
    <div className="space-y-1.5">
      <div
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const dropped = e.dataTransfer.files[0];
          if (dropped) setFile(dropped);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
          dragging
            ? "border-primary bg-slate-50"
            : error
              ? "border-red-300 bg-red-50/40"
              : "border-slate-200 hover:border-primary hover:bg-slate-50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={fileAcceptAttr(field.acceptedFileTypes)}
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) setFile(selected);
          }}
        />
        <UploadCloud
          size={28}
          className={cn(dragging ? "text-primary" : "text-slate-300")}
        />
        {fileName ? (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full max-w-sm">
            <FileText size={14} className="text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-800 truncate">{fileName}</p>
              {value.size ? (
                <p className="text-[10px] text-slate-500">{formatBytes(value.size)}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="p-1 text-slate-400 hover:text-rose-500"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ) : (
          <>
            <p className="text-[12px] font-semibold text-slate-600">
              Drag & drop or <span className="text-primary">browse</span>
            </p>
            <p className="text-[10px] text-slate-400">{hint}</p>
          </>
        )}
      </div>
      {error ? <p className="text-[10px] font-medium text-red-500">{error}</p> : null}
    </div>
  );
}

export function renderCanonicalConfiguredField({
  field,
  id,
  values = {},
  errors = {},
  onChange,
  spanClass,
  label,
}) {
  const formKey = field.key;
  const value = values[formKey] ?? (
    field.fieldType === "checkbox"
      ? false
      : field.fieldType === "checklist"
        ? []
        : isUploadFileField(field)
          ? null
          : ""
  );
  const error = errors[formKey];

  if (field.fieldType === "search_select") {
    return (
      <ConfiguredSearchSelectField
        key={field.id}
        field={field}
        id={id}
        values={values}
        error={error}
        onChange={onChange}
        spanClass={spanClass}
        required={field.required === true}
      />
    );
  }

  if (field.fieldType === "location") {
    return (
      <ConfiguredLocationField
        key={field.id}
        field={field}
        id={id}
        values={values}
        error={error}
        onChange={onChange}
        spanClass={spanClass}
        required={field.required === true}
      />
    );
  }

  if (isUploadFileField(field)) {
    return (
      <div key={field.id} className={cn(spanClass, "space-y-1.5")}>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <FileDropzone field={field} value={value} error={error} onChange={onChange} />
      </div>
    );
  }

  if (field.fieldType === "select") {
    const rows = optionRows(field.options);
    return (
      <div key={field.id} className={cn("space-y-1.5", spanClass)}>
        <label htmlFor={id} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
        <SelectControl
          id={id}
          value={value}
          onChange={onChange(formKey)}
          className={error ? "border-red-500 bg-red-50" : undefined}
        >
          {field.placeholder || !value ? (
            <option value="">{field.placeholder?.trim() || "Select…"}</option>
          ) : null}
          {rows.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectControl>
        {error ? <p className="text-[10px] font-medium text-red-500">{error}</p> : null}
      </div>
    );
  }

  if (field.fieldType === "radio") {
    return (
      <div key={field.id} className={cn("space-y-1.5", spanClass)}>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        {field.description?.trim() ? (
          <p className="text-[11px] text-slate-500 leading-snug">{field.description.trim()}</p>
        ) : null}
        <div role="radiogroup" aria-label={field.title} className="space-y-2">
          {optionRows(field.options).map((option) => {
            const optionId = `${id}-${option.value}`;
            return (
              <ChoiceOption
                key={option.value}
                type="radio"
                id={optionId}
                name={id}
                value={option.value}
                label={option.label}
                checked={String(value) === String(option.value)}
                onChange={() => onChange(formKey)({ target: { value: option.value } })}
              />
            );
          })}
        </div>
        {error ? <p className="text-[10px] font-medium text-red-500">{error}</p> : null}
      </div>
    );
  }

  if (field.fieldType === "checklist") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div key={field.id} className={cn("space-y-1.5", spanClass)}>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        {field.description?.trim() ? (
          <p className="text-[11px] text-slate-500 leading-snug">{field.description.trim()}</p>
        ) : null}
        <div className="space-y-2">
          {optionRows(field.options).map((option) => {
            const optionId = `${id}-${option.value}`;
            const checked = selected.includes(option.value);
            return (
              <ChoiceOption
                key={option.value}
                type="checkbox"
                id={optionId}
                name={id}
                value={option.value}
                label={option.label}
                checked={checked}
                onChange={() => {
                  const next = checked
                    ? selected.filter((item) => item !== option.value)
                    : [...selected, option.value];
                  onChange(formKey)({ target: { value: next } });
                }}
              />
            );
          })}
        </div>
        {error ? <p className="text-[10px] font-medium text-red-500">{error}</p> : null}
      </div>
    );
  }

  if (field.fieldType === "textarea") {
    return (
      <div key={field.id} className={cn("space-y-1.5", spanClass)}>
        <label htmlFor={id} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
        <textarea
          id={id}
          rows={2}
          value={value}
          onChange={onChange(formKey)}
          placeholder={field.placeholder || undefined}
          className={cn(textareaClass, error && "border-red-500 bg-red-50")}
        />
        {error ? <p className="text-[10px] font-medium text-red-500">{error}</p> : null}
      </div>
    );
  }

  if (field.fieldType === "checkbox") {
    return (
      <div key={field.id} className={cn("space-y-1", spanClass)}>
        {field.description?.trim() ? (
          <p className="text-[11px] text-slate-500 leading-snug">{field.description.trim()}</p>
        ) : null}
        <ChoiceOption
          type="checkbox"
          id={id}
          name={id}
          value="true"
          label={label}
          checked={Boolean(value)}
          bordered={false}
          onChange={(e) => onChange(formKey)({ target: { value: e.target.checked } })}
        />
        {error ? <p className="text-[10px] font-medium text-red-500">{error}</p> : null}
      </div>
    );
  }

  return (
    <div key={field.id} className={spanClass}>
      <InputField
        label={label}
        id={id}
        type={field.fieldType === "number" || field.fieldType === "date" ? field.fieldType : "text"}
        value={value ?? ""}
        onChange={onChange(formKey)}
        placeholder={field.placeholder || undefined}
        error={error}
      />
    </div>
  );
}

export function collectCanonicalFieldErrors(fields = [], values = {}, systemKeys = new Set()) {
  const errors = {};
  fields.forEach((field) => {
    if (!field?.key || systemKeys.has(field.key)) return;
    if (field.required !== true) return;
    if (field.fieldType === "checkbox") return;
    const value = values[field.key];
    if (field.fieldType === "checklist") {
      if (!Array.isArray(value) || value.length === 0) {
        errors[field.key] = `Select at least one ${field.title || "option"}.`;
      }
      return;
    }
    if (isUploadFileField(field)) {
      if (!isFileFilled(value)) errors[field.key] = `Upload ${field.title || "this file"}.`;
      return;
    }
    if (value == null || String(value).trim() === "") {
      errors[field.key] = `Enter ${field.title || "this field"}.`;
    }
  });
  return errors;
}
