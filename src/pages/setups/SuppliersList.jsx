import React, { useEffect, useMemo, useState } from "react";
import { toast } from "../../components/common/ToastNotification";
import { TableViewAction } from "../../components/common/tableActions";
import { listSuppliers, getSupplier, createSupplier, updateSupplier } from "../../services/suppliersService";
import { formatApiDateTime, sortNewestFirst } from "../../utils/apiResponseHelpers";
import CatalogTable, { StatusBadge } from "./components/CatalogTable";
import CatalogDetailModal from "./components/CatalogDetailModal";
import CatalogFormModal from "./components/CatalogFormModal";

const EMPTY_FORM = { name: "", phone: "", email: "", address: "", is_active: true };

export default function SuppliersList() {
  const [rows, setRows] = useState([]);
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

  const reload = async () => {
    setTableLoading(true);
    setTableError(null);
    try {
      setRows(sortNewestFirst(await listSuppliers()));
    } catch (err) {
      setTableError(err.message || "Unable to load suppliers.");
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

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
      setViewing(await getSupplier(row.id));
    } catch (err) {
      setViewError(err.message || "Unable to load supplier.");
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
      setEditing(await getSupplier(row.id));
    } catch (err) {
      setFormError(err.message || "Unable to load supplier.");
    } finally {
      setFormLoading(false);
    }
  };

  const fields = useMemo(
    () => [
      { key: "name", label: "Supplier name", required: true, placeholder: "Accra Auto Spares Ltd.", span: 2 },
      { key: "phone", label: "Phone", placeholder: "030 276 4410" },
      { key: "email", label: "Email", type: "email", placeholder: "sales@supplier.gh" },
      { key: "address", label: "Address", placeholder: "Ringway Estates", span: 2 },
      {
        key: "is_active",
        label: "Active",
        type: "toggle",
        span: 2,
        activeValue: true,
        inactiveValue: false,
        hidden: () => !editing,
        description: "Inactive suppliers are hidden from receive-into-store dropdowns.",
      },
    ],
    [editing],
  );

  const handleSave = async (form) => {
    const email = (form.email || "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.warning("Enter a valid email address.");
      return;
    }

    const payload = {
      name: (form.name || "").trim(),
      phone: (form.phone || "").trim() || null,
      email: email || null,
      address: (form.address || "").trim() || null,
      is_active: form.is_active !== false,
    };

    if (editing) {
      try {
        const saved = await updateSupplier(editing.id, payload);
        toast.success("Supplier updated.");
        setModalOpen(false);
        if (viewing?.id === saved.id) setViewing(saved);
        reload();
      } catch (error) {
        toast.error(error.message || "Could not save supplier.");
      }
      return;
    }

    try {
      await createSupplier({
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
      });
      toast.success("Supplier added.");
      setModalOpen(false);
      reload();
    } catch (error) {
      toast.error(error.message || "Could not save supplier.");
    }
  };

  const toggleSupplierStatus = async () => {
    if (!viewing) return;
    try {
      const saved = await updateSupplier(viewing.id, {
        name: viewing.name,
        phone: viewing.phone || null,
        email: viewing.email || null,
        address: viewing.address || null,
        is_active: !viewing.isActive,
      });
      toast.success(saved.isActive ? "Supplier activated." : "Supplier deactivated.");
      setViewing(saved);
      reload();
    } catch (err) {
      toast.error(err.message || "Unable to update supplier status.");
    }
  };

  return (
    <>
      <CatalogTable
        rows={rows}
        searchKeys={["name", "address", "email", "phone"]}
        searchPlaceholder="Search suppliers..."
        emptyLabel="No suppliers yet."
        addLabel="Add supplier"
        onAdd={openAdd}
        loading={tableLoading}
        error={tableError}
        onRetry={reload}
        columns={[
          {
            key: "name",
            label: "Supplier",
            render: (row) => (
              <div>
                <p className="font-semibold text-slate-900">{row.name}</p>
                <p className="text-[11px] text-slate-400">{row.address || "—"}</p>
              </div>
            ),
          },
          { key: "phone", label: "Phone", render: (row) => row.phone || "—" },
          { key: "email", label: "Email", render: (row) => row.email || "—" },
          { key: "createdAt", label: "Date created", render: (row) => formatApiDateTime(row.createdAt) },
          { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
        ]}
        renderActions={(row) => (
          <TableViewAction title="View supplier" onClick={() => openView(row)} />
        )}
      />

      <CatalogDetailModal
        isOpen={Boolean(viewing) && !modalOpen}
        onClose={() => {
          setViewing(null);
          setViewError(null);
        }}
        title="Supplier details"
        subtitle="Suppliers used when receiving accessories into a store."
        status={viewing?.status}
        identifier={viewing?.email || viewing?.name}
        fields={[
          { label: "Supplier", value: viewing?.name },
          { label: "Phone", value: viewing?.phone || "—" },
          { label: "Email", value: viewing?.email || "—" },
          { label: "Address", value: viewing?.address || "—" },
          { label: "Date created", value: formatApiDateTime(viewing?.createdAt) },
          { label: "Status", value: viewing?.status },
        ]}
        editLabel="Edit supplier"
        onEdit={() => openEdit(viewing)}
        onToggleStatus={toggleSupplierStatus}
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
        title={editing ? "Edit supplier" : "Add supplier"}
        subtitle="Suppliers appear when receiving accessories into a store."
        saveLabel={editing ? "Save changes" : "Add supplier"}
        fields={fields}
        loading={formLoading}
        error={formError}
        onRetry={() => editTarget && openEdit(editTarget)}
        initialValues={
          editing
            ? {
                ...EMPTY_FORM,
                ...editing,
                phone: editing.phone || "",
                email: editing.email || "",
                address: editing.address || "",
                is_active: editing.isActive !== false,
              }
            : EMPTY_FORM
        }
      />
    </>
  );
}
