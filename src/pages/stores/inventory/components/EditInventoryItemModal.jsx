import React, { useEffect, useState } from "react";
import AddModal from "../../../../components/common/AddModal";
import InputField from "../../../../components/common/fields/InputField";
import Label from "../../../../components/common/base/Label";
import ToggleField from "../../../../components/common/fields/ToggleField";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import ItemPhotoField from "./ItemPhotoField";
import {
  baseUnitApiValue,
  baseUnitLabel,
  getBaseUnitOptions,
  resolveItemBaseUnit,
} from "../utils/inventoryUnitOptions";

const EMPTY_FORM = {
  name: "",
  code: "",
  brand: "",
  description: "",
  baseUnit: "piece",
  photo: "",
  photoFile: null,
  isActive: true,
};

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-brand transition-colors text-slate-700";

const textareaClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-brand transition-colors text-slate-700 resize-none";

export default function EditInventoryItemModal({
  isOpen,
  onClose,
  item,
  onSave,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const baseUnitOptions = getBaseUnitOptions();

  useEffect(() => {
    if (!isOpen || !item) return;
    setForm({
      name: item.name || "",
      code: item.itemCode || item.code || "",
      brand: item.brand === "—" ? "" : item.brand || "",
      description: item.description || "",
      baseUnit: resolveItemBaseUnit(item.unit),
      photo: item.photo || "",
      photoFile: null,
      isActive: item.isActive !== false,
    });
    setErrors({});
    setSaving(false);
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

  const handleSave = async () => {
    if (saving) return;
    if (!String(form.name || "").trim()) {
      setErrors({ name: "Enter the item name." });
      toast.warning("Enter the item name.");
      return;
    }

    setSaving(true);
    try {
      await onSave?.({
        name: form.name,
        code: form.code,
        brand: form.brand,
        description: form.description,
        unit: baseUnitApiValue(form.baseUnit),
        photo: form.photo,
        photoFile: form.photoFile,
        isActive: form.isActive,
      });
      toast.success("Item details updated.");
      onClose?.();
    } catch (error) {
      toast.error(error?.message || "Could not update item.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    onClose?.();
  };

  const originalPhoto = item?.photo || "";

  return (
    <AddModal
      isOpen={isOpen}
      onClose={handleClose}
      onSave={handleSave}
      title="Edit item"
      subtitle="Update catalog fields for this item."
      saveLabel={saving ? "Saving…" : "Save changes"}
      saveDisabled={saving}
      dialogClassName="max-w-xl"
      overlayClassName="!z-[10001]"
    >
      <div className="space-y-4">
        <ItemPhotoField
          id={`edit-item-photo-${item?.id ?? "new"}`}
          value={form.photo}
          showRemove={Boolean(form.photoFile)}
          onChange={(photo) =>
            setForm((current) => ({
              ...current,
              photo: photo || originalPhoto,
              photoFile: photo ? current.photoFile : null,
            }))
          }
          onFileChange={(file) =>
            setForm((current) => ({
              ...current,
              photoFile: file,
              photo: file ? current.photo : originalPhoto,
            }))
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            id="edit-item-name"
            label="Name"
            required
            value={form.name}
            onChange={setField("name")}
            error={errors.name}
          />
          <InputField
            id="edit-item-code"
            label="Item code"
            value={form.code}
            onChange={setField("code")}
            placeholder="Optional code"
          />
          <InputField
            id="edit-item-brand"
            label="Brand"
            value={form.brand}
            onChange={setField("brand")}
          />
          <div className="space-y-1.5">
            <Label htmlFor="edit-item-base-unit">Base unit</Label>
            <select
              id="edit-item-base-unit"
              value={form.baseUnit}
              onChange={setField("baseUnit")}
              className={cn(fieldClassName)}
            >
              {baseUnitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400">
              Stock is always tracked in {baseUnitLabel(form.baseUnit).toLowerCase()}s.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-item-description">Description</Label>
          <textarea
            id="edit-item-description"
            rows={3}
            value={form.description}
            onChange={setField("description")}
            className={cn(textareaClassName)}
            placeholder="Short description…"
          />
        </div>

        <ToggleField
          label="Active"
          description="Inactive items stay in the catalog but are marked inactive."
          checked={form.isActive}
          onChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))}
        />
      </div>
    </AddModal>
  );
}
