import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { cn } from "../../../utils/cn";
import { requiredFieldLabel } from "./requiredFieldLabel";
import { emitConfiguredValue } from "./LocationField";
import { resolveSearchSelectChoices } from "../../../mockdata/setups/searchSelectSources";
import { resolveDropdownOptionChoices } from "../../../mockdata/setups/dropdownOptionChoices";

const inputClassName =
  "w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 focus:bg-white text-slate-700 placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed";

const MENU_MAX_HEIGHT = 208;
const MENU_GAP = 4;

function optionRows(options = []) {
  return (options ?? []).map((option) =>
    typeof option === "string"
      ? { value: option, label: option, description: "" }
      : {
          value: option.value,
          label: option.label ?? option.value,
          description: option.description || option.subtitle || "",
        },
  );
}

export default function ConfiguredSearchSelectField({
  field,
  id,
  values = {},
  error,
  onChange,
  spanClass,
  required = false,
  action = null,
  loading = false,
}) {
  const formKey = field.formKey || field.key;
  const value = values[formKey] ?? "";
  const label = requiredFieldLabel(field.title, required === true);
  const options = useMemo(() => {
    if (field.searchSelectSource) {
      return resolveSearchSelectChoices(field.searchSelectSource);
    }
    if (field.optionsSource === "dropdown" && field.dropdownOptionId) {
      return resolveDropdownOptionChoices(field.dropdownOptionId);
    }
    return optionRows(field.options);
  }, [field.searchSelectSource, field.optionsSource, field.dropdownOptionId, field.options]);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);

  const selected = useMemo(
    () => options.find((option) => String(option.value) === String(value)) ?? null,
    [options, value],
  );
  const selectedLabel = selected?.label ?? "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? options.filter((option) =>
          `${option.label} ${option.description || ""} ${option.value}`.toLowerCase().includes(q),
        )
      : options;
    return list.slice(0, 80);
  }, [options, query]);

  useEffect(() => {
    if (!value) setQuery("");
    else if (selectedLabel) setQuery(selectedLabel);
  }, [value, selectedLabel]);

  const updateMenuPosition = () => {
    const trigger = inputRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP;
    const spaceAbove = rect.top - MENU_GAP;
    const openUpward = spaceBelow < Math.min(MENU_MAX_HEIGHT, 160) && spaceAbove > spaceBelow;
    const maxHeight = Math.min(
      MENU_MAX_HEIGHT,
      Math.max(120, openUpward ? spaceAbove : spaceBelow),
    );
    setMenuStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      maxHeight,
      zIndex: 10050,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + MENU_GAP }
        : { top: rect.bottom + MENU_GAP }),
    });
  };

  useLayoutEffect(() => {
    if (!open || options.length === 0) return undefined;
    updateMenuPosition();
    const handleReposition = () => updateMenuPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, filtered.length, options.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const inTrigger = containerRef.current?.contains(event.target);
      const inMenu = menuRef.current?.contains(event.target);
      if (!inTrigger && !inMenu) {
        setOpen(false);
        if (selected) setQuery(selectedLabel);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected, selectedLabel]);

  const commit = (nextValue) => emitConfiguredValue(onChange, formKey, nextValue);

  return (
    <div className={cn("space-y-1.5", spanClass)}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider",
            error ? "text-red-500" : "text-slate-500",
          )}
        >
          {label}
        </label>
        {action}
      </div>
      {field.description?.trim() ? (
        <p className="text-[11px] text-slate-500 leading-snug">{field.description.trim()}</p>
      ) : null}

      <div ref={containerRef} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={open ? query : selectedLabel || query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (value && event.target.value !== selectedLabel) commit("");
          }}
          onFocus={() => {
            setOpen(true);
            if (selected) setQuery("");
          }}
          placeholder={
            loading
              ? "Loading…"
              : options.length === 0
                ? "No options available"
                : (field.placeholder?.trim() || "Search…")
          }
          disabled={loading || options.length === 0}
          autoComplete="off"
          className={cn(inputClassName, error && "border-red-500 bg-red-50")}
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              commit("");
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
            aria-label="Clear selection"
          >
            <X size={14} />
          </button>
        ) : null}

      </div>
      {error ? <p className="text-[10px] font-medium text-red-500">{error}</p> : null}

      {open && options.length > 0 && menuStyle && typeof document !== "undefined"
        ? createPortal(
            <ul
              ref={menuRef}
              style={menuStyle}
              className="overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-[11px] text-slate-400">No matching results</li>
              ) : (
                filtered.map((option) => {
                  const isSelected = String(option.value) === String(value);
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => {
                          commit(option.value);
                          setQuery(option.label);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50",
                          isSelected ? "bg-slate-50 text-primary" : "text-slate-800",
                        )}
                      >
                        <span className="min-w-0 truncate text-[12px] font-medium">
                          {option.label}
                        </span>
                        {option.description ? (
                          <span
                            className={cn(
                              "shrink-0 text-[11px] font-medium",
                              isSelected ? "text-primary/70" : "text-slate-400",
                            )}
                          >
                            {option.description}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
