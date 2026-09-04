import React from "react";
import { Plus } from "lucide-react";
import ConfiguredSearchSelectField from "../../../../components/common/fields/ConfiguredSearchSelectField";
import { getReceivers } from "../../../../mockdata/stores";
import { usePermission } from "../../../../hooks/usePermission";
import { ACTIONS, RESOURCES } from "../../../../permissions/accessMap";
import { cn } from "../../../../utils/cn";

function personLabel(person) {
  return person.name || person.email || "";
}

function personValue(person) {
  return person.id != null ? String(person.id) : person.name;
}

function personOptions(people = []) {
  return people.map((person) => ({
    value: personValue(person),
    label: personLabel(person),
    description: String(person.phone || "").trim(),
  }));
}

function addReceiverDeniedReason({ canCreateUsers, canReadRoles }) {
  if (canCreateUsers && canReadRoles) return null;
  const missing = [];
  if (!canCreateUsers) missing.push("create users");
  if (!canReadRoles) missing.push("view roles");
  return `You don't have permission to ${missing.join(" and ")}`;
}

export default function ReceiverPicker({
  value,
  onChange,
  error,
  onAddClick,
  required = true,
  label = "Person to receive",
  placeholder = "Search by name or phone…",
  addButtonLabel = "Add receiver",
  items,
  id = "person-search",
}) {
  const { can } = usePermission();
  const canReadUsers = can(RESOURCES.users, ACTIONS.read);
  const canCreateUsers = can(RESOURCES.users, ACTIONS.create);
  const canReadRoles = can(RESOURCES.roles, ACTIONS.read);
  const denied = !canReadUsers;
  const canAddReceiver = Boolean(onAddClick) && canCreateUsers && canReadRoles;
  const addDeniedTitle = addReceiverDeniedReason({ canCreateUsers, canReadRoles });
  const people = denied ? [] : (items ?? getReceivers());
  const options = personOptions(people);

  return (
    <ConfiguredSearchSelectField
      id={id}
      field={{
        key: "person",
        title: label,
        placeholder: denied ? "Access denied" : placeholder,
        options,
      }}
      values={{ person: value }}
      error={error}
      disabled={denied}
      title={denied ? "You don't have permission to view users" : undefined}
      onChange={(_key, next) => {
        if (denied) return;
        onChange?.(next ?? "");
      }}
      required={required}
      action={
        <button
          type="button"
          onClick={() => {
            if (!canAddReceiver) return;
            onAddClick?.();
          }}
          disabled={!canAddReceiver}
          title={addDeniedTitle || undefined}
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-bold",
            canAddReceiver
              ? "text-danger hover:text-[#991b1b]"
              : "text-slate-400 cursor-not-allowed",
          )}
        >
          <Plus size={12} />
          {addButtonLabel}
        </button>
      }
    />
  );
}
