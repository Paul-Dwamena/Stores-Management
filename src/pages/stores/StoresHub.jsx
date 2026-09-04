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
import AccessDenied from "../../components/common/AccessDenied";
import { getStoresGeneralStats } from "../../services/statsService";
import { usePermission } from "../../hooks/usePermission";
import { isStoresTabAllowed } from "../../permissions/accessMap";
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
  const { can, canAny } = usePermission();
  const allowedTabs = useMemo(
    () => STORES_SUB_TABS.filter((tab) => isStoresTabAllowed(tab.id, can, canAny)),
    [can, canAny],
  );
  const fallbackSub = allowedTabs[0]?.id || "inventory";
  const requestedSub = searchParams.get("sub") || fallbackSub;
  const storesSub = allowedTabs.some((tab) => tab.id === requestedSub)
    ? requestedSub
    : fallbackSub;

  const setStoresSub = (subId) => {
    setSearchParams({ sub: subId });
  };

  useEffect(() => {
    if (!allowedTabs.length) return;
    const current = searchParams.get("sub");
    if (current && current !== storesSub) {
      setSearchParams({ sub: storesSub }, { replace: true });
    }
  }, [allowedTabs.length, searchParams, setSearchParams, storesSub]);

  const [hubAnalytics, setHubAnalytics] = useState([
    { label: "Accessory SKUs", value: 0, icon: Package, tone: "teal" },
    { label: "Low / out of stock", value: 0, icon: AlertTriangle, tone: "amber" },
    { label: "Open supplies", value: 0, icon: ClipboardList, tone: "rose" },
    { label: "Open transfers", value: 0, icon: Truck, tone: "sky" },
  ]);

  useEffect(() => {
    let cancelled = false;
    getStoresGeneralStats()
      .then((general) => {
        if (cancelled) return;
        setHubAnalytics([
          { label: "Accessory SKUs", value: general.numberOfItems, icon: Package, tone: "teal" },
          { label: "Low / out of stock", value: general.lowOutOfStock, icon: AlertTriangle, tone: "amber" },
          { label: "Open supplies", value: general.openSupplies, icon: ClipboardList, tone: "rose" },
          { label: "Open transfers", value: general.openTransfers, icon: Truck, tone: "sky" },
        ]);
      })
      .catch(() => {
        if (cancelled) return;
        setHubAnalytics((current) =>
          current.map((card) => ({ ...card, value: 0 })),
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!allowedTabs.length) {
    return (
      <AccessDenied description="You don't have permission to view inventory, supplies, or transfers." />
    );
  }

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
            tabs={allowedTabs}
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
          <InterStoresTransfersList embedded />
        )}
      </div>
    </div>
  );
}
