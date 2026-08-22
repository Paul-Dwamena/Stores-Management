import React, { useEffect, useMemo, useState } from "react";
import AddModal from "../../../../components/common/AddModal";
import { toast } from "../../../../components/common/ToastNotification";
import { collectCanonicalFieldErrors } from "../../../../components/common/fields/canonicalConfiguredField";
import { useSetupTreeRevision } from "../../../../hooks/useSetupTreeRevision";
import {
  ADD_RECEIVER_FORM_SETUP_CHANGED_EVENT,
  getActiveAddReceiverFormSections,
  getAddReceiverFormSetup,
  getInitialAddReceiverFormValues,
} from "../../../../mockdata/setups";
import { addReceiver } from "../../../../mockdata/stores";
import AddReceiverConfiguredFields from "./AddReceiverConfiguredFields";

export default function AddReceiverModal({ isOpen, onClose, onCreated, title = "Add receiver", saveLabel = "Add receiver" }) {
  const setupRevision = useSetupTreeRevision(ADD_RECEIVER_FORM_SETUP_CHANGED_EVENT);
  const formSetup = useMemo(() => {
    void setupRevision;
    return getAddReceiverFormSetup();
  }, [setupRevision]);
  const configuredSections = useMemo(
    () => getActiveAddReceiverFormSections(formSetup),
    [formSetup],
  );
  const allConfiguredFields = useMemo(
    () => configuredSections.flatMap((section) => section.fields || []),
    [configuredSections],
  );

  const [form, setForm] = useState(() => getInitialAddReceiverFormValues());
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setForm(getInitialAddReceiverFormValues(formSetup));
    setErrors({});
  }, [isOpen, formSetup]);

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

  const handleSave = () => {
    const nextErrors = collectCanonicalFieldErrors(allConfiguredFields, form);
    const email = String(form.email || "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Complete the receiver details.");
      return;
    }
    try {
      const created = addReceiver(form);
      toast.success(`${created.name} added as a receiver.`);
      onCreated?.(created);
    } catch (error) {
      toast.error(error.message ?? "Could not add receiver.");
    }
  };

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title={title}
      subtitle="Create a receiver with name, email, phone, and role. They can collect issued items immediately."
      saveLabel={saveLabel}
      dialogClassName="max-w-lg"
    >
      <AddReceiverConfiguredFields
        sections={configuredSections}
        form={form}
        formErrors={errors}
        handleChange={handleChange}
      />
    </AddModal>
  );
}
