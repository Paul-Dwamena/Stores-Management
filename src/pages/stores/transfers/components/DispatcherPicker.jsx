import React from "react";
import { Plus } from "lucide-react";
import ConfiguredSearchSelectField from "../../../../components/common/fields/ConfiguredSearchSelectField";

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

export default function DispatcherPicker({
  value,
  onChange,
  error,
  onAddClick,
  required = true,
  label = "Person dispatching",
  placeholder = "Search by name or phone…",
  addButtonLabel = "Add dispatcher",
  items = [],
  id = "dispatcher-search",
}) {
  const options = personOptions(items);

  return (
    <ConfiguredSearchSelectField
      id={id}
      field={{
        key: "dispatcher",
        title: label,
        placeholder,
        options,
      }}
      values={{ dispatcher: value }}
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
