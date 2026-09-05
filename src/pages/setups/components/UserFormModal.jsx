import React, { useEffect, useMemo, useState } from "react";
import { toast } from "../../../components/common/ToastNotification";
import { createUser, updateUser } from "../../../services/usersService";
import { listRoles } from "../../../services/rolesService";
import CatalogFormModal from "./CatalogFormModal";

export const EMPTY_USER_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role_id: "",
  is_active: true,
};

export default function UserFormModal({
  isOpen,
  onClose,
  onSaved,
  editing = null,
  title,
  subtitle = "Assign a role. Phone is optional.",
  saveLabel,
  presetRoleId = null,
  lockRole = false,
  defaultValues = null,
}) {
  const [roles, setRoles] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState(null);
  const isEdit = Boolean(editing);
  const lockedRoleId =
    lockRole && presetRoleId != null && presetRoleId !== ""
      ? String(presetRoleId)
      : null;

  const loadOptions = async () => {
    setOptionsLoading(true);
    setOptionsError(null);
    try {
      setRoles(await listRoles());
    } catch (err) {
      setOptionsError(err.message || "Unable to load form options.");
    } finally {
      setOptionsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadOptions();
  }, [isOpen]);

  const roleOptions = useMemo(() => {
    const mapped = roles.map((role) => ({
      value: String(role.id),
      label: role.label,
    }));
    if (!lockedRoleId) return mapped;
    const locked = mapped.filter((role) => role.value === lockedRoleId);
    return locked.length ? locked : mapped;
  }, [roles, lockedRoleId]);

  const fields = useMemo(
    () => [
      { key: "firstName", label: "First name", required: true, placeholder: "Jane" },
      { key: "lastName", label: "Last name", required: true, placeholder: "Mensah" },
      { key: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com", span: 2 },
      { key: "phone", label: "Phone", placeholder: "024 000 0000" },
      {
        key: "role_id",
        label: "Role",
        type: "select",
        required: true,
        placeholder: "Select role",
        options: roleOptions,
        disabled: Boolean(lockedRoleId),
        readOnly: Boolean(lockedRoleId),
      },
      ...(isEdit
        ? [{
            key: "is_active",
            label: "Active",
            type: "toggle",
            span: 2,
            activeValue: true,
            inactiveValue: false,
            description: "Inactive users cannot sign in.",
          }]
        : []),
    ],
    [roleOptions, isEdit, lockedRoleId],
  );

  const createInitialValues = useMemo(
    () => ({
      ...EMPTY_USER_FORM,
      ...(defaultValues || {}),
      role_id: lockedRoleId || defaultValues?.role_id || "",
    }),
    [defaultValues, lockedRoleId],
  );

  const handleSave = async (form) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.warning("Enter a valid email address.");
      return;
    }

    const roleId = lockedRoleId || form.role_id;

    if (isEdit) {
      try {
        const saved = await updateUser(editing.id, {
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          email: form.email.trim(),
          phone: (form.phone || "").trim() || null,
          role_id: Number(roleId),
          is_active: form.is_active !== false,
        });
        toast.success("User updated.");
        onSaved?.(saved);
        onClose?.();
      } catch (error) {
        toast.error(error.message || "Could not save user.");
      }
      return;
    }

    try {
      const saved = await createUser({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        phone: (form.phone || "").trim() || null,
        role_id: Number(roleId),
      });
      toast.success("User added.");
      onSaved?.(saved);
      onClose?.();
    } catch (error) {
      toast.error(error.message || "Could not save user.");
    }
  };

  return (
    <CatalogFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title={title || (isEdit ? "Edit user" : "Add user")}
      subtitle={subtitle}
      saveLabel={saveLabel || (isEdit ? "Save changes" : "Add user")}
      fields={fields}
      loading={optionsLoading}
      error={optionsError}
      onRetry={loadOptions}
      initialValues={
        isEdit
          ? {
              ...EMPTY_USER_FORM,
              ...editing,
              firstName: editing.firstName || "",
              lastName: editing.lastName || "",
              email: editing.email || "",
              phone: editing.phone || "",
              role_id: lockedRoleId || (editing.roleId != null ? String(editing.roleId) : ""),
              is_active: editing.isActive !== false,
            }
          : createInitialValues
      }
    />
  );
}
