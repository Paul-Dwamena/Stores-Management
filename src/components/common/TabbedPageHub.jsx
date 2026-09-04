import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Info } from "lucide-react";
import { cn } from "../../utils/cn";
import PageHeader from "./PageHeader";
import AccessDenied from "./AccessDenied";

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
  emptyTitle = "Access denied",
  emptyDescription = "You don't have permission to view this section.",
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const fallback = (defaultTab && tabs.some((tab) => tab.id === defaultTab)
    ? defaultTab
    : tabs[0]?.id);
  const requested = searchParams.get(paramKey) || fallback;
  const activeTab = tabs.some((tab) => tab.id === requested) ? requested : fallback;

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

  useEffect(() => {
    if (!tabs.length || !activeTab) return;
    const current = searchParams.get(paramKey);
    if (!current || current === activeTab) return;
    const next = { ...Object.fromEntries(searchParams.entries()) };
    if (activeTab === fallback) delete next[paramKey];
    else next[paramKey] = activeTab;
    setSearchParams(next, { replace: true });
  }, [activeTab, fallback, paramKey, searchParams, setSearchParams, tabs.length]);

  if (!tabs.length) {
    return <AccessDenied title={emptyTitle} description={emptyDescription} />;
  }

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
          <TabIcon size={18} className="text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-600 leading-relaxed">{active.description}</p>
        </div>
      ) : null}

      <div>{active?.element}</div>
    </div>
  );
}
