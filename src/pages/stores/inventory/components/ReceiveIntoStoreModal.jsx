import React, { useEffect, useState } from "react";
import AddModal from "../../../../components/common/AddModal";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import ConfiguredFormSections from "../../../../components/common/ConfiguredFormSections";
import InputField from "../../../../components/common/fields/InputField";
import { collectCanonicalFieldErrors } from "../../../../components/common/fields/canonicalConfiguredField";
import { fieldRequiredLabel } from "../../../../components/common/fields/requiredFieldLabel";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import { useFormTreeSections } from "../../../../hooks/useFormTreeSections";
import {
  SEED_SUPPLIERS,
  STORE_LOCATION_OPTIONS,
  formatAccessoryMoney,
} from "../../../../mockdata/stores";
import {
  SUBMIT_STORE_RECEIPT_FORM_FIELD_CATALOG,
  SUBMIT_STORE_RECEIPT_FORM_SETUP_CHANGED_EVENT,
  getActiveSubmitStoreReceiptFormSections,
  getSubmitStoreReceiptFormSetup,
} from "../../../../mockdata/setups";

const SYSTEM_KEYS = new Set(SUBMIT_STORE_RECEIPT_FORM_FIELD_CATALOG.map((field) => field.key));

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 transition-colors text-slate-700";

const CONDITION_OPTIONS = [
  { value: "GOOD", label: "Good" },
  { value: "BAD", label: "Bad" },
  { value: "BROKEN", label: "Broken" },
  { value: "PARTIALLY_DAMAGED", label: "Partially damaged" },
  { value: "DAMAGED", label: "Damaged" },
];

const INITIAL = {
  quantity: "",
  unitCost: "",
  location: "",
  supplierId: "",
  waybillNumber: "",
  deliveredByName: "",
  supplierPhone: "",
  supplierEmail: "",
  condition: "",
  notes: "",
};

export default function ReceiveIntoStoreModal({
  isOpen,
  onClose,
  item,
  onSave,
}) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [pendingReceive, setPendingReceive] = useState(null);
  const { sections, visibleKeys } = useFormTreeSections(
    SUBMIT_STORE_RECEIPT_FORM_SETUP_CHANGED_EVENT,
    getSubmitStoreReceiptFormSetup,
    getActiveSubmitStoreReceiptFormSections,
  );
  const show = (key) => visibleKeys.has(key);

  useEffect(() => {
    if (!isOpen) return;
    setForm(INITIAL);
    setErrors({});
    setPendingReceive(null);
  }, [isOpen, item?.id]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key] && !["supplierPhone", "supplierEmail"].includes(key)) return prev;
      const next = { ...prev };
      delete next[key];
      if (key === "supplierPhone" || key === "supplierEmail") {
        delete next.supplierContact;
      }
      return next;
    });
  };

  const handleSave = () => {
    const nextErrors = {};
    const quantity = Number(form.quantity);
    const unitCost = Number(form.unitCost);
    if (show("quantity") && (!form.quantity || Number.isNaN(quantity) || quantity <= 0)) {
      nextErrors.quantity = "Enter a quantity greater than zero.";
    }
    if (show("unitCost") && (form.unitCost === "" || Number.isNaN(unitCost) || unitCost < 0)) {
      nextErrors.unitCost = "Enter a valid unit cost.";
    }
    if (show("location") && !form.location.trim()) {
      nextErrors.location = "Select a store location.";
    }
    if (show("supplierId") && !form.supplierId) nextErrors.supplierId = "Select a supplier.";
    if (show("deliveredByName") && !form.deliveredByName.trim()) {
      nextErrors.deliveredByName = "Enter the name of the person who delivered the items.";
    }
    if (show("condition") && !form.condition) nextErrors.condition = "Select the item condition.";
    if (
      (show("supplierPhone") || show("supplierEmail"))
      && !form.supplierPhone.trim()
      && !form.supplierEmail.trim()
    ) {
      nextErrors.supplierContact = "Enter a supplier phone number or email address.";
    }
    if (
      show("supplierEmail")
      && form.supplierEmail.trim()
      && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.supplierEmail.trim())
    ) {
      nextErrors.supplierEmail = "Enter a valid email address.";
    }
    Object.assign(
      nextErrors,
      collectCanonicalFieldErrors(
        sections.flatMap((section) => (section.fields || []).filter((field) => !SYSTEM_KEYS.has(field.key))),
        form,
      ),
    );
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Complete the required fields before receiving stock.");
      return;
    }

    setPendingReceive({
      quantity,
      unitCost,
      location: form.location.trim(),
      supplierId: form.supplierId,
      waybillNumber: form.waybillNumber.trim(),
      deliveredByName: form.deliveredByName.trim(),
      supplierPhone: form.supplierPhone.trim(),
      supplierEmail: form.supplierEmail.trim(),
      condition: form.condition,
      notes: form.notes.trim(),
    });
  };

  const handleConfirmReceive = () => {
    if (!pendingReceive) return;
    try {
      onSave?.(pendingReceive);
      setPendingReceive(null);
    } catch (error) {
      toast.error(error.message ?? "Could not receive stock.");
    }
  };

  return (
    <>
      <AddModal
        isOpen={isOpen && !pendingReceive}
        onClose={onClose}
        onSave={handleSave}
        title="Submit stock receipt"
        subtitle={
          item
            ? `Submit a stock receipt for ${item.itemCode} — ${item.name}. It will appear in receivables after approval.`
            : "Submit a stock receipt for approval before it is added to receivables."
        }
        saveLabel="Submit for approval"
        dialogClassName="max-w-2xl"
        panelClassName="max-w-2xl"
      >
        <ConfiguredFormSections
          sections={sections}
          form={form}
          formErrors={errors}
          handleChange={(key) => (event) => setField(key, event?.target ? event.target.value : event)}
          systemKeys={SYSTEM_KEYS}
          idPrefix="ssr"
          renderSystemField={(field) => {
            const id = `ssr-${field.id}`;
            if (field.key === "location") {
              return (
                <div key={field.id}>
                  <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {fieldRequiredLabel(field)}
                  </label>
                  <select
                    id={id}
                    value={form.location}
                    onChange={(e) => setField("location", e.target.value)}
                    className={fieldClassName}
                  >
                    <option value="">Select location</option>
                    {STORE_LOCATION_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {errors.location && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.location}</p>
                  )}
                </div>
              );
            }
            if (field.key === "supplierId") {
              return (
                <div key={field.id}>
                  <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {fieldRequiredLabel(field)}
                  </label>
                  <select
                    id={id}
                    value={form.supplierId}
                    onChange={(e) => setField("supplierId", e.target.value)}
                    className={cn(fieldClassName, errors.supplierId && "border-rose-500 bg-rose-50")}
                  >
                    <option value="">Select supplier</option>
                    {SEED_SUPPLIERS.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                  {errors.supplierId && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.supplierId}</p>
                  )}
                </div>
              );
            }
            if (field.key === "condition") {
              const options = (field.options?.length ? field.options : CONDITION_OPTIONS).map((option) =>
                typeof option === "string" ? { value: option, label: option } : option,
              );
              return (
                <div key={field.id}>
                  <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {fieldRequiredLabel(field)}
                  </label>
                  <select
                    id={id}
                    value={form.condition}
                    onChange={(e) => setField("condition", e.target.value)}
                    className={cn(fieldClassName, errors.condition && "border-rose-500 bg-rose-50")}
                  >
                    <option value="">Select condition</option>
                    {options.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {errors.condition && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.condition}</p>
                  )}
                </div>
              );
            }
            if (field.key === "notes") {
              return (
                <div key={field.id}>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {field.title}
                  </label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    className={cn(fieldClassName, "resize-none")}
                    placeholder={field.placeholder || "Optional delivery or inspection notes"}
                  />
                </div>
              );
            }
            const type = field.key === "quantity" || field.key === "unitCost" ? "number" : field.key === "supplierEmail" ? "email" : field.key === "supplierPhone" ? "tel" : "text";
            return (
              <div key={field.id}>
                <InputField
                  label={field.title}
                  type={type}
                  value={form[field.key] ?? ""}
                  onChange={(e) => setField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  error={errors[field.key] || (field.key === "supplierPhone" ? errors.supplierContact : undefined)}
                />
              </div>
            );
          }}
        />
      </AddModal>

      <ConfirmationModal
        isOpen={Boolean(pendingReceive)}
        onClose={() => setPendingReceive(null)}
        onConfirm={handleConfirmReceive}
        title="Submit stock receipt?"
        message={
          pendingReceive
            ? `Submit receipt of ${pendingReceive.quantity} of ${item?.itemCode || "this item"} into ${pendingReceive.location} for approval?`
            : "Submit this stock receipt for approval."
        }
        confirmText="Submit for approval"
      />
    </>
  );
}
