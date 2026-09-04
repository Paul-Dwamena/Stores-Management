import React, { useMemo } from "react";
import { Building2, LayoutGrid, Shield, Users, Warehouse } from "lucide-react";
import TabbedPageHub from "../../components/common/TabbedPageHub";
import UsersList from "./UsersList";
import RolesPermissionsList from "./RolesPermissionsList";
import StoreManagementList from "./StoreManagementList";
import SuppliersList from "./SuppliersList";
import { DropdownOptionsHub } from "./dropdownOptions";
import { usePermission } from "../../hooks/usePermission";
import { isSetupsTabAllowed } from "../../permissions/accessMap";

const SETUPS_TABS = [
  {
    id: "users",
    label: "User Management",
    icon: Users,
    description: "Invite and manage people who work in stores. Assign each person a role.",
    element: <UsersList />,
  },
  {
    id: "roles",
    label: "Roles & Permissions",
    icon: Shield,
    description: "Create roles and assign permissions. System roles cannot be edited or deleted.",
    element: <RolesPermissionsList />,
  },
  {
    id: "stores",
    label: "Store Management",
    icon: Warehouse,
    description: "Add and manage store locations. Active stores appear in inventory, supplies, and transfers.",
    element: <StoreManagementList />,
  },
  {
    id: "suppliers",
    label: "Suppliers",
    icon: Building2,
    description: "Maintain the supplier list used when receiving accessories into a store.",
    element: <SuppliersList />,
  },
  {
    id: "dropdown",
    label: "Dropdown Options",
    icon: LayoutGrid,
    description:
      "Select a card to open its setup page. Manage item categories, brands, and other master lists.",
    element: <DropdownOptionsHub embedded />,
  },
];

export default function SetupsHub() {
  const { can, canAny } = usePermission();
  const tabs = useMemo(
    () => SETUPS_TABS.filter((tab) => isSetupsTabAllowed(tab.id, can, canAny)),
    [can, canAny],
  );

  return (
    <TabbedPageHub
      title="Setups"
      description="Users, roles, stores, suppliers, and dropdown lists used across inventory, supplies, and transfers."
      defaultTab={tabs[0]?.id || "users"}
      tabs={tabs}
      emptyDescription="You don't have permission to view any setup pages."
    />
  );
}
