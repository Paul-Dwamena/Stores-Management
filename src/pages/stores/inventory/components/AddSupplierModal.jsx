import React from "react";
import { Plus } from "lucide-react";
import { toast } from "../../../../components/common/ToastNotification";
import { createSupplier } from "../../../../services/suppliersService";
import CatalogFormModal from "../../../setups/components/CatalogFormModal";

const EMPTY_FORM = { name: "", phone: "", email: "", address: "" };

const FIELDS = [
  { key: "name", label: "Supplier name", required: true, placeholder: "Accra Auto Spares Ltd.", span: 2 },
  { key: "phone", label: "Phone", placeholder: "030 276 4410" },
  { key: "email", label: "Email", type: "email", placeholder: "sales@supplier.gh" },
  { key: "address", label: "Address", placeholder: "Ringway Estates", span: 2 },
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
  const handleSave = async (form) => {
    const email = form.email?.trim() || "";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.warning("Enter a valid email address.");
      return;
    }
    try {
      const created = await createSupplier({
        name: form.name.trim(),
        phone: form.phone?.trim() || null,
        email: email || null,
        address: form.address?.trim() || null,
      });
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
