import React, { useEffect, useState } from "react";
import AddModal from "../../../../components/common/AddModal";
import InputField from "../../../../components/common/fields/InputField";
import ToggleField from "../../../../components/common/fields/ToggleField";

const EMPTY_FORM = {
  name: "",
  code: "",
  brand: "",
  description: "",
  unit: "",
  isActive: true,
};

export default function EditInventoryItemModal({
  isOpen,
  onClose,
  item,
  onSave,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen || !item) return;
    setForm({
      name: item.name || "",
      code: item.itemCode || item.code || "",
      brand: item.brand === "—" ? "" : item.brand || "",
      description: item.description || "",
      unit: item.unit || "",
      isActive: item.isActive !== false,
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
      subtitle="Update catalog fields for this item."
      saveLabel="Save changes"
      dialogClassName="max-w-lg"
      overlayClassName="!z-[10001]"
    >
      <div className="space-y-3">
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
        <InputField
          id="edit-item-unit"
          label="Unit"
          value={form.unit}
          onChange={setField("unit")}
          placeholder="pcs"
        />
        <InputField
          id="edit-item-description"
          label="Description"
          value={form.description}
          onChange={setField("description")}
          placeholder="Short description…"
        />
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
