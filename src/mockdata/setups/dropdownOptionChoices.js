function toChoice(value, label) {
  const nextValue = String(value ?? "").trim();
  if (!nextValue) return null;
  return {
    value: nextValue,
    label: String(label ?? nextValue).trim() || nextValue,
  };
}

export function getDropdownOptionSourceChoices() {
  return [];
}

export function resolveDropdownOptionChoices() {
  return [];
}

export function getDropdownOptionSourceLabel(optionId) {
  return optionId ?? "";
}

export { toChoice };
