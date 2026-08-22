import React, { useState } from "react";
import { toast } from "../../components/common/ToastNotification";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { TableViewAction } from "../../components/common/tableActions";
import { getUsers, setUserStatus } from "../../mockdata/org/users";
import CatalogTable, { StatusBadge } from "./components/CatalogTable";
import CatalogDetailModal from "./components/CatalogDetailModal";
import UserFormModal from "./components/UserFormModal";

export default function UsersList() {
  const [rows, setRows] = useState(() => getUsers());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);

  const reload = () => setRows(getUsers());

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setModalOpen(true);
  };

  return (
    <>
      <CatalogTable
        rows={rows}
        searchKeys={["name", "firstName", "lastName", "email", "role", "store"]}
        searchPlaceholder="Search users..."
        emptyLabel="No users yet."
        addLabel="Add user"
        onAdd={openAdd}
        columns={[
          {
            key: "name",
            label: "Name",
            render: (row) => (
              <div>
                <p className="font-semibold text-slate-900">{row.name}</p>
                <p className="text-[11px] text-slate-400">{row.email}</p>
              </div>
            ),
          },
          { key: "phone", label: "Phone" },
          { key: "role", label: "Role" },
          { key: "store", label: "Store" },
          { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
        ]}
        renderActions={(row) => (
          <TableViewAction title="View user" onClick={() => setViewing(row)} />
        )}
      />

      <CatalogDetailModal
        isOpen={Boolean(viewing) && !modalOpen && !statusTarget}
        onClose={() => setViewing(null)}
        title="User details"
        subtitle="Account used to sign in and work in stores."
        status={viewing?.status}
        identifier={viewing?.email}
        fields={[
          { label: "Name", value: viewing?.name },
          { label: "Email", value: viewing?.email },
          { label: "Phone", value: viewing?.phone },
          { label: "Role", value: viewing?.role },
          { label: "Store", value: viewing?.store },
          { label: "Status", value: viewing?.status },
        ]}
        editLabel="Edit user"
        onEdit={() => openEdit(viewing)}
        onToggleStatus={() => setStatusTarget(viewing)}
      />

      <UserFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        onSaved={(saved) => {
          reload();
          if (saved?.id && viewing?.id === saved.id) setViewing(saved);
        }}
      />

      <ConfirmationModal
        isOpen={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={() => {
          if (!statusTarget) return;
          const next = statusTarget.status === "Active" ? "Inactive" : "Active";
          const updated = setUserStatus(statusTarget.id, next);
          toast.success(`${statusTarget.name} is now ${next.toLowerCase()}.`);
          setStatusTarget(null);
          if (updated) setViewing(updated);
          reload();
        }}
        title={statusTarget?.status === "Active" ? "Deactivate user?" : "Activate user?"}
        message={
          statusTarget
            ? `${statusTarget.name} will be marked ${statusTarget.status === "Active" ? "inactive" : "active"}.`
            : ""
        }
        confirmText={statusTarget?.status === "Active" ? "Deactivate" : "Activate"}
        isDanger={statusTarget?.status === "Active"}
      />
    </>
  );
}
