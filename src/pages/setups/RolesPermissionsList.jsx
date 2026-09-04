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
  isBuiltInRole,
  isSuperAdminSystemRole,
} from "../../services/rolesService";
import { formatApiDateTime, sortNewestFirst } from "../../utils/apiResponseHelpers";
import CatalogTable from "./components/CatalogTable";
import RoleFormModal from "./roles/components/RoleFormModal";
import ViewRoleModal from "./roles/components/ViewRoleModal";
import { usePermission } from "../../hooks/usePermission";
import { useAuth } from "../../context/useAuth";
import { ACTIONS, RESOURCES } from "../../permissions/accessMap";

export default function RolesPermissionsList() {
  const { can } = usePermission();
  const { user, refreshPermissions } = useAuth();
  const canAdd = can(RESOURCES.roles, ACTIONS.create);
  const canEdit = can(RESOURCES.roles, ACTIONS.update);
  const canDelete = can(RESOURCES.roles, ACTIONS.delete);
  const canReadPermissions = can(RESOURCES.permissions, ACTIONS.read);
  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
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

  const reload = async ({ refreshCatalog = false, quiet = false } = {}) => {
    if (!quiet) {
      setTableLoading(true);
      setTableError(null);
    }
    try {
      const rolesPromise = listRoles();
      const catalogPromise =
        refreshCatalog || !catalog.length
          ? canReadPermissions
            ? listPermissions().catch(() => [])
            : Promise.resolve([])
          : Promise.resolve(catalog);

      const [nextRoles, nextCatalog] = await Promise.all([rolesPromise, catalogPromise]);
      setRoles(sortNewestFirst(nextRoles));
      if (refreshCatalog || !catalog.length) {
        setCatalog(nextCatalog);
      }
      if (quiet) setTableError(null);
    } catch (err) {
      if (!quiet) {
        setTableError(err.message || "Unable to load roles.");
      }
    } finally {
      if (!quiet) setTableLoading(false);
    }
  };

  useEffect(() => {
    reload({ refreshCatalog: true });
  }, [canReadPermissions]);

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
    if (!row || isSuperAdminSystemRole(row)) return;
    setEditTarget(row);
    setFormError(null);
    setFormOpen(true);

    // View (and some list payloads) may already include permissions — skip a repeat GET.
    if (Array.isArray(row.permissions)) {
      setEditing(row);
      setFormLoading(false);
      return;
    }

    setEditing(null);
    setFormLoading(true);
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
      if (isSuperAdminSystemRole(editing)) return;
      try {
        const nameLocked = isBuiltInRole(editing);
        const saved = await updateRole(editing.id, {
          name: nameLocked ? editing.name : form.name.trim(),
          description: form.description.trim(),
          permission_ids: (form.permission_ids || []).map(Number),
        });
        toast.success("Role updated.");

        const merged = mergeRole(
          {
            ...editing,
            description: form.description.trim(),
            name: nameLocked ? editing.name : form.name.trim(),
          },
          saved,
        );
        setRoles((current) =>
          sortNewestFirst(
            current.map((role) => (Number(role.id) === Number(editing.id) ? {
              ...role,
              ...merged,
              permissionCount: merged.permissions?.length ?? merged.permissionCount ?? role.permissionCount,
            } : role)),
          ),
        );
        if (viewing?.id === editing.id) {
          setViewing(merged);
        }

        // Refresh list / session in the background so the modal can close immediately.
        void reload({ quiet: true });
        if (Number(user?.roleId) === Number(editing.id)) {
          void refreshPermissions({ quiet: true });
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
      void reload({ quiet: true });
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
        onAdd={canAdd ? openAdd : undefined}
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
                {isBuiltInRole(row) ? (
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
        canReadPermissions={canReadPermissions}
        loading={viewLoading}
        error={viewError}
        onRetry={() => viewing && openView(viewing)}
        onEdit={viewing && canEdit && !isSuperAdminSystemRole(viewing) ? () => openEdit(viewing) : undefined}
        onDelete={viewing && canDelete && !isBuiltInRole(viewing) ? () => setDeleteTarget(viewing) : undefined}
      />

      <RoleFormModal
        isOpen={formOpen}
        onClose={closeForm}
        onSave={handleSave}
        editingRole={editing}
        existingRoles={roles}
        catalog={catalog}
        canReadPermissions={canReadPermissions}
        nameLocked={Boolean(editing && isBuiltInRole(editing))}
        loading={formLoading}
        error={formError}
        onRetry={() => editTarget && openEdit(editTarget)}
      />

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          if (deleteLoading) return;
          setDeleteTarget(null);
        }}
        onConfirm={async () => {
          if (!deleteTarget || isBuiltInRole(deleteTarget) || deleteLoading) return;
          setDeleteLoading(true);
          try {
            await deleteRole(deleteTarget.id);
            toast.success("Role deleted.");
            setDeleteTarget(null);
            setViewing(null);
            reload();
          } catch (error) {
            toast.error(error.message ?? "Could not delete role.");
          } finally {
            setDeleteLoading(false);
          }
        }}
        closeOnConfirm={false}
        confirmLoading={deleteLoading}
        title="Delete role?"
        message={
          deleteTarget
            ? `Remove "${deleteTarget.label || deleteTarget.name}"? Users assigned to this role may lose access.`
            : ""
        }
        confirmText={deleteLoading ? "Deleting…" : "Delete role"}
        isDanger
      />
    </>
  );
}
