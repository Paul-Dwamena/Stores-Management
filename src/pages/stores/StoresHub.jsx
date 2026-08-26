import React, { useEffect, useMemo, useState } from "react";
import {
  Package,
  ClipboardList,
  AlertTriangle,
  Truck,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { cn } from "../../utils/cn";
import PageHeader from "../../components/common/PageHeader";
import SummaryStatCard from "../../components/common/SummaryStatCard";
import { getInterStoreTransfers } from "../../mockdata/stores";
import { listPendingSupplyLines } from "../../services/supplyRequestsService";
import { listInventoryItems } from "../../services/inventoryService";
import { InventoryList } from "./inventory";
import { PendingSuppliesList } from "./supplies";
import { InterStoresTransfersList } from "./transfers";

const STORES_SUB_TABS = [
  { id: "inventory", label: "Inventory" },
  { id: "requisition", label: "Supplies" },
  { id: "transfers", label: "Inter stores transfers" },
];

function NestedTabButtons({ tabs, activeId, onChange }) {
  return (
    <div className="tab-track overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn("tab-pill", activeId === tab.id && "tab-pill-active")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default function StoresHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const storesSub = searchParams.get("sub") || "inventory";

  const setStoresSub = (subId) => {
    setSearchParams({ sub: subId });
  };

  const [openSupplies, setOpenSupplies] = useState(0);
  const [inventoryItems, setInventoryItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listPendingSupplyLines().catch(() => []),
      listInventoryItems().catch(() => []),
    ]).then(([supplies, items]) => {
      if (cancelled) return;
      setOpenSupplies(supplies.length);
      setInventoryItems(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const hubAnalytics = useMemo(() => {
    const outOfStock = inventoryItems.filter(
      (item) => item.status === "OUT_OF_STOCK",
    ).length;
    const openTransfers = getInterStoreTransfers().filter((row) => {
      const status = (row.status ?? "").toString().toUpperCase();
      return status !== "COMPLETED" && status !== "REJECTED" && status !== "CANCELLED";
    }).length;

    return [
      { label: "Accessory SKUs", value: inventoryItems.length, icon: Package, tone: "teal" },
      { label: "Low / out of stock", value: outOfStock, icon: AlertTriangle, tone: "amber" },
      { label: "Open supplies", value: openSupplies, icon: ClipboardList, tone: "rose" },
      { label: "Open transfers", value: openTransfers, icon: Truck, tone: "sky" },
    ];
  }, [openSupplies, inventoryItems]);

  return (
    <div className="space-y-4 pb-8">
      <PageHeader
        title="Stores"
        description="Manage accessory inventory, supplies, and inter-store transfers."
        className="mb-0"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {hubAnalytics.map((card) => (
          <SummaryStatCard
            key={card.label}
            title={card.label}
            value={card.value}
            icon={card.icon}
            tone={card.tone}
          />
        ))}
      </div>

        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <NestedTabButtons
              tabs={STORES_SUB_TABS}
              activeId={storesSub}
              onChange={setStoresSub}
            />
          </div>

        {storesSub === "inventory" && (
          <InventoryList embedded />
        )}
        {storesSub === "requisition" && (
          <PendingSuppliesList embedded />
        )}
        {storesSub === "transfers" && (
          <InterStoresTransfersList embedded view="accessories" />
        )}
      </div>
    </div>
  );
}
