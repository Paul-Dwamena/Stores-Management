import React from "react";
import { Plus } from "lucide-react";
import { toast } from "../../../../components/common/ToastNotification";
import { saveSupplier } from "../../../../mockdata/org/suppliers";
import CatalogFormModal from "../../../setups/components/CatalogFormModal";

const EMPTY_FORM = { name: "", phone: "", email: "", city: "", status: "Active" };

const FIELDS = [
  { key: "name", label: "Supplier name", required: true, placeholder: "Accra Auto Spares Ltd.", span: 2 },
  { key: "phone", label: "Phone", required: true, placeholder: "030 276 4410" },
  { key: "email", label: "Email", type: "email", required: true, placeholder: "sales@supplier.gh" },
  { key: "city", label: "City", placeholder: "Accra", span: 2 },
];

export function AddSupplierButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
    >
      <Plus size={12} />
      Add supplier
    </button>
  );
}

export default function AddSupplierModal({ isOpen, onClose, onCreated }) {
  const handleSave = (form) => {
    try {
      const created = saveSupplier({ ...form, status: "Active" });
      toast.success(`${created.name} added.`);
      onCreated?.(created);
      onClose?.();
    } catch (error) {
      toast.error(error.message || "Could not add supplier.");
    }
  };

  return (
    <CatalogFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title="Add supplier"
      subtitle="Create a supplier to use on this receipt."
      saveLabel="Add supplier"
      overlayClassName="!z-[10001]"
      fields={FIELDS}
      initialValues={EMPTY_FORM}
    />
  );
}
