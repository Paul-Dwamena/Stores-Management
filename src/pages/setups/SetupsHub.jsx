import React from "react";
import { Building2, Shield, Users, Warehouse } from "lucide-react";
import TabbedPageHub from "../../components/common/TabbedPageHub";
import UsersList from "./UsersList";
import RolesPermissionsList from "./RolesPermissionsList";
import StoreManagementList from "./StoreManagementList";
import SuppliersList from "./SuppliersList";

export default function SetupsHub() {
  return (
    <TabbedPageHub
      title="Setups"
      description="Users, roles, stores, and suppliers used across inventory, supplies, and transfers."
      defaultTab="users"
      tabs={[
        {
          id: "users",
          label: "User Management",
          icon: Users,
          description: "Invite and manage people who work in stores. Assign each person a role and store.",
          element: <UsersList />,
        },
        {
          id: "roles",
          label: "Roles & Permissions",
          icon: Shield,
          description: "Define roles and what they can view, add, edit, delete, or print across store modules.",
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
      ]}
    />
  );
}
