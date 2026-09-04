import React, { useEffect, useMemo, useState } from "react";
import { toast } from "../../components/common/ToastNotification";
import { TableViewAction } from "../../components/common/tableActions";
import { listStores, getStore, createStore, updateStore, formatStoreManagerName } from "../../services/storesService";
import { formatStoreLocation } from "../../utils/displayFormatters";
import {
  StoreLocationDisplay,
  UserNameDisplay,
} from "../../components/common/display/FormattedDisplay";
import { listUsers } from "../../services/usersService";
import { listRoles } from "../../services/rolesService";
import { formatApiDateTime, sortNewestFirst } from "../../utils/apiResponseHelpers";
import CatalogTable, { StatusBadge } from "./components/CatalogTable";
import CatalogDetailModal from "./components/CatalogDetailModal";
import CatalogFormModal from "./components/CatalogFormModal";
import { usePermission } from "../../hooks/usePermission";
import { ACTIONS, RESOURCES } from "../../permissions/accessMap";

const EMPTY_FORM = {
  name: "",
  code: "",
  address: "",
  city: "",
  region: "",
  manager_id: "",
  is_active: true,
};

const isStoreManagerRole = (role) =>
  String(role?.name || "").toUpperCase() === "STORE_MANAGER";

export default function StoreManagementList() {
  const { can } = usePermission();
  const canAdd = can(RESOURCES.stores, ACTIONS.create);
  const canEdit = can(RESOURCES.stores, ACTIONS.update);
  const canReadUsers = can(RESOURCES.users, ACTIONS.read);
  const canReadRoles = can(RESOURCES.roles, ACTIONS.read);
  const canPickManagers = canReadUsers && canReadRoles;
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [storeManagerRoleId, setStoreManagerRoleId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const roleLabel = (roleId) =>
    roles.find((role) => Number(role.id) === Number(roleId))?.label || "—";

  const storeManagers = useMemo(() => {
    const managers = users.filter(
      (user) =>
        user.isActive !== false
        && storeManagerRoleId != null
        && Number(user.roleId) === Number(storeManagerRoleId),
    );
    // Keep a currently assigned manager visible even if role filter would hide them.
    const assignedId = editing?.manager?.id ?? viewing?.manager?.id;
    if (assignedId != null && !managers.some((user) => user.id === assignedId)) {
      const assigned = users.find((user) => user.id === assignedId);
      if (assigned) return [...managers, assigned];
    }
    return managers;
  }, [users, storeManagerRoleId, editing, viewing]);

  const storeManagerOptions = useMemo(
    () =>
      storeManagers.map((user) => ({
        value: String(user.id),
        label: user.name,
        description: roleLabel(user.roleId),
      })),
    [storeManagers, roles],
  );

  const reload = async () => {
    setTableLoading(true);
    setTableError(null);
    try {
      setRows(sortNewestFirst(await listStores()));
    } catch (err) {
      setTableError(err.message || "Unable to load stores.");
    } finally {
      setTableLoading(false);
    }
    try {
      if (!canPickManagers) {
        setUsers([]);
        setRoles([]);
        setStoreManagerRoleId(null);
      } else {
        const [userRows, roleRows] = await Promise.all([listUsers(), listRoles()]);
        setUsers(userRows);
        setRoles(roleRows);
        setStoreManagerRoleId(roleRows.find(isStoreManagerRole)?.id ?? null);
      }
    } catch {
      setUsers([]);
      setRoles([]);
      setStoreManagerRoleId(null);
    }
  };

  useEffect(() => {
    reload();
  }, [canPickManagers]);

  const openAdd = () => {
    setEditing(null);
    setEditTarget(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openView = async (row) => {
    setViewing(row);
    setViewLoading(true);
    setViewError(null);
    try {
      setViewing(await getStore(row.id));
    } catch (err) {
      setViewError(err.message || "Unable to load store.");
    } finally {
      setViewLoading(false);
    }
  };

  const openEdit = async (row) => {
    setEditTarget(row);
    setEditing(row);
    setFormLoading(true);
    setFormError(null);
    setModalOpen(true);
    try {
      setEditing(await getStore(row.id));
    } catch (err) {
      setFormError(err.message || "Unable to load store.");
    } finally {
      setFormLoading(false);
    }
  };

  const fields = useMemo(
    () => [
      { key: "name", label: "Store name", required: true, placeholder: "Accra Central Store", span: 2 },
      {
        key: "code",
        label: "Code",
        placeholder: "ACS",
        hidden: () => !editing,
      },
      { key: "address", label: "Address", placeholder: "Ringway Estates" },
      { key: "city", label: "City", placeholder: "Accra" },
      { key: "region", label: "Region", placeholder: "Greater Accra" },
      {
        key: "manager_id",
        label: "Store manager (Optional)",
        type: "search-select",
        placeholder: !canPickManagers
          ? "Access denied"
          : storeManagerOptions.length
            ? "Search store managers…"
            : "No store managers available",
        options: canPickManagers ? storeManagerOptions : [],
        disabled: !canPickManagers,
      },
      {
        key: "is_active",
        label: "Active",
        type: "toggle",
        span: 2,
        activeValue: true,
        inactiveValue: false,
        description: "Inactive stores are hidden from inventory, supplies, and transfers.",
      },
    ],
    [storeManagerOptions, editing, canPickManagers],
  );

  const handleSave = async (form) => {
    const payload = {
      name: (form.name || "").trim(),
      address: (form.address || "").trim() || null,
      city: (form.city || "").trim() || null,
      region: (form.region || "").trim() || null,
      manager_id: form.manager_id ? Number(form.manager_id) : null,
      is_active: form.is_active !== false,
    };

    if (editing) {
      try {
        const saved = await updateStore(editing.id, payload);
        toast.success("Store updated.");
        setModalOpen(false);
        if (viewing?.id === saved.id) setViewing(saved);
        reload();
      } catch (error) {
        toast.error(error.message || "Could not save store.");
      }
      return;
    }

    try {
      await createStore(payload);
      toast.success("Store added.");
      setModalOpen(false);
      reload();
    } catch (error) {
      toast.error(error.message || "Could not save store.");
    }
  };

  return (
    <>
      <CatalogTable
        rows={rows}
        searchKeys={["name", "address", "city", "region", "code", "managerName"]}
        searchPlaceholder="Search stores..."
        emptyLabel="No stores yet."
        addLabel="Add store"
        onAdd={canAdd ? openAdd : undefined}
        loading={tableLoading}
        error={tableError}
        onRetry={reload}
        columns={[
          { key: "code", label: "Code", render: (row) => row.code || "—" },
          {
            key: "name",
            label: "Store",
            render: (row) => (
              <div>
                <StoreLocationDisplay value={row.name} className="font-semibold text-slate-900" />
                <p className="text-[11px] text-slate-400">{row.address || "—"}</p>
              </div>
            ),
          },
          { key: "city", label: "City" },
          { key: "region", label: "Region" },
          {
            key: "manager",
            label: "Store manager",
            render: (row) => <UserNameDisplay value={row.manager?.name || row.manager?.email} />,
          },
          { key: "createdAt", label: "Date created", render: (row) => formatApiDateTime(row.createdAt) },
          { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
        ]}
        renderActions={(row) => (
          <TableViewAction title="View store" onClick={() => openView(row)} />
        )}
      />

      <CatalogDetailModal
        isOpen={Boolean(viewing) && !modalOpen}
        onClose={() => {
          setViewing(null);
          setViewError(null);
        }}
        title="Store details"
        subtitle="Store locations used in inventory, supplies, and transfers."
        status={viewing?.status}
        identifier={viewing?.name}
        fields={[
          { label: "Store", value: formatStoreLocation(viewing?.name) },
          { label: "Code", value: viewing?.code },
          { label: "Address", value: viewing?.address || "—" },
          { label: "City", value: viewing?.city },
          { label: "Region", value: viewing?.region || "—" },
          { label: "Store manager", value: formatStoreManagerName(viewing?.manager) },
          { label: "Date created", value: formatApiDateTime(viewing?.createdAt) },
          { label: "Status", value: viewing?.status },
        ]}
        editLabel="Edit store"
        onEdit={canEdit ? () => openEdit(viewing) : undefined}
        loading={viewLoading}
        error={viewError}
        onRetry={() => viewing && openView(viewing)}
      />

      <CatalogFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setFormError(null);
          setEditTarget(null);
        }}
        onSave={handleSave}
        title={editing ? "Edit store" : "Add store"}
        subtitle="Stores added here appear in inventory, supplies, and inter-store transfers."
        saveLabel={editing ? "Save changes" : "Add store"}
        fields={fields}
        dialogClassName="max-w-2xl"
        loading={formLoading}
        error={formError}
        onRetry={() => editTarget && openEdit(editTarget)}
        initialValues={
          editing
            ? {
                ...EMPTY_FORM,
                ...editing,
                address: editing.address || "",
                city: editing.city || "",
                region: editing.region || "",
                manager_id: editing.manager?.id != null ? String(editing.manager.id) : "",
                is_active: editing.isActive !== false,
              }
            : EMPTY_FORM
        }
      />
    </>
  );
}
