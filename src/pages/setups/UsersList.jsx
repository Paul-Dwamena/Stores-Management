import React, { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { toast } from "../../components/common/ToastNotification";
import { TableViewAction } from "../../components/common/tableActions";
import { listUsers, getUser } from "../../services/usersService";
import { listRoles } from "../../services/rolesService";
import { formatApiDateTime, sortNewestFirst } from "../../utils/apiResponseHelpers";
import CatalogTable, { StatusBadge } from "./components/CatalogTable";
import CatalogDetailModal from "./components/CatalogDetailModal";
import UserFormModal from "./components/UserFormModal";
import { UserNameDisplay } from "../../components/common/display/FormattedDisplay";
import { formatUserName } from "../../utils/displayFormatters";
import { usePermission } from "../../hooks/usePermission";
import { ACTIONS, RESOURCES } from "../../permissions/accessMap";

export default function UsersList() {
  const { can } = usePermission();
  const canAdd = can(RESOURCES.users, ACTIONS.create);
  const canEdit = can(RESOURCES.users, ACTIONS.update);
  const canReadRoles = can(RESOURCES.roles, ACTIONS.read);
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState(null);

  const roleLabel = (roleId) => {
    if (!canReadRoles) {
      return (
        <span
          className="inline-flex items-center gap-1 text-slate-400 italic"
          title="You don't have permission to view roles"
        >
          <Info size={12} className="shrink-0" aria-hidden="true" />
          Access denied
        </span>
      );
    }
    return roles.find((role) => role.id === roleId)?.label || "—";
  };

  const reload = async () => {
    setTableLoading(true);
    setTableError(null);
    try {
      const users = await listUsers();
      setRows(sortNewestFirst(users));

      if (canReadRoles) {
        try {
          setRoles(await listRoles());
        } catch {
          setRoles([]);
        }
      } else {
        setRoles([]);
      }
    } catch (err) {
      setTableError(err.message || "Unable to load users.");
      setRows([]);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [canReadRoles]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = async (row) => {
    try {
      setEditing(await getUser(row.id));
      setModalOpen(true);
    } catch (err) {
      toast.error(err.message || "Unable to load user.");
    }
  };

  const openView = async (row) => {
    setViewing(row);
    setViewLoading(true);
    setViewError(null);
    try {
      setViewing(await getUser(row.id));
    } catch (err) {
      setViewError(err.message || "Unable to load user.");
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <>
      <CatalogTable
        rows={rows}
        searchKeys={["name", "firstName", "lastName", "email", "phone"]}
        searchPlaceholder="Search users..."
        emptyLabel="No users yet."
        addLabel="Add user"
        onAdd={canAdd ? openAdd : undefined}
        loading={tableLoading}
        error={tableError}
        onRetry={reload}
        columns={[
          {
            key: "name",
            label: "Name",
            render: (row) => (
              <div>
                <UserNameDisplay value={row.name} className="font-semibold text-slate-900" />
                <p className="text-[11px] text-slate-400">{row.email}</p>
              </div>
            ),
          },
          { key: "phone", label: "Phone", render: (row) => row.phone || "—" },
          { key: "role", label: "Role", render: (row) => roleLabel(row.roleId) },
          { key: "createdAt", label: "Date created", render: (row) => formatApiDateTime(row.createdAt) },
          { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
        ]}
        renderActions={(row) => (
          <TableViewAction title="View user" onClick={() => openView(row)} />
        )}
      />

      <CatalogDetailModal
        isOpen={Boolean(viewing) && !modalOpen}
        onClose={() => {
          setViewing(null);
          setViewError(null);
        }}
        title="User details"
        subtitle="Account used to sign in and work in stores."
        status={viewing?.status}
        identifier={viewing?.email}
        fields={[
          { label: "Name", value: formatUserName(viewing?.name) },
          { label: "Email", value: viewing?.email },
          { label: "Phone", value: viewing?.phone || "—" },
          { label: "Role", value: roleLabel(viewing?.roleId) },
          { label: "Date created", value: formatApiDateTime(viewing?.createdAt) },
          { label: "Status", value: viewing?.status },
        ]}
        editLabel="Edit user"
        onEdit={canEdit ? () => openEdit(viewing) : undefined}
        loading={viewLoading}
        error={viewError}
        onRetry={() => viewing && openView(viewing)}
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
    </>
  );
}
