import React from "react";
import { Plus } from "lucide-react";
import ConfiguredSearchSelectField from "../../../../components/common/fields/ConfiguredSearchSelectField";
import { getReceivers } from "../../../../mockdata/stores";

function personLabel(person) {
  return [person.name, person.role].filter(Boolean).join(" · ");
}

export default function ReceiverPicker({
  value,
  onChange,
  error,
  onAddClick,
  required = true,
  label = "Person to receive",
  placeholder = "Search by name or role…",
  addButtonLabel = "Add receiver",
  items,
  id = "person-search",
}) {
  const people = items ?? getReceivers();
  const options = people.map((person) => ({
    value: person.name,
    label: personLabel(person),
  }));

  return (
    <ConfiguredSearchSelectField
      id={id}
      field={{
        key: "person",
        title: label,
        placeholder,
        options,
      }}
      values={{ person: value }}
      error={error}
      onChange={(_key, next) => onChange?.(next ?? "")}
      required={required}
      action={
        onAddClick ? (
          <button
            type="button"
            onClick={onAddClick}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-hover"
          >
            <Plus size={12} />
            {addButtonLabel}
          </button>
        ) : null
      }
    />
  );
}
