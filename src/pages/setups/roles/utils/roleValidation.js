export function validateRoleForm(form, { editingId, existingRoles = [] } = {}) {
  const errors = {};
  const name = form.name?.trim() ?? "";
  const description = form.description?.trim() ?? "";

  if (!name) {
    errors.name = "Enter a role name.";
  } else if (name.length < 2) {
    errors.name = "Role name must be at least 2 characters.";
  } else if (name.length > 60) {
    errors.name = "Role name must be 60 characters or fewer.";
  }

  if (description.length > 160) {
    errors.description = "Description must be 160 characters or fewer.";
  }

  const duplicate = existingRoles.find(
    (role) =>
      role.id !== editingId && role.name.trim().toLowerCase() === name.toLowerCase(),
  );

  if (duplicate) {
    errors.name = "A role with this name already exists.";
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    values: {
      name,
      description,
      permissions: form.permissions,
    },
  };
}

export function clearRoleFieldError(errors, field) {
  if (!errors[field]) return errors;
  const next = { ...errors };
  delete next[field];
  return next;
}
