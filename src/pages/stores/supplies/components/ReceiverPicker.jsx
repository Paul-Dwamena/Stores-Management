import React from "react";
import { Plus } from "lucide-react";
import ConfiguredSearchSelectField from "../../../../components/common/fields/ConfiguredSearchSelectField";
import { getReceivers } from "../../../../mockdata/stores";

function personLabel(person) {
  return person.name || "";
}

function personValue(person) {
  return person.id != null ? String(person.id) : person.name;
}

export default function ReceiverPicker({
  value,
  onChange,
  error,
  onAddClick,
  required = true,
  label = "Person to receive",
  placeholder = "Search by name…",
  addButtonLabel = "Add receiver",
  items,
  id = "person-search",
}) {
  const people = items ?? getReceivers();
  const options = people.map((person) => ({
    value: personValue(person),
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
            className="inline-flex items-center gap-1 text-[11px] font-bold text-danger hover:text-[#991b1b]"
          >
            <Plus size={12} />
            {addButtonLabel}
          </button>
        ) : null
      }
    />
  );
}
