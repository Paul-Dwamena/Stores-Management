import React from "react";
import { Building2, Users, Warehouse } from "lucide-react";
import TabbedPageHub from "../../components/common/TabbedPageHub";
import UsersList from "./UsersList";
import StoreManagementList from "./StoreManagementList";
import SuppliersList from "./SuppliersList";

export default function SetupsHub() {
  return (
    <TabbedPageHub
      title="Setups"
      description="User management, stores, and suppliers used across inventory, supplies, and transfers."
      defaultTab="users"
      tabs={[
        {
          id: "users",
          label: "User Management",
          icon: Users,
          description: "Invite and manage Super Admins, Store Managers, and Staff. Assign each person to a store. These users appear when selecting a receiver or dispatcher.",
          element: <UsersList />,
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
