import React, { useEffect, useState } from "react";
import AddModal from "../../../../components/common/AddModal";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import InputField from "../../../../components/common/fields/InputField";
import { toast } from "../../../../components/common/ToastNotification";
import PermissionMatrixTable from "./PermissionMatrixTable";
import { INITIAL_ROLE_FORM } from "../utils/roleConstants";
import { clonePermissions, createEmptyPermissions } from "../utils/roleHelpers";
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
}) {
  const [form, setForm] = useState(INITIAL_ROLE_FORM);
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setErrors({});
    setConfirmOpen(false);

    if (editingRole) {
      setForm({
        name: editingRole.name ?? "",
        description: editingRole.description ?? "",
        permissions: clonePermissions(editingRole.permissions),
      });
      return;
    }

    setForm({
      ...INITIAL_ROLE_FORM,
      permissions: createEmptyPermissions(),
    });
  }, [isOpen, editingRole]);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => clearRoleFieldError(current, field));
  };

  const handlePermissionChange = (moduleId, action, checked) => {
    setForm((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [moduleId]: {
          ...current.permissions[moduleId],
          [action]: checked,
        },
      },
    }));
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

  const handleConfirmSave = () => {
    onSave(form);
    setConfirmOpen(false);
    onClose();
  };

  const isEdit = Boolean(editingRole);

  return (
    <>
      <AddModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleSubmit}
        title={isEdit ? "Edit Role" : "Create New Role"}
        subtitle="Define a role and assign access across store modules."
        saveLabel={isEdit ? "Save Changes" : "Create Role"}
        dialogClassName="max-w-4xl"
        overlayClassName="!z-[10001]"
      >
        <div className="space-y-5">
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

          <PermissionMatrixTable
            permissions={form.permissions}
            onPermissionChange={handlePermissionChange}
          />
        </div>
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
            : `Create the "${form.name.trim()}" role with the selected permissions?`
        }
        confirmText={isEdit ? "Save changes" : "Create role"}
      />
    </>
  );
}
