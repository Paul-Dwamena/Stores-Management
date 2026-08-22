import React, { useMemo, useState } from "react";
import { toast } from "../../components/common/ToastNotification";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { TableViewAction } from "../../components/common/tableActions";
import { getStores, saveStore, setStoreStatus } from "../../mockdata/org/stores";
import { getStoreManagers, getUsers } from "../../mockdata/org/users";
import CatalogTable, { StatusBadge } from "./components/CatalogTable";
import CatalogDetailModal from "./components/CatalogDetailModal";
import CatalogFormModal from "./components/CatalogFormModal";

const EMPTY_FORM = {
  name: "",
  city: "",
  area: "",
  phone: "",
  managerId: "",
  status: "Active",
};

function resolveManagerId(store) {
  if (!store) return "";
  if (store.managerId) return store.managerId;
  return getUsers().find((user) => user.name === store.manager)?.id || "";
}

function storeManagerOptions(editing) {
  const options = getStoreManagers().map((user) => ({
    value: user.id,
    label: user.name,
  }));
  if (!editing) return options;
  const alreadyListed = options.some(
    (option) => option.value === editing.managerId || option.label === editing.manager,
  );
  if (alreadyListed) return options;
  const match = getUsers().find(
    (user) => user.id === editing.managerId || user.name === editing.manager,
  );
  if (match) return [{ value: match.id, label: match.name }, ...options];
  if (editing.manager) {
    return [{ value: editing.managerId || editing.manager, label: editing.manager }, ...options];
  }
  return options;
}

export default function StoreManagementList() {
  const [rows, setRows] = useState(() => getStores());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);

  const reload = () => setRows(getStores());

  const fields = useMemo(
    () => [
      { key: "name", label: "Store name", required: true, placeholder: "Accra Central Store", span: 2 },
      { key: "city", label: "City", required: true, placeholder: "Accra" },
      { key: "area", label: "Area", required: true, placeholder: "Ringway Estates" },
      { key: "phone", label: "Phone", placeholder: "030 222 1100" },
      {
        key: "managerId",
        label: "Store manager",
        type: "search-select",
        placeholder: "Search store managers…",
        options: storeManagerOptions(editing),
      },
      {
        key: "status",
        label: "Active",
        type: "toggle",
        span: 2,
        activeValue: "Active",
        inactiveValue: "Inactive",
        description: "Inactive stores are hidden from inventory, supplies, and transfers.",
      },
    ],
    [editing, modalOpen],
  );

  const handleSave = (form) => {
    try {
      const saved = saveStore(form, { id: editing?.id });
      toast.success(editing ? "Store updated." : "Store added.");
      setModalOpen(false);
      if (saved?.id && viewing?.id === saved.id) setViewing(saved);
      reload();
    } catch (error) {
      toast.error(error.message || "Could not save store.");
    }
  };

  return (
    <>
      <CatalogTable
        rows={rows}
        searchKeys={["code", "name", "area", "city", "manager", "label"]}
        searchPlaceholder="Search stores..."
        emptyLabel="No stores yet."
        addLabel="Add store"
        onAdd={() => {
          setEditing(null);
          setModalOpen(true);
        }}
        columns={[
          {
            key: "code",
            label: "Code",
            render: (row) => <span className="font-mono font-bold text-slate-800">{row.code}</span>,
          },
          {
            key: "name",
            label: "Store",
            render: (row) => (
              <div>
                <p className="font-semibold text-slate-900">{row.name}</p>
                <p className="text-[11px] text-slate-400">{row.area}</p>
              </div>
            ),
          },
          { key: "city", label: "City" },
          { key: "manager", label: "Manager" },
          { key: "phone", label: "Phone" },
          { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
        ]}
        renderActions={(row) => (
          <TableViewAction title="View store" onClick={() => setViewing(row)} />
        )}
      />

      <CatalogDetailModal
        isOpen={Boolean(viewing) && !modalOpen && !statusTarget}
        onClose={() => setViewing(null)}
        title="Store details"
        subtitle="Store locations used in inventory, supplies, and transfers."
        status={viewing?.status}
        identifier={viewing?.code}
        fields={[
          { label: "Code", value: viewing?.code },
          { label: "Store", value: viewing?.name },
          { label: "Area", value: viewing?.area },
          { label: "City", value: viewing?.city },
          { label: "Phone", value: viewing?.phone },
          { label: "Manager", value: viewing?.manager },
          { label: "Status", value: viewing?.status },
        ]}
        editLabel="Edit store"
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
        title={editing ? "Edit store" : "Add store"}
        subtitle="Stores added here appear in inventory, supplies, and inter-store transfers."
        saveLabel={editing ? "Save changes" : "Add store"}
        fields={fields}
        initialValues={
          editing
            ? { ...EMPTY_FORM, ...editing, managerId: resolveManagerId(editing) }
            : EMPTY_FORM
        }
      />

      <ConfirmationModal
        isOpen={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={() => {
          if (!statusTarget) return;
          const next = statusTarget.status === "Active" ? "Inactive" : "Active";
          const updated = setStoreStatus(statusTarget.id, next);
          toast.success(`${statusTarget.name} is now ${next.toLowerCase()}.`);
          setStatusTarget(null);
          if (updated) setViewing(updated);
          reload();
        }}
        title={statusTarget?.status === "Active" ? "Deactivate store?" : "Activate store?"}
        message={
          statusTarget
            ? `Inactive stores are hidden from inventory and transfer dropdowns.`
            : ""
        }
        confirmText={statusTarget?.status === "Active" ? "Deactivate" : "Activate"}
        isDanger={statusTarget?.status === "Active"}
      />
    </>
  );
}
