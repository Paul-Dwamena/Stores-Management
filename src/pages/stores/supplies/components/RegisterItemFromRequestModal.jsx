import React, { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import AddModal from "../../../../components/common/AddModal";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import InputField from "../../../../components/common/fields/InputField";
import Label from "../../../../components/common/base/Label";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import { registerItemForRequest } from "../../../../services/supplyRequestsService";
import { updateItemPhoto } from "../../../../services/itemsService";
import ItemPhotoField from "../../inventory/components/ItemPhotoField";
import { useBrandSelectOptions, useCategorySelectOptions } from "../../../../hooks/useCatalogOptions";

const UNIT_OPTIONS = [
  { value: "carton", label: "Carton" },
  { value: "box", label: "Box" },
];

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 transition-colors text-slate-700";

const textareaClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 transition-colors text-slate-700 resize-none";

const EMPTY_FORM = {
  name: "",
  brand: "",
  category: "",
  unit: "",
  description: "",
  photo: "",
  photoFile: null,
};

export default function RegisterItemFromRequestModal({
  isOpen,
  onClose,
  requisition,
  onRegistered,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const brandOptions = useBrandSelectOptions(isOpen);
  const categoryOptions = useCategorySelectOptions(isOpen);

  const generalRequestItemId =
    requisition?.generalRequestItemId ?? requisition?.id ?? null;

  useEffect(() => {
    if (!isOpen || !requisition) return;
    setForm({
      name: requisition.itemName || "",
      brand: "",
      category: "",
      unit: "",
      description: requisition.description || "",
      photo: "",
      photoFile: null,
    });
    setErrors({});
    setConfirmOpen(false);
    setSaving(false);
  }, [isOpen, requisition]);

  const setField = (key) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSave = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Enter an item name.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Fix the highlighted fields before registering.");
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmRegister = async () => {
    if (!generalRequestItemId || saving) return;
    setSaving(true);
    try {
      const result = await registerItemForRequest(generalRequestItemId, {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        brand_id: form.brand || null,
        category_id: form.category || null,
        unit: form.unit?.trim() || null,
      });

      if (form.photoFile instanceof File) {
        try {
          await updateItemPhoto(result.itemId, form.photoFile);
        } catch (photoErr) {
          toast.warning(
            photoErr.message || "Item registered, but photo could not be uploaded.",
          );
        }
      }

      toast.success(result.message || "Item registered for this request.");
      setConfirmOpen(false);
      onRegistered?.(result);
    } catch (err) {
      toast.error(err.message || "Could not register item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AddModal
        isOpen={isOpen && !confirmOpen}
        onClose={onClose}
        onSave={handleSave}
        title="Register item"
        subtitle="Create a catalog entry linked to this supply request."
        saveLabel="Register item"
        saveDisabled={saving}
        dialogClassName="max-w-xl"
        overlayClassName="!z-[10001]"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-amber-900">
                Review before registering
              </p>
              <p className="mt-0.5 text-[11px] text-amber-800/90">
                Name and description are prefilled from the request. Edit the item
                information below before registering.
              </p>
            </div>
          </div>

          <ItemPhotoField
            id="register-request-item-photo"
            label="Item photo"
            value={form.photo}
            onChange={(photo) => setForm((current) => ({ ...current, photo }))}
            onFileChange={(file) =>
              setForm((current) => ({ ...current, photoFile: file }))
            }
          />
          <p className="-mt-2 text-[10px] text-slate-400">
            Optional — you can add or change the photo later in Inventory.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              id="register-item-name"
              label="Name"
              required
              value={form.name}
              onChange={setField("name")}
              error={errors.name}
            />
            <div className="space-y-1.5">
              <Label htmlFor="register-item-brand">Brand</Label>
              <select
                id="register-item-brand"
                value={form.brand}
                onChange={setField("brand")}
                className={fieldClassName}
              >
                <option value="">Select brand…</option>
                {brandOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="register-item-category">Category</Label>
              <select
                id="register-item-category"
                value={form.category}
                onChange={setField("category")}
                className={fieldClassName}
              >
                <option value="">Select category…</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="register-item-unit">Unit</Label>
              <select
                id="register-item-unit"
                value={form.unit}
                onChange={setField("unit")}
                className={fieldClassName}
              >
                <option value="">Select unit…</option>
                {UNIT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-item-description">Description</Label>
            <textarea
              id="register-item-description"
              rows={3}
              value={form.description}
              onChange={setField("description")}
              className={cn(textareaClassName, "bg-white")}
              placeholder="Short description…"
            />
          </div>
        </div>
      </AddModal>

      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => {
          if (saving) return;
          setConfirmOpen(false);
        }}
        onConfirm={handleConfirmRegister}
        closeOnConfirm={false}
        confirmLoading={saving}
        className="!z-[10002]"
        title="Register item for this request?"
        message={
          form.name.trim()
            ? `Register “${form.name.trim()}” in the catalog and link it to this request?`
            : "Register this item in the catalog and link it to this request?"
        }
        confirmText={saving ? "Registering…" : "Register item"}
      />
    </>
  );
}
