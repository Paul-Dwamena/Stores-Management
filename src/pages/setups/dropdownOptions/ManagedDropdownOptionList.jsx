import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import BackToDropdownOptionsLink from "../components/BackToDropdownOptionsLink";
import Button from "../../../components/common/base/Button";
import SearchInput from "../../../components/common/fields/SearchInput";
import AddModal from "../../../components/common/AddModal";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import InputField from "../../../components/common/fields/InputField";
import Label from "../../../components/common/base/Label";
import ToggleField from "../../../components/common/fields/ToggleField";
import {
  TableIconAction,
  TableRowActions,
} from "../../../components/common/tableActions";
import { toast } from "../../../components/common/ToastNotification";
import { BrandDisplay } from "../../../components/common/display/FormattedDisplay";
import { cn } from "../../../utils/cn";
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

export default function ManagedDropdownOptionList({ optionId, title }) {
  const [items, setItems] = useState(() => listManagedDropdownItems(optionId));
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmAction, setConfirmAction] = useState(null);

  const syncItems = (next) => {
    setItems(next);
    replaceManagedDropdownItems(optionId, next);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((row) => {
      const matchesSearch =
        !q ||
        row.name.toLowerCase().includes(q) ||
        (row.description || "").toLowerCase().includes(q);
      const matchesActive = showInactive || row.active !== false;
      return matchesSearch && matchesActive;
    });
  }, [items, search, showInactive]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name,
      description: row.description || "",
      active: row.active !== false,
    });
    setModalOpen(true);
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

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "delete") {
      syncItems(items.filter((row) => row.id !== confirmAction.id));
      toast.success(`${title} item removed.`);
    } else if (confirmAction.type === "update") {
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
      toast.success(`${title} item updated.`);
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
    setForm(EMPTY_FORM);
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
        <Button onClick={openCreate}>
          <Plus size={16} /> Add item
        </Button>
      </PageHeader>

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
                      <TableIconAction
                        title="Edit item"
                        onClick={() => openEdit(row)}
                        icon={Pencil}
                        variant="edit"
                      />
                      <TableIconAction
                        title="Delete item"
                        onClick={() =>
                          setConfirmAction({
                            type: "delete",
                            id: row.id,
                            name: row.name,
                          })
                        }
                        icon={Trash2}
                        variant="delete"
                      />
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
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          title={confirmModalProps.title}
          message={confirmModalProps.message}
          confirmText={confirmModalProps.confirmText}
          isDanger={confirmModalProps.isDanger}
        />
      )}
    </div>
  );
}
