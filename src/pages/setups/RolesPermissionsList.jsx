import React, { useState } from "react";
import { toast } from "../../components/common/ToastNotification";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { TableViewAction } from "../../components/common/tableActions";
import { deleteRole, getRoles, saveRole } from "../../mockdata/org/roles";
import CatalogTable from "./components/CatalogTable";
import RoleFormModal from "./roles/components/RoleFormModal";
import ViewRoleModal from "./roles/components/ViewRoleModal";
import { countRolePermissions } from "./roles/utils/roleHelpers";

export default function RolesPermissionsList() {
  const [roles, setRoles] = useState(() => getRoles());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const reload = () => setRoles(getRoles());

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleSave = (form) => {
    try {
      const saved = saveRole(form, { id: editing?.id });
      toast.success(editing ? "Role updated." : "Role created.");
      reload();
      if (saved?.id && viewing?.id === saved.id) setViewing(saved);
    } catch (error) {
      toast.error(error.message ?? "Could not save role.");
    }
  };

  return (
    <>
      <CatalogTable
        rows={roles}
        searchKeys={["name", "description"]}
        searchPlaceholder="Search by role name or description..."
        emptyLabel="No roles match your search."
        addLabel="Create Role"
        onAdd={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        columns={[
          {
            key: "name",
            label: "Role",
            render: (row) => (
              <div>
                <p className="font-semibold text-slate-900">{row.name}</p>
                {row.isSystem ? (
                  <p className="text-[11px] text-slate-400">System role</p>
                ) : null}
              </div>
            ),
          },
          { key: "description", label: "Description" },
          {
            key: "permissions",
            label: "Permissions",
            render: (row) => (
              <span className="font-bold text-amber-600">
                {countRolePermissions(row.permissions)}
              </span>
            ),
          },
        ]}
        renderActions={(row) => (
          <TableViewAction title="View role" onClick={() => setViewing(row)} />
        )}
      />

      <ViewRoleModal
        isOpen={Boolean(viewing) && !formOpen && !deleteTarget}
        onClose={() => setViewing(null)}
        role={viewing}
        onEdit={() => {
          setEditing(viewing);
          setFormOpen(true);
        }}
        onDelete={() => setDeleteTarget(viewing)}
      />

      <RoleFormModal
        isOpen={formOpen}
        onClose={closeForm}
        onSave={handleSave}
        editingRole={editing}
        existingRoles={roles}
      />

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          try {
            deleteRole(deleteTarget.id);
            toast.success("Role deleted.");
            setDeleteTarget(null);
            setViewing(null);
            reload();
          } catch (error) {
            toast.error(error.message ?? "Could not delete role.");
          }
        }}
        title="Delete role?"
        message={
          deleteTarget
            ? `Remove "${deleteTarget.name}"? Users assigned to this role may lose access.`
            : ""
        }
        confirmText="Delete role"
        isDanger
      />
    </>
  );
}
