import React, { useMemo } from "react";
import { toast } from "../../../components/common/ToastNotification";
import { saveUser, USER_ROLES } from "../../../mockdata/org/users";
import { getStoreLocationOptions } from "../../../mockdata/org/stores";
import CatalogFormModal from "./CatalogFormModal";

export const EMPTY_USER_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "Staff",
  store: "",
  status: "Active",
};

export default function UserFormModal({
  isOpen,
  onClose,
  onSaved,
  editing = null,
  title,
  subtitle = "Super Admin, Store Manager, or Staff. Store managers and staff must be assigned to a store.",
  saveLabel,
}) {
  const storeOptions = getStoreLocationOptions().map((label) => ({ value: label, label }));
  const fields = useMemo(
    () => [
      { key: "firstName", label: "First name", required: true, placeholder: "Jane" },
      { key: "lastName", label: "Last name", required: true, placeholder: "Mensah" },
      { key: "email", label: "Email", type: "email", required: true, placeholder: "jane@stores.local" },
      { key: "phone", label: "Phone", required: true, placeholder: "024 000 0000" },
      {
        key: "role",
        label: "Role",
        type: "select",
        required: true,
        options: USER_ROLES.map((role) => ({ value: role, label: role })),
      },
      {
        key: "store",
        label: "Assigned store",
        type: "select",
        required: true,
        options: storeOptions,
        hidden: (form) => form.role === "Super Admin",
      },
      {
        key: "status",
        label: "Active",
        type: "toggle",
        span: 2,
        activeValue: "Active",
        inactiveValue: "Inactive",
        description: "Inactive users cannot sign in or be assigned as a receiver or dispatcher.",
      },
    ],
    [storeOptions],
  );

  const handleSave = (form) => {
    try {
      const saved = saveUser(form, { id: editing?.id });
      toast.success(editing ? "User updated." : "User added.");
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
      title={title || (editing ? "Edit user" : "Add user")}
      subtitle={subtitle}
      saveLabel={saveLabel || (editing ? "Save changes" : "Add user")}
      fields={fields}
      initialValues={
        editing
          ? {
              ...EMPTY_USER_FORM,
              ...editing,
              firstName: editing.firstName || "",
              lastName: editing.lastName || "",
            }
          : EMPTY_USER_FORM
      }
    />
  );
}
