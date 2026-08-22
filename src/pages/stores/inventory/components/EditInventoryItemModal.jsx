import React, { useEffect, useMemo, useState } from "react";
import AddModal from "../../../../components/common/AddModal";
import InputField from "../../../../components/common/fields/InputField";
import { ACCESSORY_BRAND_OPTIONS } from "../../../../mockdata/stores";
import { cn } from "../../../../utils/cn";
import ItemPhotoField from "./ItemPhotoField";

const selectClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 transition-colors text-slate-700";

const EMPTY_FORM = {
  photo: "",
  name: "",
  brand: "",
  description: "",
  shelfPosition: "",
};

export default function EditInventoryItemModal({
  isOpen,
  onClose,
  item,
  onSave,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const brandOptions = useMemo(() => {
    const current = form.brand;
    if (!current || ACCESSORY_BRAND_OPTIONS.some((option) => option.value === current)) {
      return ACCESSORY_BRAND_OPTIONS;
    }
    return [{ value: current, label: current }, ...ACCESSORY_BRAND_OPTIONS];
  }, [form.brand]);

  useEffect(() => {
    if (!isOpen || !item) return;
    setForm({
      photo: item.photo || "",
      name: item.name || "",
      brand: item.brand === "—" ? "" : item.brand || "",
      description: item.description || "",
      shelfPosition: item.shelfPosition || "",
    });
    setErrors({});
  }, [isOpen, item]);

  const setField = (key) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleSave = () => {
    if (!String(form.name || "").trim()) {
      setErrors({ name: "Enter the item name." });
      return;
    }
    onSave?.(form);
  };

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title="Edit item"
      subtitle="Update basic item details. Shelf location can be changed anytime."
      saveLabel="Save changes"
      dialogClassName="max-w-lg"
      overlayClassName="!z-[10001]"
    >
      <div className="space-y-3">
        <ItemPhotoField
          id="edit-item-photo"
          value={form.photo}
          onChange={setField("photo")}
        />
        <InputField
          id="edit-item-name"
          label="Name"
          required
          value={form.name}
          onChange={setField("name")}
          error={errors.name}
        />
        <div className="space-y-1.5">
          <label
            htmlFor="edit-item-brand"
            className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
          >
            Brand
          </label>
          <select
            id="edit-item-brand"
            value={form.brand}
            onChange={setField("brand")}
            className={cn(selectClassName)}
          >
            <option value="">Select brand…</option>
            {brandOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <InputField
          id="edit-item-description"
          label="Description"
          value={form.description}
          onChange={setField("description")}
          placeholder="Short description…"
        />
        <InputField
          id="edit-item-shelf"
          label="Shelf location"
          value={form.shelfPosition}
          onChange={setField("shelfPosition")}
          placeholder="e.g. Aisle A · Shelf B2"
        />
      </div>
    </AddModal>
  );
}
