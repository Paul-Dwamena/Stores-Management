import React, { useEffect, useState } from "react";
import AddModal from "../../../../components/common/AddModal";
import InputField from "../../../../components/common/fields/InputField";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import { ACCESSORY_BRAND_OPTIONS } from "../../../../mockdata/stores/accessories";

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 transition-colors text-slate-700";

const INITIAL_FORM = {
  itemCode: "",
  name: "",
  brand: "",
  description: "",
  quantity: "",
  unitCost: "",
  location: "",
  minStock: "5",
};

export default function AddAccessoryModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setForm(INITIAL_FORM);
    setErrors({});
  }, [isOpen]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Enter an item name.";
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
      title="New Accessory Item"
      subtitle="Add a new accessory to store inventory."
      saveLabel="Save item"
      dialogClassName="max-w-xl"
      contentClassName="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          label="Item code"
          id="accessoryItemCode"
          value={form.itemCode}
          onChange={handleChange("itemCode")}
          placeholder="Auto-generated if blank"
        />
        <div className="space-y-1.5">
          <label
            htmlFor="accessoryBrand"
            className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
          >
            Brand
          </label>
          <select
            id="accessoryBrand"
            value={form.brand}
            onChange={handleChange("brand")}
            className={fieldClassName}
          >
            <option value="">Select brand…</option>
            {ACCESSORY_BRAND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <InputField
        label="Name"
        id="accessoryName"
        value={form.name}
        onChange={handleChange("name")}
        error={errors.name}
        placeholder="Accessory name"
      />
      <div className="space-y-1.5">
        <label
          htmlFor="accessoryDescription"
          className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
        >
          Description
        </label>
        <textarea
          id="accessoryDescription"
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
          id="accessoryQty"
          type="number"
          value={form.quantity}
          onChange={handleChange("quantity")}
          error={errors.quantity}
        />
        <InputField
          label="Unit cost (GH₵)"
          id="accessoryUnitCost"
          type="number"
          value={form.unitCost}
          onChange={handleChange("unitCost")}
          error={errors.unitCost}
        />
        <InputField
          label="Min stock"
          id="accessoryMinStock"
          type="number"
          value={form.minStock}
          onChange={handleChange("minStock")}
        />
      </div>
      <InputField
        label="Location"
        id="accessoryLocation"
        value={form.location}
        onChange={handleChange("location")}
        placeholder="e.g. Store A — Shelf B2"
      />
    </AddModal>
  );
}
