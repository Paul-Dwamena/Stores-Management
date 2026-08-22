export const PERMISSION_ACTIONS = ["view", "add", "edit", "delete", "print"];

export const PERMISSION_ACTION_LABELS = {
  view: "View",
  add: "Add",
  edit: "Edit",
  delete: "Delete",
  print: "Print",
};

export const PERMISSION_MODULES = [
  { id: "overview", label: "Overview" },
  { id: "inventory", label: "Inventory" },
  { id: "supplies", label: "Supplies" },
  { id: "transfers", label: "Inter-store Transfers" },
  { id: "requests", label: "Requests" },
  { id: "approvals", label: "Approvals" },
  { id: "userManagement", label: "User Management" },
  { id: "storeManagement", label: "Store Management" },
  { id: "suppliers", label: "Suppliers" },
  { id: "rolesPermissions", label: "Roles & Permissions" },
  { id: "auditTrail", label: "Audit Trail" },
  { id: "settings", label: "Settings" },
];

export const INITIAL_ROLE_FORM = {
  name: "",
  description: "",
  permissions: {},
};
