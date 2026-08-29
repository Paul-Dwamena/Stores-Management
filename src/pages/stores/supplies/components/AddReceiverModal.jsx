import React, { useEffect, useState } from "react";
import AddModal from "../../../../components/common/AddModal";
import InputField from "../../../../components/common/fields/InputField";
import { toast } from "../../../../components/common/ToastNotification";
import { createUser } from "../../../../services/usersService";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

function validateForm(form) {
  const errors = {};
  if (!String(form.firstName || "").trim()) {
    errors.firstName = "Enter a first name.";
  }
  if (!String(form.lastName || "").trim()) {
    errors.lastName = "Enter a last name.";
  }
  const email = String(form.email || "").trim();
  if (!email) {
    errors.email = "Enter an email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!String(form.phone || "").trim()) {
    errors.phone = "Enter a phone number.";
  }
  return errors;
}

export default function AddReceiverModal({
  isOpen,
  onClose,
  onCreated,
  receiverRoleId = null,
  onEnsureReceiverRole,
  title = "Add receiver",
  saveLabel = "Add receiver",
  subtitle = "Add someone who can collect issued items.",
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY_FORM);
    setErrors({});
    setSaving(false);
    try {
      delete window.__FLEETLY_ADD_RECEIVER_FORM_TREE__;
    } catch {
      /* ignore */
    }
  }, [isOpen]);

  const handleChange = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSave = async () => {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Complete the receiver details.");
      return;
    }

    setSaving(true);
    try {
      let roleId = receiverRoleId;
      if (roleId == null && onEnsureReceiverRole) {
        roleId = await onEnsureReceiverRole();
      }
      if (roleId == null) {
        toast.error(
          "No Receiver role found. Create a role named Receiver in Setups first.",
        );
        return;
      }

      const created = await createUser({
        first_name: String(form.firstName || "").trim(),
        last_name: String(form.lastName || "").trim(),
        email: String(form.email || "").trim(),
        phone: String(form.phone || "").trim() || null,
        role_id: Number(roleId),
      });
      toast.success(`${created.name} added.`);
      onCreated?.(created);
      onClose?.();
    } catch (error) {
      toast.error(error.message ?? "Could not add receiver.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title={title}
      subtitle={subtitle}
      saveLabel={saveLabel}
      saveDisabled={saving}
      dialogClassName="max-w-lg"
      overlayClassName="!z-[10001]"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          id="add-receiver-first-name"
          label="First name"
          required
          value={form.firstName}
          onChange={handleChange("firstName")}
          placeholder="Jane"
          error={errors.firstName}
        />
        <InputField
          id="add-receiver-last-name"
          label="Last name"
          required
          value={form.lastName}
          onChange={handleChange("lastName")}
          placeholder="Mensah"
          error={errors.lastName}
        />
        <InputField
          id="add-receiver-email"
          type="email"
          label="Email"
          required
          value={form.email}
          onChange={handleChange("email")}
          placeholder="name@fleet.gh"
          error={errors.email}
        />
        <InputField
          id="add-receiver-phone"
          label="Phone"
          required
          value={form.phone}
          onChange={handleChange("phone")}
          placeholder="024 000 0000"
          error={errors.phone}
        />
      </div>
    </AddModal>
  );
}
