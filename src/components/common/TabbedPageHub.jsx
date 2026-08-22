import React from "react";
import { useSearchParams } from "react-router-dom";
import { Info } from "lucide-react";
import { cn } from "../../utils/cn";
import PageHeader from "./PageHeader";

/**
 * Flat sidebar destinations that host in-page tabs (no second sidebar).
 * tabs: [{ id, label, element, description?, icon? }]
 */
export default function TabbedPageHub({
  title,
  description,
  tabs,
  defaultTab,
  paramKey = "tab",
  headerActions = null,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const fallback = defaultTab || tabs[0]?.id;
  const activeTab = searchParams.get(paramKey) || fallback;

  const setActiveTab = (tabId) => {
    const next = { ...Object.fromEntries(searchParams.entries()) };
    delete next.sub;
    delete next.form;
    if (tabId === fallback) {
      delete next[paramKey];
      setSearchParams(next);
      return;
    }
    next[paramKey] = tabId;
    setSearchParams(next);
  };

  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const TabIcon = active?.icon ?? Info;

  return (
    <div className="space-y-4 pb-8">
      <div className="space-y-3">
        <PageHeader title={title} description={description} className="mb-0">
          {headerActions}
        </PageHeader>

        <div className="tab-track overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn("tab-pill", active?.id === tab.id && "tab-pill-active")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {active?.description ? (
        <div className="card p-4 border-slate-200 bg-slate-50/60 flex items-start gap-3">
          <TabIcon size={18} className="text-brand shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-600 leading-relaxed">{active.description}</p>
        </div>
      ) : null}

      <div>{active?.element}</div>
    </div>
  );
}
