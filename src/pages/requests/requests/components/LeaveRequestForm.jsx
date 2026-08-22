import React, { useMemo } from "react";
import { cn } from "../../../../utils/cn";
import InputField from "../../../../components/common/fields/InputField";
import ConfiguredFormSections from "../../../../components/common/ConfiguredFormSections";
import { fieldRequiredLabel } from "../../../../components/common/fields/requiredFieldLabel";
import { getLeaveTypes } from "../../../../mockdata/leaveTypes";
import {
  LEAVE_REQUEST_FORM_FIELD_CATALOG,
  LEAVE_REQUEST_FORM_SETUP_CHANGED_EVENT,
  getActiveLeaveRequestFormSections,
  getLeaveRequestFormSetup,
} from "../../../../mockdata/setups";
import { useFormTreeSections } from "../../../../hooks/useFormTreeSections";
import {
  calculateNumberOfDays,
  getEmployeeById,
  getLeaveYearOptions,
  MOCK_EMPLOYEES,
} from "../utils/requestHelpers";
import EmployeeSearchSelect from "./EmployeeSearchSelect";

const SYSTEM_KEYS = new Set(LEAVE_REQUEST_FORM_FIELD_CATALOG.map((field) => field.key));

const selectFieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 transition-colors text-slate-700";

const readOnlyValueClassName =
  "w-full rounded-lg border border-slate-200 bg-slate-200/35 px-3 py-2 text-[12px] text-slate-600 cursor-default transition-colors hover:cursor-not-allowed hover:bg-slate-200/55";

const textareaClassName =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-700 outline-none focus:border-emerald-500";

function AutoField({ label, value, hint, spanClass }) {
  return (
    <div className={cn("space-y-1.5", spanClass)}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <div className={readOnlyValueClassName}>{value || "—"}</div>
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}

export default function LeaveRequestForm({ form, errors, onChange }) {
  const { sections } = useFormTreeSections(
    LEAVE_REQUEST_FORM_SETUP_CHANGED_EVENT,
    getLeaveRequestFormSetup,
    getActiveLeaveRequestFormSections,
  );
  const leaveTypes = getLeaveTypes();
  const employee = getEmployeeById(form.employeeId);
  const numberOfDays = calculateNumberOfDays(form.startDate, form.endDate);

  const handleCanonical = (key) => (event) => {
    const value = event?.target ? event.target.value : event;
    onChange(key, value);
  };

  const optionRows = (options = []) =>
    (options ?? []).map((option) =>
      typeof option === "string"
        ? { value: option, label: option }
        : { value: option.value, label: option.label ?? option.value },
    );

  const renderSystemField = (field) => {
    const id = `lrf-field-${field.id}`;
    const label = fieldRequiredLabel(field);

    if (field.key === "employeeId") {
      return (
        <div key={field.id}>
          <EmployeeSearchSelect
            id={id}
            label={field.title}
            value={form.employeeId}
            onChange={(value) => onChange("employeeId", value)}
            employees={MOCK_EMPLOYEES}
            error={errors.employeeId}
          />
        </div>
      );
    }

    if (field.key === "department") {
      return (
        <AutoField
          key={field.id}
          label={field.title}
          value={form.department}
          hint="Auto-populated from employee"
        />
      );
    }

    if (field.key === "positionRole") {
      return (
        <AutoField
          key={field.id}
          label={field.title}
          value={form.positionRole}
          hint="Auto-populated from employee"
        />
      );
    }

    if (field.key === "numberOfDays") {
      return (
        <AutoField
          key={field.id}
          label={field.title}
          value={numberOfDays != null ? String(numberOfDays) : ""}
          hint="Auto-calculated from start and end dates"
        />
      );
    }

    if (field.key === "leaveBalance") {
      return (
        <AutoField
          key={field.id}
          label={field.title}
          value={employee ? String(employee.leaveBalance) : ""}
          hint="Auto-calculated from employee record"
        />
      );
    }

    if (field.key === "leaveType" || field.key === "leaveYear") {
      const options =
        field.key === "leaveType"
          ? (optionRows(field.options).length
            ? optionRows(field.options)
            : leaveTypes.map((type) => ({ value: type.value, label: type.label })))
          : (optionRows(field.options).length ? optionRows(field.options) : getLeaveYearOptions());
      return (
        <div key={field.id} className="space-y-1.5">
          <label
            htmlFor={id}
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              errors[field.key] ? "text-red-500" : "text-slate-500",
            )}
          >
            {label}
          </label>
          <select
            id={id}
            value={form[field.key] ?? ""}
            onChange={(event) => onChange(field.key, event.target.value)}
            className={cn(
              selectFieldClassName,
              errors[field.key] && "border-red-500 bg-red-50 focus:border-red-500",
            )}
          >
            <option value="" disabled>
              {field.placeholder || "Select…"}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors[field.key] ? (
            <p className="mt-1 text-[10px] font-medium text-red-500">{errors[field.key]}</p>
          ) : null}
        </div>
      );
    }

    if (field.key === "reason") {
      return (
        <div key={field.id} className="space-y-1.5 sm:col-span-2">
          <label
            htmlFor={id}
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              errors.reason ? "text-red-500" : "text-slate-500",
            )}
          >
            {label}
          </label>
          <textarea
            id={id}
            rows={4}
            value={form.reason ?? ""}
            onChange={(event) => onChange("reason", event.target.value)}
            placeholder={field.placeholder}
            className={cn(
              textareaClassName,
              errors.reason && "border-red-500 bg-red-50 focus:border-red-500",
            )}
          />
          {errors.reason ? (
            <p className="mt-1 text-[10px] font-medium text-red-500">{errors.reason}</p>
          ) : null}
        </div>
      );
    }

    if (field.key === "startDate" || field.key === "endDate" || field.key === "expectedReturnDate") {
      return (
        <div key={field.id}>
          <InputField
            label={field.title}
            id={id}
            type="date"
            required={field.required === true}
            value={form[field.key] ?? ""}
            onChange={(event) => onChange(field.key, event.target.value)}
            error={errors[field.key]}
          />
          {field.key === "endDate" && !errors.endDate ? (
            <p className="text-[10px] text-slate-400 mt-1.5">
              Auto-calculated from leave type or entered manually
            </p>
          ) : null}
        </div>
      );
    }

    return (
      <div key={field.id}>
        <InputField
          id={id}
          label={field.title}
          required={field.required === true}
          value={form[field.key] ?? ""}
          onChange={(event) => onChange(field.key, event.target.value)}
          placeholder={field.placeholder}
          error={errors[field.key]}
        />
      </div>
    );
  };

  const gridSections = useMemo(
    () => sections.map((section) => ({ ...section, columns: section.columns ?? 2 })),
    [sections],
  );

  return (
    <ConfiguredFormSections
      sections={gridSections}
      form={form}
      formErrors={errors}
      handleChange={handleCanonical}
      systemKeys={SYSTEM_KEYS}
      renderSystemField={renderSystemField}
      idPrefix="lrf"
      fallbackColumns={2}
    />
  );
}

export { SYSTEM_KEYS as LEAVE_REQUEST_FORM_SYSTEM_KEYS };
