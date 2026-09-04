/**
 * Maps app surfaces to live API permission resource/action pairs
 * from GET /auth/me (and GET /permissions catalog).
 *
 * /auth/me returns { name, action } (resource derived from name, e.g. users.create).
 * Matching is case-insensitive (see permissionMatch.normalizePermissionKey).
 */

export const ACTIONS = {
  read: "read",
  create: "create",
  update: "update",
  delete: "delete",
  receive: "receive",
  adjust: "adjust",
  approve: "approve",
  reject: "reject",
  submit: "submit",
  cancel: "cancel",
  dispatch: "dispatch",
  hold: "hold",
  confirm: "confirm",
};

export const RESOURCES = {
  users: "users",
  roles: "roles",
  permissions: "permissions",
  stores: "stores",
  items: "items",
  inventory: "inventory",
  generalRequests: "general_requests",
  supplyRequests: "supply_requests",
  issuances: "issuances",
  audit: "audit",
  transfers: "transfers",
  suppliers: "suppliers",
  brands: "brands",
  categories: "categories",
  packagingConfigurations: "packaging_configurations",
};

const read = (resource) => ({ resource, action: ACTIONS.read });

export const STORES_VIEW_ANY = [
  read(RESOURCES.inventory),
  read(RESOURCES.items),
  read(RESOURCES.supplyRequests),
  read(RESOURCES.transfers),
];

export const SETUPS_VIEW_ANY = [
  read(RESOURCES.users),
  read(RESOURCES.roles),
  read(RESOURCES.stores),
  read(RESOURCES.suppliers),
  read(RESOURCES.brands),
  read(RESOURCES.categories),
  read(RESOURCES.packagingConfigurations),
];

export const DROPDOWN_VIEW_ANY = [
  read(RESOURCES.brands),
  read(RESOURCES.categories),
];

/** Maps Dropdown Options hub card ids → API permission resources. */
export const DROPDOWN_OPTION_RESOURCES = {
  brands: RESOURCES.brands,
  "item-categories": RESOURCES.categories,
};

export const DROPDOWN_ACTION_RESOURCES = [
  RESOURCES.brands,
  RESOURCES.categories,
  RESOURCES.packagingConfigurations,
];

export const TRANSFER_MUTATE_ANY = [
  { resource: RESOURCES.transfers, action: ACTIONS.approve },
  { resource: RESOURCES.transfers, action: ACTIONS.dispatch },
  { resource: RESOURCES.transfers, action: ACTIONS.receive },
  { resource: RESOURCES.transfers, action: ACTIONS.reject },
  { resource: RESOURCES.transfers, action: ACTIONS.cancel },
  { resource: RESOURCES.transfers, action: ACTIONS.hold },
];

export const APPROVALS_VIEW_ANY = [
  { resource: RESOURCES.supplyRequests, action: ACTIONS.approve },
  { resource: RESOURCES.supplyRequests, action: ACTIONS.reject },
];

export const ROUTE_ACCESS = [
  // No dedicated overview permission in the API catalog.
  { path: "/", exact: true, always: true },
  { path: "/stores", permissionAny: STORES_VIEW_ANY },
  { path: "/requests", permission: read(RESOURCES.generalRequests) },
  { path: "/approvals", permissionAny: APPROVALS_VIEW_ANY },
  { path: "/setups", permissionAny: SETUPS_VIEW_ANY },
  { path: "/audit-trail", permission: read(RESOURCES.audit) },
  { path: "/settings", always: true },
];

export const STORES_TAB_ACCESS = {
  inventory: {
    permissionAny: [read(RESOURCES.inventory), read(RESOURCES.items)],
  },
  requisition: read(RESOURCES.supplyRequests),
  transfers: read(RESOURCES.transfers),
};

export const SETUPS_TAB_ACCESS = {
  users: read(RESOURCES.users),
  roles: read(RESOURCES.roles),
  stores: read(RESOURCES.stores),
  suppliers: read(RESOURCES.suppliers),
  dropdown: { permissionAny: DROPDOWN_VIEW_ANY },
};

export function isAccessAllowed(access, can, canAny) {
  if (!access) return false;
  if (access.always) return true;
  if (access.permissionAny) return canAny(access.permissionAny);
  const pair = access.permission || access;
  if (pair?.resource && pair?.action) return can(pair.resource, pair.action);
  return false;
}

export function findRouteAccess(pathname) {
  if (pathname === "/" || pathname === "") {
    return ROUTE_ACCESS.find((route) => route.exact);
  }
  return ROUTE_ACCESS.find((route) => {
    if (route.exact) return false;
    return pathname === route.path || pathname.startsWith(`${route.path}/`);
  });
}

export function getFirstAllowedPath(can, canAny) {
  const allowed = ROUTE_ACCESS.find((route) => isAccessAllowed(route, can, canAny));
  return allowed?.path || "/settings";
}

export function isStoresTabAllowed(tabId, can, canAny) {
  return isAccessAllowed(STORES_TAB_ACCESS[tabId], can, canAny);
}

export function isSetupsTabAllowed(tabId, can, canAny) {
  return isAccessAllowed(SETUPS_TAB_ACCESS[tabId], can, canAny);
}

export function canDropdownAction(can, action) {
  return DROPDOWN_ACTION_RESOURCES.some((resource) => can(resource, action));
}

export function getDropdownOptionResource(optionId) {
  return DROPDOWN_OPTION_RESOURCES[optionId] || null;
}

export function canReadDropdownOption(can, optionId) {
  const resource = getDropdownOptionResource(optionId);
  return resource ? can(resource, ACTIONS.read) : false;
}

export function canDropdownOptionAction(can, optionId, action) {
  const resource = getDropdownOptionResource(optionId);
  return resource ? can(resource, action) : false;
}
