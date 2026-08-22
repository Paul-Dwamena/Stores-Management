import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "../../../utils/cn";

const triggerClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 focus:bg-white text-left text-slate-700 flex items-center justify-between gap-2";

const MENU_MAX_HEIGHT = 240;
const MENU_GAP = 4;

const CheckboxMultiSelect = ({
  value = [],
  onChange,
  options = [],
  label,
  id = "checkboxMultiSelect",
  placeholder = "Select options…",
  disabled = false,
  emptyMessage = "No options available.",
  error,
  required = false,
  nowrapOptions = false,
  formatSelectionLabel,
  searchable = false,
  searchPlaceholder = "Search…",
}) => {
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuStyle, setMenuStyle] = useState(null);

  const selectedOptions = useMemo(
    () => options.filter((option) => value.includes(option.value)),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    if (!searchable) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) =>
      [option.label, option.description, option.value]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [options, query, searchable]);

  const triggerLabel = useMemo(() => {
    if (selectedOptions.length === 0) return placeholder;
    if (formatSelectionLabel) return formatSelectionLabel(selectedOptions.length);
    if (selectedOptions.length === 1) return selectedOptions[0].label;
    return `${selectedOptions.length} selected`;
  }, [formatSelectionLabel, placeholder, selectedOptions]);

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP;
    const spaceAbove = rect.top - MENU_GAP;
    const openUpward = spaceBelow < Math.min(MENU_MAX_HEIGHT, 180) && spaceAbove > spaceBelow;
    const maxHeight = Math.min(
      MENU_MAX_HEIGHT,
      Math.max(120, openUpward ? spaceAbove : spaceBelow),
    );

    setMenuStyle({
      position: "fixed",
      left: rect.left,
      width: Math.max(rect.width, 220),
      maxHeight,
      zIndex: 10050,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + MENU_GAP }
        : { top: rect.bottom + MENU_GAP }),
    });
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    updateMenuPosition();
    const handleReposition = () => updateMenuPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, filteredOptions.length, searchable]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const inTrigger = containerRef.current?.contains(e.target);
      const inMenu = menuRef.current?.contains(e.target);
      if (!inTrigger && !inMenu) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const toggleOption = (optionValue) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((id) => id !== optionValue)
        : [...value, optionValue],
    );
  };

  const menu = open && !disabled && menuStyle
    ? createPortal(
      <div
        ref={menuRef}
        style={menuStyle}
        className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
      >
        {searchable ? (
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2.5 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white"
                autoFocus
              />
            </div>
          </div>
        ) : null}
        <div className="overflow-y-auto py-1" style={{ maxHeight: searchable ? "calc(100% - 44px)" : "100%" }}>
          {filteredOptions.length === 0 ? (
            <p className="px-3 py-2 text-[11px] text-slate-400">
              {options.length === 0 ? emptyMessage : "No matching options."}
            </p>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-start gap-2.5 px-3 py-2.5 cursor-pointer transition-colors hover:bg-emerald-50",
                    isSelected && "bg-emerald-50/60",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOption(option.value)}
                    className="mt-0.5"
                  />
                  <span className="min-w-0 flex-1">
                    <span className={cn(
                      "block text-[11px] font-medium text-slate-800 leading-snug",
                      nowrapOptions && "whitespace-nowrap",
                    )}>
                      {option.label}
                    </span>
                    {option.description && (
                      <span className={cn(
                        "block text-[10px] text-slate-500 mt-0.5",
                        nowrapOptions && "whitespace-nowrap",
                      )}>
                        {option.description}
                      </span>
                    )}
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>,
      document.body,
    )
    : null;

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider",
            error ? "text-red-500" : "text-slate-500",
          )}
        >
          {label}
          {required ? (
            <span className="normal-case !text-red-500" aria-hidden="true">
              {" "}
              *
            </span>
          ) : null}
        </label>
      )}

      <div ref={containerRef} className="relative">
        <button
          id={id}
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            triggerClassName,
            disabled && "opacity-60 cursor-not-allowed",
            open && "border-emerald-500 bg-white",
            error && "border-red-500 bg-red-50/30",
          )}
        >
          <span className={cn("truncate", selectedOptions.length === 0 && "text-slate-400")}>
            {triggerLabel}
          </span>
          <ChevronDown
            size={16}
            className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")}
          />
        </button>
        {menu}
      </div>

      {error && (
        <p className="text-[10px] font-medium text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default CheckboxMultiSelect;
