import React, { useEffect, useState } from "react";
import { toast } from "../../components/common/ToastNotification";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { TableViewAction } from "../../components/common/tableActions";
import {
  listRoles,
  createRole,
  getRole,
  updateRole,
  deleteRole,
  listPermissions,
  isProtectedRole,
} from "../../services/rolesService";
import { formatApiDateTime, sortNewestFirst } from "../../utils/apiResponseHelpers";
import CatalogTable from "./components/CatalogTable";
import RoleFormModal from "./roles/components/RoleFormModal";
import ViewRoleModal from "./roles/components/ViewRoleModal";

export default function RolesPermissionsList() {
  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const mergeRole = (row, detail) => ({
    ...row,
    ...detail,
    description: row?.description ?? detail?.description,
    createdAt: row?.createdAt ?? detail?.createdAt,
  });

  const reload = async () => {
    setTableLoading(true);
    setTableError(null);
    try {
      setRoles(sortNewestFirst(await listRoles()));
    } catch (err) {
      setTableError(err.message || "Unable to load roles.");
    } finally {
      setTableLoading(false);
    }
    try {
      setCatalog(await listPermissions());
    } catch {
      /* permission catalog is optional for the list view */
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setEditTarget(null);
    setFormError(null);
  };

  const openAdd = () => {
    setEditing(null);
    setEditTarget(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openView = async (row) => {
    setViewing(row);
    setViewLoading(true);
    setViewError(null);
    try {
      setViewing(mergeRole(row, await getRole(row.id)));
    } catch (err) {
      setViewError(err.message || "Unable to load role.");
    } finally {
      setViewLoading(false);
    }
  };

  const openEdit = async (row) => {
    if (!row || isProtectedRole(row)) return;
    setEditTarget(row);
    setFormLoading(true);
    setFormError(null);
    setFormOpen(true);
    try {
      const detail = await getRole(row.id);
      setEditing(mergeRole(row, detail));
    } catch (err) {
      setFormError(err.message || "Unable to load role.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSave = async (form) => {
    if (editing) {
      if (isProtectedRole(editing)) return;
      try {
        const saved = await updateRole(editing.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          permission_ids: (form.permission_ids || []).map(Number),
        });
        toast.success("Role updated.");
        reload();
        if (viewing?.id === editing.id) {
          setViewing(mergeRole({ ...editing, description: form.description.trim() }, saved));
        }
      } catch (error) {
        toast.error(error.message ?? "Could not save role.");
        throw error;
      }
      return;
    }

    try {
      await createRole({
        name: form.name.trim(),
        description: form.description.trim(),
      });
      toast.success("Role created.");
      reload();
    } catch (error) {
      toast.error(error.message ?? "Could not save role.");
      throw error;
    }
  };

  return (
    <>
      <CatalogTable
        rows={roles}
        searchKeys={["name", "label", "description"]}
        searchPlaceholder="Search by role name or description..."
        emptyLabel="No roles yet."
        addLabel="Create Role"
        onAdd={openAdd}
        loading={tableLoading}
        error={tableError}
        onRetry={reload}
        columns={[
          {
            key: "name",
            label: "Role",
            render: (row) => (
              <div>
                <p className="font-semibold text-slate-900">{row.label}</p>
                {row.name && row.label !== row.name ? (
                  <p className="text-[11px] text-slate-400">{row.name}</p>
                ) : null}
                {isProtectedRole(row) ? (
                  <p className="text-[11px] text-slate-400">System role</p>
                ) : null}
              </div>
            ),
          },
          { key: "description", label: "Description", render: (row) => row.description || "—" },
          {
            key: "permissions",
            label: "Permissions",
            render: (row) => (
              <span className="font-bold text-amber-600">
                {row.permissionCount ?? 0}
              </span>
            ),
          },
          { key: "createdAt", label: "Date created", render: (row) => formatApiDateTime(row.createdAt) },
        ]}
        renderActions={(row) => (
          <TableViewAction title="View role" onClick={() => openView(row)} />
        )}
      />

      <ViewRoleModal
        isOpen={Boolean(viewing) && !formOpen && !deleteTarget}
        onClose={() => {
          setViewing(null);
          setViewError(null);
        }}
        role={viewing}
        catalog={catalog}
        loading={viewLoading}
        error={viewError}
        onRetry={() => viewing && openView(viewing)}
        onEdit={viewing && !isProtectedRole(viewing) ? () => openEdit(viewing) : undefined}
        onDelete={viewing && !isProtectedRole(viewing) ? () => setDeleteTarget(viewing) : undefined}
      />

      <RoleFormModal
        isOpen={formOpen}
        onClose={closeForm}
        onSave={handleSave}
        editingRole={editing}
        existingRoles={roles}
        catalog={catalog}
        loading={formLoading}
        error={formError}
        onRetry={() => editTarget && openEdit(editTarget)}
      />

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget || isProtectedRole(deleteTarget)) return;
          try {
            await deleteRole(deleteTarget.id);
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
            ? `Remove "${deleteTarget.label || deleteTarget.name}"? Users assigned to this role may lose access.`
            : ""
        }
        confirmText="Delete role"
        isDanger
      />
    </>
  );
}
