import React, { useEffect, useMemo, useState } from "react";
import AddModal from "../../../../components/common/AddModal";
import InputField from "../../../../components/common/fields/InputField";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import {
  VEHICLE_PART_MAKE_OPTIONS,
  getVehiclePartModelOptions,
  getVehiclePartYearOptions,
} from "../../../../mockdata/stores/vehiclePartsInventory";

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 transition-colors text-slate-700";

const INITIAL_FORM = {
  itemCode: "",
  make: "",
  model: "",
  year: "",
  chassisNumber: "",
  name: "",
  brand: "",
  description: "",
  quantity: "",
  unitCost: "",
  location: "",
  minStock: "5",
};

export default function AddVehiclePartModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  const modelOptions = useMemo(
    () => getVehiclePartModelOptions(form.make),
    [form.make],
  );
  const yearOptions = useMemo(() => getVehiclePartYearOptions(), []);

  useEffect(() => {
    if (!isOpen) return;
    setForm(INITIAL_FORM);
    setErrors({});
  }, [isOpen]);

  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => {
      if (field === "make") {
        return { ...prev, make: value, model: "", year: "" };
      }
      if (field === "model") {
        return { ...prev, model: value, year: "" };
      }
      return { ...prev, [field]: value };
    });
    clearError(field);
    if (field === "make") {
      clearError("model");
      clearError("year");
    } else if (field === "model") {
      clearError("year");
    }
  };

  const handleSubmit = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Enter the component name.";
    if (!form.make.trim()) nextErrors.make = "Select a make.";
    if (!form.model.trim()) nextErrors.model = "Select a model.";
    if (form.quantity === "" || Number.isNaN(Number(form.quantity)) || Number(form.quantity) < 0) {
      nextErrors.quantity = "Enter a valid quantity.";
    }
    if (form.unitCost === "" || Number.isNaN(Number(form.unitCost)) || Number(form.unitCost) < 0) {
      nextErrors.unitCost = "Enter a valid unit cost.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.warning("Fix the highlighted fields before saving.");
      return;
    }
    onSave(form);
  };

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSubmit}
      title="New Vehicle Part"
      subtitle="Add a vehicle part linked to make, model, and chassis."
      saveLabel="Save item"
      dialogClassName="max-w-2xl"
      contentClassName="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          label="Item code"
          id="vpItemCode"
          value={form.itemCode}
          onChange={handleChange("itemCode")}
          placeholder="Auto-generated if blank"
        />
        <InputField
          label="Brand"
          id="vpBrand"
          value={form.brand}
          onChange={handleChange("brand")}
          placeholder="e.g. Bosch"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label
            htmlFor="vpMake"
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              errors.make ? "text-red-500" : "text-slate-500",
            )}
          >
            Make
          </label>
          <select
            id="vpMake"
            value={form.make}
            onChange={handleChange("make")}
            className={cn(fieldClassName, errors.make && "border-red-500 bg-red-50")}
          >
            <option value="">Select make…</option>
            {VEHICLE_PART_MAKE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.make ? (
            <p className="text-[10px] font-medium text-red-500">{errors.make}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="vpModel"
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              errors.model ? "text-red-500" : "text-slate-500",
            )}
          >
            Model
          </label>
          <select
            id="vpModel"
            value={form.model}
            onChange={handleChange("model")}
            disabled={!form.make}
            className={cn(
              fieldClassName,
              errors.model && "border-red-500 bg-red-50",
              !form.make && "opacity-60",
            )}
          >
            <option value="">{!form.make ? "Select make first" : "Select model…"}</option>
            {modelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.model ? (
            <p className="text-[10px] font-medium text-red-500">{errors.model}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="vpYear"
            className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
          >
            Year
          </label>
          <select
            id="vpYear"
            value={form.year}
            onChange={handleChange("year")}
            disabled={!form.model}
            className={cn(fieldClassName, !form.model && "opacity-60")}
          >
            <option value="">{!form.model ? "Select model first" : "Select year…"}</option>
            {yearOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <InputField
        label="Chassis number"
        id="vpChassis"
        value={form.chassisNumber}
        onChange={handleChange("chassisNumber")}
        placeholder="VIN / chassis number"
      />
      <InputField
        label="Name (component)"
        id="vpName"
        value={form.name}
        onChange={handleChange("name")}
        error={errors.name}
        placeholder="Last vehicle component level, e.g. Front Brake Pad Set"
      />
      <div className="space-y-1.5">
        <label
          htmlFor="vpDescription"
          className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
        >
          Description
        </label>
        <textarea
          id="vpDescription"
          rows={3}
          value={form.description}
          onChange={handleChange("description")}
          className={cn(fieldClassName, "resize-none")}
          placeholder="Short description…"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InputField
          label="Quantity"
          id="vpQty"
          type="number"
          value={form.quantity}
          onChange={handleChange("quantity")}
          error={errors.quantity}
        />
        <InputField
          label="Unit cost (GH₵)"
          id="vpUnitCost"
          type="number"
          value={form.unitCost}
          onChange={handleChange("unitCost")}
          error={errors.unitCost}
        />
        <InputField
          label="Min stock"
          id="vpMinStock"
          type="number"
          value={form.minStock}
          onChange={handleChange("minStock")}
        />
      </div>
      <InputField
        label="Location"
        id="vpLocation"
        value={form.location}
        onChange={handleChange("location")}
        placeholder="e.g. Store A — Bay 3"
      />
    </AddModal>
  );
}
