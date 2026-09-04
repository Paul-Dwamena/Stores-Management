import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, LayoutGrid, Loader2, Plus, Search } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import Button from "../../../components/common/base/Button";
import AddModal from "../../../components/common/AddModal";
import InputField from "../../../components/common/fields/InputField";
import Label from "../../../components/common/base/Label";
import SearchInput from "../../../components/common/fields/SearchInput";
import { toast } from "../../../components/common/ToastNotification";
import { cn } from "../../../utils/cn";
import {
  addCustomDropdownOption,
  getAllDropdownOptions,
} from "./dropdownOptionCatalog";
import { loadAllDropdownOptionStats } from "./dropdownOptionStats";
import { usePermission } from "../../../hooks/usePermission";
import { canReadDropdownOption } from "../../../permissions/accessMap";

function StatPill({ label, value, tone = "slate", className }) {
  const toneClass =
    tone === "success"
      ? "text-success bg-success-muted border-[#b7d4c8]"
      : tone === "rose"
        ? "text-rose-700 bg-rose-50 border-rose-100"
        : "text-slate-700 bg-slate-50 border-slate-100";

  return (
    <div className={cn("rounded-md border px-2 py-1.5 text-center min-w-[58px]", toneClass, className)}>
      <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-[12px] font-bold tabular-nums mt-0.5">{value}</p>
    </div>
  );
}

function CardStatsRow({ stats, loading }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
      {loading ? (
        <div className="flex items-center gap-2 text-[11px] text-slate-400 py-1">
          <Loader2 size={14} className="animate-spin text-primary" />
          Loading counts…
        </div>
      ) : (
        <>
          <StatPill label="Active" value={stats.active} tone="success" />
          <StatPill label="Inactive" value={stats.inactive} tone="rose" />
          <div className="ml-auto pl-1.5 border-l border-slate-200">
            <StatPill label="Total" value={stats.total} />
          </div>
        </>
      )}
    </div>
  );
}

function DropdownOptionCard({ option, stats, loading }) {
  return (
    <Link
      to={option.path}
      className="group card p-4 border-slate-200 hover:border-primary/30 hover:shadow-md transition-all duration-200 flex flex-col"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[13px] font-bold text-slate-900 group-hover:text-primary transition-colors">
            {option.title}
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">
            {option.description || `Manage ${option.title.toLowerCase()} dropdown values`}
          </p>
        </div>
        <ChevronRight
          size={16}
          className="text-slate-300 group-hover:text-primary shrink-0 mt-0.5 transition-colors"
        />
      </div>

      <CardStatsRow stats={stats} loading={loading} />
    </Link>
  );
}

const EMPTY_FORM = { title: "", description: "" };

export default function DropdownOptionsHub({ embedded = false }) {
  const navigate = useNavigate();
  const { can } = usePermission();
  const [options, setOptions] = useState(() => getAllDropdownOptions());
  const [statsById, setStatsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const visibleOptions = useMemo(
    () => options.filter((option) => canReadDropdownOption(can, option.id)),
    [options, can],
  );

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return visibleOptions;
    return visibleOptions.filter(
      (option) =>
        option.title.toLowerCase().includes(q) ||
        (option.description || "").toLowerCase().includes(q),
    );
  }, [visibleOptions, searchQuery]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const stats = await loadAllDropdownOptionStats(visibleOptions.map((option) => option.id));
      if (!cancelled) {
        setStatsById(stats);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visibleOptions]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const handleCreate = () => {
    try {
      const option = addCustomDropdownOption({
        title: form.title,
        description: form.description,
      });
      setOptions(getAllDropdownOptions());
      setModalOpen(false);
      setForm(EMPTY_FORM);
      toast.success(`"${option.title}" added. Add values on the next screen.`);
      navigate(option.path);
    } catch (error) {
      setFormError(error.message ?? "Could not add this dropdown list.");
    }
  };

  const addButton = (
    <Button size={embedded ? "sm" : "md"} onClick={openCreate}>
      <Plus size={16} />
      Add dropdown options
    </Button>
  );

  return (
    <div className={embedded ? "space-y-4" : "space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-300"}>
      {!embedded && (
        <PageHeader
          title="Dropdown Options"
          description="Configure master lists used across inventory forms and workflows."
        >
          {addButton}
        </PageHeader>
      )}

      {embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <SearchInput
            placeholder="Search dropdown options…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white sm:max-w-xs"
          />
          {addButton}
        </div>
      )}

      {!embedded && (
        <>
          <div className="card p-4 border-slate-200 bg-slate-50/60 flex items-start gap-3">
            <LayoutGrid size={18} className="text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Select a card to open its setup page. Active and inactive counts reflect items currently
              available in dropdowns across the platform.
            </p>
          </div>
          <SearchInput
            placeholder="Search dropdown options…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white"
          />
        </>
      )}

      {filteredOptions.length === 0 ? (
        <div className="card border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
            <Search size={18} />
          </div>
          <p className="text-[13px] font-bold text-slate-800">
            {searchQuery.trim()
              ? `No dropdowns match "${searchQuery.trim()}"`
              : "No dropdown options available for your permissions."}
          </p>
          {searchQuery.trim() ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-4 text-[11px] font-bold text-primary hover:text-primary-hover transition-colors"
            >
              Clear search
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOptions.map((option) => (
            <DropdownOptionCard
              key={option.id}
              option={option}
              stats={statsById[option.id] ?? { active: 0, inactive: 0, total: 0 }}
              loading={loading}
            />
          ))}
        </div>
      )}

      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleCreate}
        title="Add dropdown options"
        subtitle="Create a new master list, then add the values it should offer."
        saveLabel="Create list"
      >
        <div className="space-y-4">
          <InputField
            label="Name"
            id="dropdownOptionListName"
            required
            value={form.title}
            error={formError}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, title: e.target.value }));
              if (formError) setFormError("");
            }}
            placeholder="e.g. Packaging type"
          />
          <div className="space-y-1.5">
            <Label htmlFor="dropdownOptionListDescription">Description</Label>
            <textarea
              id="dropdownOptionListDescription"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-primary text-slate-700 resize-y min-h-[80px]"
            />
          </div>
        </div>
      </AddModal>
    </div>
  );
}
