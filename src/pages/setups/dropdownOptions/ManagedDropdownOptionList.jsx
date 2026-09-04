import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import BackToDropdownOptionsLink from "../components/BackToDropdownOptionsLink";
import Button from "../../../components/common/base/Button";
import SearchInput from "../../../components/common/fields/SearchInput";
import AddModal from "../../../components/common/AddModal";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import InputField from "../../../components/common/fields/InputField";
import Label from "../../../components/common/base/Label";
import ToggleField from "../../../components/common/fields/ToggleField";
import SectionLoadState from "../../../components/common/SectionLoadState";
import {
  TableRowActions,
  TableViewAction,
} from "../../../components/common/tableActions";
import { toast } from "../../../components/common/ToastNotification";
import { BrandDisplay } from "../../../components/common/display/FormattedDisplay";
import { cn } from "../../../utils/cn";
import { usePermission } from "../../../hooks/usePermission";
import { ACTIONS, canDropdownOptionAction } from "../../../permissions/accessMap";
import CatalogDetailModal from "../components/CatalogDetailModal";
import {
  isApiBackedCatalogOption,
  refreshCatalogOptions,
} from "../../../services/catalogOptionsCache";
import {
  createBrand,
  deleteBrand,
  updateBrand,
} from "../../../services/brandsService";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "../../../services/categoriesService";
import {
  listManagedDropdownItems,
  replaceManagedDropdownItems,
} from "../../../mockdata/setups/dropdownOptionsStore";

const EMPTY_FORM = { name: "", description: "", active: true };

function StatusBadge({ active }) {
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border",
        active
          ? "bg-success-muted text-success border-[#b7d4c8]"
          : "bg-slate-100 text-slate-500 border-slate-200",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

async function loadItems(optionId) {
  if (isApiBackedCatalogOption(optionId)) {
    return refreshCatalogOptions(optionId);
  }
  return listManagedDropdownItems(optionId);
}

async function createCatalogItem(optionId, { name, description, active }) {
  const payload = {
    name,
    description: description || null,
  };
  if (optionId === "brands") {
    const created = await createBrand(payload);
    return {
      id: created.id,
      name: created.name,
      description: created.description || "",
      active: created.isActive !== false,
    };
  }
  if (optionId === "item-categories") {
    const created = await createCategory(payload);
    return {
      id: created.id,
      name: created.name,
      description: created.description || "",
      active: created.isActive !== false,
    };
  }
  return {
    id: `${optionId}-${Date.now()}`,
    name,
    description,
    active,
  };
}

async function updateCatalogItem(optionId, id, { name, description, active }) {
  if (optionId === "brands") {
    const updated = await updateBrand(id, {
      name,
      description,
      is_active: active,
    });
    return {
      id: updated.id,
      name: updated.name,
      description: updated.description || "",
      active: updated.isActive !== false,
    };
  }
  if (optionId === "item-categories") {
    const updated = await updateCategory(id, {
      name,
      description,
      is_active: active,
    });
    return {
      id: updated.id,
      name: updated.name,
      description: updated.description || "",
      active: updated.isActive !== false,
    };
  }
  return { id, name, description, active };
}

async function deleteCatalogItem(optionId, id) {
  if (optionId === "brands") {
    await deleteBrand(id);
    return;
  }
  if (optionId === "item-categories") {
    await deleteCategory(id);
    return;
  }
}

export default function ManagedDropdownOptionList({ optionId, title }) {
  const { can } = usePermission();
  const canAdd = canDropdownOptionAction(can, optionId, ACTIONS.create);
  const canEdit = canDropdownOptionAction(can, optionId, ACTIONS.update);
  const canDelete = canDropdownOptionAction(can, optionId, ACTIONS.delete);
  const usesApi = isApiBackedCatalogOption(optionId);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(usesApi));
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmAction, setConfirmAction] = useState(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    if (usesApi) {
      setLoading(true);
      setLoadError(null);
    }
    try {
      const rows = await loadItems(optionId);
      setItems(rows);
    } catch (error) {
      setItems([]);
      if (usesApi) {
        setLoadError(error.message || `Unable to load ${title.toLowerCase()}.`);
      }
    } finally {
      if (usesApi) setLoading(false);
    }
  }, [optionId, title, usesApi]);

  useEffect(() => {
    reload();
  }, [reload]);

  const syncItems = (next) => {
    setItems(next);
    if (!usesApi) {
      replaceManagedDropdownItems(optionId, next);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((row) => {
      const matchesSearch =
        !q ||
        row.name.toLowerCase().includes(q) ||
        (row.description || "").toLowerCase().includes(q);
      const matchesActiveStatus = showInactive
        ? row.active === false
        : true;
      return matchesSearch && matchesActiveStatus;
    });
  }, [items, search, showInactive]);

  const openCreate = () => {
    setViewing(null);
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openView = (row) => {
    setViewing(row);
  };

  const openEdit = (row) => {
    setViewing(null);
    setEditing(row);
    setForm({
      name: row.name,
      description: row.description || "",
      active: row.active !== false,
    });
    setModalOpen(true);
  };

  const requestDelete = (row) => {
    if (!row) return;
    setConfirmAction({
      type: "delete",
      id: row.id,
      name: row.name,
    });
  };

  const requestSave = () => {
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setModalOpen(false);
    setConfirmAction({
      type: editing ? "update" : "create",
      name: form.name.trim(),
      description: form.description.trim(),
      active: form.active,
      editingId: editing?.id,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || saving) return;
    setSaving(true);

    try {
      if (confirmAction.type === "delete") {
        if (usesApi) {
          await deleteCatalogItem(optionId, confirmAction.id);
          await reload();
        } else {
          syncItems(items.filter((row) => row.id !== confirmAction.id));
        }
        toast.success(`${title} item removed.`);
      } else if (confirmAction.type === "update") {
        if (usesApi) {
          await updateCatalogItem(optionId, confirmAction.editingId, {
            name: confirmAction.name,
            description: confirmAction.description,
            active: confirmAction.active,
          });
          await reload();
        } else {
          syncItems(
            items.map((row) =>
              row.id === confirmAction.editingId
                ? {
                    ...row,
                    name: confirmAction.name,
                    description: confirmAction.description,
                    active: confirmAction.active,
                  }
                : row,
            ),
          );
        }
        toast.success(`${title} item updated.`);
      } else if (usesApi) {
        await createCatalogItem(optionId, {
          name: confirmAction.name,
          description: confirmAction.description,
          active: confirmAction.active,
        });
        await reload();
        toast.success(`${title} item created.`);
      } else {
        syncItems([
          {
            id: `${optionId}-${Date.now()}`,
            name: confirmAction.name,
            description: confirmAction.description,
            active: confirmAction.active,
          },
          ...items,
        ]);
        toast.success(`${title} item created.`);
      }

      setConfirmAction(null);
      setEditing(null);
      setViewing(null);
      setForm(EMPTY_FORM);
    } catch (error) {
      toast.error(error.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const getConfirmModalProps = () => {
    if (!confirmAction) return null;
    if (confirmAction.type === "create") {
      return {
        title: "Create item?",
        message: `Add "${confirmAction.name}" to ${title}?`,
        confirmText: "Create",
        isDanger: false,
      };
    }
    if (confirmAction.type === "update") {
      return {
        title: "Save changes?",
        message: `Update "${confirmAction.name}" in ${title}?`,
        confirmText: "Save changes",
        isDanger: false,
      };
    }
    return {
      title: "Delete item?",
      message: `Remove "${confirmAction.name}"? This cannot be undone.`,
      confirmText: "Delete",
      isDanger: true,
    };
  };

  const confirmModalProps = getConfirmModalProps();
  const activeCount = items.filter((row) => row.active !== false).length;

  return (
    <div className="space-y-6 pb-8">
      <BackToDropdownOptionsLink />
      <PageHeader title={title} description={`Manage ${title.toLowerCase()} setups.`}>
        {canAdd ? (
          <Button onClick={openCreate} disabled={loading}>
            <Plus size={16} /> Add item
          </Button>
        ) : null}
      </PageHeader>

      <SectionLoadState
        loading={loading}
        error={loadError}
        onRetry={reload}
        variant="card"
      >
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <SearchInput
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <label className="flex items-center gap-2 text-[13px] text-slate-600 cursor-pointer select-none shrink-0">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-slate-900/25"
              />
              Show inactive
            </label>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Name</th>
                <th className="px-6 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-2.5 text-[10px] font-bold text-slate-500 uppercase text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-[13px] text-slate-400">
                    No items found.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3">
                      {optionId === "brands" ? (
                        <BrandDisplay value={row.name} className="text-[13px] font-bold text-slate-900" />
                      ) : (
                        <p className="text-[13px] font-bold text-slate-900">{row.name}</p>
                      )}
                      {row.description ? (
                        <p className="text-[12px] text-slate-500 mt-0.5">{row.description}</p>
                      ) : null}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge active={row.active !== false} />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <TableRowActions>
                        <TableViewAction title="View item" onClick={() => openView(row)} />
                      </TableRowActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="px-6 py-3 border-t border-slate-100 text-[12px] text-slate-500 flex gap-4">
            <span>
              <strong className="text-slate-700">{activeCount}</strong> active
            </span>
            <span>
              <strong className="text-slate-700">{items.length}</strong> total
            </span>
          </div>
        </div>
      </SectionLoadState>

      <CatalogDetailModal
        isOpen={Boolean(viewing) && !modalOpen && !confirmAction}
        onClose={() => setViewing(null)}
        title="Item details"
        subtitle={`Details for this ${title.toLowerCase()} entry.`}
        status={viewing?.active !== false ? "Active" : "Inactive"}
        identifier={viewing?.name}
        fields={[
          { label: "Name", value: viewing?.name },
          { label: "Description", value: viewing?.description || "—" },
          { label: "Status", value: viewing?.active !== false ? "Active" : "Inactive" },
        ]}
        editLabel="Edit"
        onEdit={canEdit && viewing ? () => openEdit(viewing) : undefined}
        deleteLabel="Delete"
        onDelete={canDelete && viewing ? () => requestDelete(viewing) : undefined}
      />

      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={requestSave}
        title={editing ? "Edit item" : "Create item"}
        subtitle={
          editing
            ? `Update entry for ${title}.`
            : `Add a new entry for ${title}.`
        }
        saveLabel={editing ? "Save changes" : "Create"}
      >
        <div className="space-y-4">
          <InputField
            label="Name *"
            id="dropdownOptionName"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Enter name"
          />
          <div className="space-y-1.5">
            <Label htmlFor="dropdownOptionDescription">Description</Label>
            <textarea
              id="dropdownOptionDescription"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-primary text-slate-700 resize-y min-h-[80px]"
            />
          </div>
          <ToggleField
            label="Active"
            description="Inactive items are hidden from dropdowns but kept in this list."
            checked={form.active}
            onChange={(active) => setForm((prev) => ({ ...prev, active }))}
          />
        </div>
      </AddModal>

      {confirmModalProps && (
        <ConfirmationModal
          isOpen={Boolean(confirmAction)}
          onClose={() => {
            if (saving) return;
            setConfirmAction(null);
          }}
          onConfirm={handleConfirmAction}
          title={confirmModalProps.title}
          message={confirmModalProps.message}
          confirmText={saving ? "Saving…" : confirmModalProps.confirmText}
          isDanger={confirmModalProps.isDanger}
          closeOnConfirm={false}
          confirmLoading={saving}
        />
      )}
    </div>
  );
}
