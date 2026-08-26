import React, { useEffect, useState } from "react";
import { toast } from "../../components/common/ToastNotification";
import { TableViewAction } from "../../components/common/tableActions";
import { listUsers, getUser, updateUser } from "../../services/usersService";
import { listRoles } from "../../services/rolesService";
import { formatApiDateTime, sortNewestFirst } from "../../utils/apiResponseHelpers";
import CatalogTable, { StatusBadge } from "./components/CatalogTable";
import CatalogDetailModal from "./components/CatalogDetailModal";
import UserFormModal from "./components/UserFormModal";

export default function UsersList() {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState(null);

  const roleName = (roleId) => roles.find((role) => role.id === roleId)?.label || "—";

  const reload = async () => {
    setTableLoading(true);
    setTableError(null);
    try {
      const [users, roleRows] = await Promise.all([listUsers(), listRoles()]);
      setRows(sortNewestFirst(users));
      setRoles(roleRows);
    } catch (err) {
      setTableError(err.message || "Unable to load users.");
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

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

  const toggleUserStatus = async () => {
    if (!viewing) return;
    try {
      const saved = await updateUser(viewing.id, {
        first_name: viewing.firstName,
        last_name: viewing.lastName,
        email: viewing.email,
        phone: viewing.phone || null,
        role_id: viewing.roleId,
        is_active: !viewing.isActive,
      });
      toast.success(saved.isActive ? "User activated." : "User deactivated.");
      setViewing(saved);
      reload();
    } catch (err) {
      toast.error(err.message || "Unable to update user status.");
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
        onAdd={openAdd}
        loading={tableLoading}
        error={tableError}
        onRetry={reload}
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
          { key: "phone", label: "Phone", render: (row) => row.phone || "—" },
          { key: "role", label: "Role", render: (row) => roleName(row.roleId) },
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
          { label: "Name", value: viewing?.name },
          { label: "Email", value: viewing?.email },
          { label: "Phone", value: viewing?.phone || "—" },
          { label: "Role", value: roleName(viewing?.roleId) },
          { label: "Date created", value: formatApiDateTime(viewing?.createdAt) },
          { label: "Status", value: viewing?.status },
        ]}
        editLabel="Edit user"
        onEdit={() => openEdit(viewing)}
        onToggleStatus={toggleUserStatus}
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
