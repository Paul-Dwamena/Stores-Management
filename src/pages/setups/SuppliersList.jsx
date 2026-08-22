import React, { useState } from "react";
import { toast } from "../../components/common/ToastNotification";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { TableViewAction } from "../../components/common/tableActions";
import { getSuppliers, saveSupplier, setSupplierStatus } from "../../mockdata/org/suppliers";
import CatalogTable, { StatusBadge } from "./components/CatalogTable";
import CatalogDetailModal from "./components/CatalogDetailModal";
import CatalogFormModal from "./components/CatalogFormModal";

const EMPTY_FORM = { name: "", phone: "", email: "", city: "", status: "Active" };

const FIELDS = [
  { key: "name", label: "Supplier name", required: true, placeholder: "Accra Auto Spares Ltd.", span: 2 },
  { key: "phone", label: "Phone", required: true, placeholder: "030 276 4410" },
  { key: "email", label: "Email", type: "email", required: true, placeholder: "sales@supplier.gh" },
  { key: "city", label: "City", placeholder: "Accra", span: 2 },
  {
    key: "status",
    label: "Active",
    type: "toggle",
    span: 2,
    activeValue: "Active",
    inactiveValue: "Inactive",
    description: "Inactive suppliers are hidden from receive-into-store dropdowns.",
  },
];

export default function SuppliersList() {
  const [rows, setRows] = useState(() => getSuppliers());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const reload = () => setRows(getSuppliers());

  const handleSave = (form) => {
    try {
      const saved = saveSupplier(form, { id: editing?.id });
      toast.success(editing ? "Supplier updated." : "Supplier added.");
      setModalOpen(false);
      if (saved?.id && viewing?.id === saved.id) setViewing(saved);
      reload();
    } catch (error) {
      toast.error(error.message || "Could not save supplier.");
    }
  };

  return (
    <>
      <CatalogTable
        rows={rows}
        searchKeys={["name", "city", "email", "phone"]}
        searchPlaceholder="Search suppliers..."
        emptyLabel="No suppliers yet."
        addLabel="Add supplier"
        onAdd={() => {
          setEditing(null);
          setModalOpen(true);
        }}
        columns={[
          { key: "name", label: "Supplier", render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
          { key: "city", label: "City" },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
        ]}
        renderActions={(row) => (
          <TableViewAction title="View supplier" onClick={() => setViewing(row)} />
        )}
      />
      <CatalogDetailModal
        isOpen={Boolean(viewing) && !modalOpen && !statusTarget}
        onClose={() => setViewing(null)}
        title="Supplier details"
        subtitle="Suppliers used when receiving accessories into a store."
        status={viewing?.status}
        identifier={viewing?.email}
        fields={[
          { label: "Supplier", value: viewing?.name },
          { label: "City", value: viewing?.city },
          { label: "Phone", value: viewing?.phone },
          { label: "Email", value: viewing?.email },
          { label: "Status", value: viewing?.status },
        ]}
        editLabel="Edit supplier"
        onEdit={() => {
          setEditing(viewing);
          setModalOpen(true);
        }}
        onToggleStatus={() => setStatusTarget(viewing)}
      />
      <CatalogFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        title={editing ? "Edit supplier" : "Add supplier"}
        subtitle="Suppliers appear when receiving accessories into a store."
        saveLabel={editing ? "Save changes" : "Add supplier"}
        fields={FIELDS}
        initialValues={editing ? { ...EMPTY_FORM, ...editing } : EMPTY_FORM}
      />
      <ConfirmationModal
        isOpen={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={() => {
          if (!statusTarget) return;
          const next = statusTarget.status === "Active" ? "Inactive" : "Active";
          const updated = setSupplierStatus(statusTarget.id, next);
          toast.success(`${statusTarget.name} is now ${next.toLowerCase()}.`);
          setStatusTarget(null);
          if (updated) setViewing(updated);
          reload();
        }}
        title={statusTarget?.status === "Active" ? "Deactivate supplier?" : "Activate supplier?"}
        message="Inactive suppliers are hidden from receive-into-store dropdowns."
        confirmText={statusTarget?.status === "Active" ? "Deactivate" : "Activate"}
        isDanger={statusTarget?.status === "Active"}
      />
    </>
  );
}
