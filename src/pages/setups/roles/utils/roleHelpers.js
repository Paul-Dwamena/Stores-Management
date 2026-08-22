import {
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
} from "./roleConstants";

export function createEmptyPermissions() {
  return PERMISSION_MODULES.reduce((accumulator, module) => {
    accumulator[module.id] = PERMISSION_ACTIONS.reduce((actions, action) => {
      actions[action] = false;
      return actions;
    }, {});
    return accumulator;
  }, {});
}

export function createFullPermissions() {
  return PERMISSION_MODULES.reduce((accumulator, module) => {
    accumulator[module.id] = PERMISSION_ACTIONS.reduce((actions, action) => {
      actions[action] = true;
      return actions;
    }, {});
    return accumulator;
  }, {});
}

export function normalizePermissions(permissions = {}) {
  const empty = createEmptyPermissions();

  PERMISSION_MODULES.forEach((module) => {
    PERMISSION_ACTIONS.forEach((action) => {
      empty[module.id][action] = Boolean(permissions?.[module.id]?.[action]);
    });
  });

  return empty;
}

export function countRolePermissions(permissions = {}) {
  return PERMISSION_MODULES.reduce((total, module) => {
    const modulePermissions = permissions[module.id] ?? {};
    return (
      total +
      PERMISSION_ACTIONS.filter((action) => modulePermissions[action]).length
    );
  }, 0);
}

export function clonePermissions(permissions = {}) {
  return normalizePermissions(permissions);
}
