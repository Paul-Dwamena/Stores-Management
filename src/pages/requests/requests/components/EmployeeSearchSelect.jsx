import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "../../../../utils/cn";

const inputClassName =
  "w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 focus:bg-white text-slate-700 placeholder:text-slate-400";

function employeeSearchText(employee) {
  return [employee.name, employee.department, employee.position]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function EmployeeSearchSelect({
  value,
  onChange,
  employees = [],
  label = "Employee",
  id = "employeeSearch",
  placeholder = "Search by name, department, or role…",
  error,
  disabled = false,
}) {
  const containerRef = useRef(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === value) ?? null,
    [employees, value],
  );

  const selectedLabel = selectedEmployee?.name ?? "";

  const filteredEmployees = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? employees.filter((employee) => employeeSearchText(employee).includes(q))
      : employees;
    return list.slice(0, 25);
  }, [employees, query]);

  useEffect(() => {
    if (value && selectedEmployee) {
      setQuery(selectedEmployee.name);
      return;
    }
    if (!value) setQuery("");
  }, [value, selectedEmployee]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
        if (selectedEmployee) setQuery(selectedLabel);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedEmployee, selectedLabel]);

  const handleSelect = (employee) => {
    onChange(employee.id);
    setQuery(employee.name);
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setQuery("");
    setOpen(false);
  };

  const handleInputChange = (event) => {
    const next = event.target.value;
    setQuery(next);
    setOpen(true);
    if (value && next !== selectedLabel) onChange("");
  };

  const handleFocus = () => {
    setOpen(true);
    if (selectedEmployee) setQuery("");
  };

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className={cn(
          "text-[10px] font-bold uppercase tracking-wider",
          error ? "text-red-500" : "text-slate-500",
        )}
      >
        {label}
      </label>
      <div ref={containerRef} className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={cn(
            inputClassName,
            error && "border-red-500 bg-red-50/30 focus:border-red-500",
          )}
        />
        {(query || value) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label="Clear employee"
          >
            <X size={14} />
          </button>
        )}
        {open && filteredEmployees.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {filteredEmployees.map((employee) => (
              <li key={employee.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(employee)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50"
                >
                  <p className="text-[12px] font-semibold text-slate-800">{employee.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {employee.department} · {employee.position}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-[10px] font-medium text-red-500">{error}</p>}
    </div>
  );
}
