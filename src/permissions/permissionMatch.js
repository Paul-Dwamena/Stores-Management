/** Case-insensitive match for API permission resource/action strings. */

export function normalizePermissionKey(value) {
  return String(value || "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

export function isSuperAdminRole(name) {
  return normalizePermissionKey(name) === "super_admin";
}

function resolvePermissionParts(permission) {
  const name = String(permission?.name || "").trim();
  let resource = permission?.resource;
  let action = permission?.action;

  if ((!resource || !action) && name.includes(".")) {
    const splitAt = name.lastIndexOf(".");
    resource = resource || name.slice(0, splitAt);
    action = action || name.slice(splitAt + 1);
  }

  return {
    resource: normalizePermissionKey(resource),
    action: normalizePermissionKey(action),
  };
}

function permissionPairs(permissions = []) {
  return (Array.isArray(permissions) ? permissions : []).map(resolvePermissionParts);
}

export function matchCan(permissions, resource, action) {
  const resourceKey = normalizePermissionKey(resource);
  const actionKey = normalizePermissionKey(action);
  if (!resourceKey || !actionKey) return false;
  return permissionPairs(permissions).some(
    (permission) => permission.resource === resourceKey && permission.action === actionKey,
  );
}

function toPair(entry) {
  if (Array.isArray(entry)) {
    return { resource: entry[0], action: entry[1] };
  }
  return { resource: entry?.resource, action: entry?.action };
}

export function matchCanAny(permissions, entries = []) {
  return entries.some((entry) => {
    const pair = toPair(entry);
    return matchCan(permissions, pair.resource, pair.action);
  });
}

export function createPermissionChecker(permissions = [], isSuperAdmin = false) {
  const can = (resource, action) => {
    if (isSuperAdmin) return true;
    return matchCan(permissions, resource, action);
  };

  const canAny = (entries = []) => {
    if (isSuperAdmin) return true;
    return matchCanAny(permissions, entries);
  };

  return { can, canAny };
}
