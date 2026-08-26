import React from "react";
import { cn } from "../../../../utils/cn";
import InputField from "../../../../components/common/fields/InputField";
import ConfiguredFormSections from "../../../../components/common/ConfiguredFormSections";
import { fieldRequiredLabel } from "../../../../components/common/fields/requiredFieldLabel";
import {
  VEHICLE_REQUEST_FORM_FIELD_CATALOG,
  VEHICLE_REQUEST_FORM_SETUP_CHANGED_EVENT,
  getActiveVehicleRequestFormSections,
  getVehicleRequestFormSetup,
} from "../../../../mockdata/setups";
import { useFormTreeSections } from "../../../../hooks/useFormTreeSections";
import { DEMO_DRIVERS } from "../../../../mockdata/drivers";
import { DEMO_VEHICLES } from "../../../../mockdata/vehicles";
import DriverSearchSelect from "../../../fleetOps/trips/components/DriverSearchSelect";
import VehicleSearchSelect from "../../../vehicles/shared/components/VehicleSearchSelect";

const SYSTEM_KEYS = new Set(VEHICLE_REQUEST_FORM_FIELD_CATALOG.map((field) => field.key));

const textareaClassName =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-700 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25";

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

export default function VehicleRequestForm({ form, errors, onChange }) {
  const { sections } = useFormTreeSections(
    VEHICLE_REQUEST_FORM_SETUP_CHANGED_EVENT,
    getVehicleRequestFormSetup,
    getActiveVehicleRequestFormSections,
  );

  const handleCanonical = (key) => (event) => {
    const value = event?.target ? event.target.value : event;
    onChange(key, value);
  };

  const renderSystemField = (field, sectionColumns) => {
    const id = `vreq-field-${field.id}`;
    const label = fieldRequiredLabel(field);
    const spanClass = fieldSpanClass(field, sectionColumns);

    if (field.key === "driverId") {
      return (
        <div key={field.id} className={spanClass}>
          <DriverSearchSelect
            id={id}
            label={label}
            value={form.driverId}
            onChange={(value) => onChange("driverId", value)}
            drivers={DEMO_DRIVERS}
            placeholder={field.placeholder || "Search driver…"}
            error={errors.driverId}
          />
        </div>
      );
    }

    if (field.key === "vehicleId") {
      return (
        <div key={field.id} className={spanClass}>
          <VehicleSearchSelect
            id={id}
            label={label}
            value={form.vehicleId}
            onChange={(value) => onChange("vehicleId", value)}
            vehicles={DEMO_VEHICLES}
            placeholder={field.placeholder || "Search vehicle…"}
            error={errors.vehicleId}
          />
        </div>
      );
    }

    if (field.key === "reason") {
      return (
        <div key={field.id} className={cn("space-y-1.5", spanClass)}>
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

    return (
      <div key={field.id} className={spanClass}>
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

  return (
    <ConfiguredFormSections
      sections={sections}
      form={form}
      formErrors={errors}
      handleChange={handleCanonical}
      systemKeys={SYSTEM_KEYS}
      renderSystemField={renderSystemField}
      idPrefix="vreq"
      fallbackColumns={1}
    />
  );
}

export { SYSTEM_KEYS as VEHICLE_REQUEST_FORM_SYSTEM_KEYS };
