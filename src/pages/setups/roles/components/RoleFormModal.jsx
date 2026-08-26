import React, { useEffect, useState } from "react";
import AddModal from "../../../../components/common/AddModal";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import InputField from "../../../../components/common/fields/InputField";
import SectionLoadState from "../../../../components/common/SectionLoadState";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import PermissionMatrixTable from "./PermissionMatrixTable";
import { INITIAL_ROLE_FORM } from "../utils/roleConstants";
import { permissionIdsFromRole } from "../utils/roleHelpers";
import {
  clearRoleFieldError,
  validateRoleForm,
} from "../utils/roleValidation";

export default function RoleFormModal({
  isOpen,
  onClose,
  onSave,
  editingRole = null,
  existingRoles = [],
  catalog = [],
  loading = false,
  error = null,
  onRetry,
}) {
  const [form, setForm] = useState(INITIAL_ROLE_FORM);
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(editingRole);

  useEffect(() => {
    if (!isOpen) return;

    setErrors({});
    setConfirmOpen(false);
    setSaving(false);

    if (editingRole) {
      setForm({
        name: editingRole.name ?? "",
        description: editingRole.description ?? "",
        permission_ids: permissionIdsFromRole(editingRole),
      });
      return;
    }

    setForm({ ...INITIAL_ROLE_FORM });
  }, [isOpen, editingRole]);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => clearRoleFieldError(current, field));
  };

  const handleToggle = (permissionId, checked) => {
    setForm((current) => {
      const id = Number(permissionId);
      const next = new Set(current.permission_ids.map(Number));
      if (checked) next.add(id);
      else next.delete(id);
      return { ...current, permission_ids: [...next] };
    });
  };

  const handleSubmit = () => {
    const validation = validateRoleForm(form, {
      editingId: editingRole?.id,
      existingRoles,
    });
    setErrors(validation.errors);

    if (!validation.isValid) {
      toast.warning("Fix the highlighted fields before saving the role.");
      return;
    }

    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      setConfirmOpen(false);
      onClose();
    } catch {
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AddModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleSubmit}
        title={isEdit ? "Edit Role" : "Create New Role"}
        subtitle={
          isEdit
            ? "Update this role and assign permissions."
            : "Name and describe this role. Assign permissions after it is created."
        }
        saveLabel={saving ? "Saving…" : isEdit ? "Save Changes" : "Create Role"}
        saveDisabled={saving || loading || Boolean(error)}
        dialogClassName={isEdit ? "max-w-7xl" : "max-w-lg"}
        contentClassName={isEdit ? "overflow-x-auto" : undefined}
        overlayClassName="!z-[10001]"
      >
        <SectionLoadState
          loading={loading}
          error={error}
          onRetry={onRetry}
          loadingLabel="Loading role…"
          errorTitle="Couldn’t load this form"
        >
          <div className={cn("space-y-5", saving && "pointer-events-none opacity-60")}>
            <div className="space-y-4">
              <InputField
                label="Role Name"
                id="roleName"
                value={form.name}
                onChange={handleChange("name")}
                placeholder="e.g. Store Manager"
                error={errors.name}
              />
              <InputField
                label="Description"
                id="roleDescription"
                value={form.description}
                onChange={handleChange("description")}
                placeholder="Brief summary of this role"
                error={errors.description}
              />
            </div>

            {isEdit ? (
              <PermissionMatrixTable
                catalog={catalog}
                selectedIds={form.permission_ids}
                onToggle={handleToggle}
              />
            ) : null}
          </div>
        </SectionLoadState>
      </AddModal>

      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        className="!z-[10002]"
        title={isEdit ? "Save role changes?" : "Create role?"}
        message={
          isEdit
            ? `Save changes to the "${form.name.trim()}" role?`
            : `Create the "${form.name.trim()}" role?`
        }
        confirmText={isEdit ? "Save changes" : "Create role"}
      />
    </>
  );
}
