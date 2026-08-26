import React, { useMemo } from "react";
import { cn } from "../../../../utils/cn";
import { formatRoleName } from "../../../../services/rolesService";
import { buildPermissionMatrix } from "../utils/roleHelpers";

function PermissionCheckbox({ checked, onChange, readOnly, label, disabled }) {
  if (disabled) {
    return (
      <div className="flex cursor-not-allowed justify-center py-2" title="Not available">
        <input
          type="checkbox"
          checked={false}
          disabled
          readOnly
          aria-label={label}
          className="h-4 w-4 cursor-not-allowed rounded border-slate-100 bg-slate-100 text-slate-300 opacity-30"
        />
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="flex justify-center py-2" title={label}>
        <span
          className={cn(
            "inline-flex h-4 w-4 items-center justify-center rounded border",
            checked
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white",
          )}
          aria-label={label}
        >
          {checked && (
            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="currentColor">
              <path d="M10.2 2.8 4.7 8.3 1.8 5.4l1.4-1.4 1.5 1.5 4.1-4.1z" />
            </svg>
          )}
        </span>
      </div>
    );
  }

  return (
    <label className="flex cursor-pointer justify-center py-2" title={label}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-slate-900/25"
        aria-label={label}
      />
    </label>
  );
}

export default function PermissionMatrixTable({
  catalog = [],
  selectedIds = [],
  onToggle,
  readOnly = false,
}) {
  const matrix = useMemo(() => buildPermissionMatrix(catalog), [catalog]);
  const selected = useMemo(
    () => new Set(selectedIds.map((id) => Number(id))),
    [selectedIds],
  );

  if (!catalog.length) {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-[12px] text-slate-500">
        No permissions available.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-max min-w-full text-left border-separate border-spacing-0">
        <thead className="bg-slate-50">
          <tr className="border-b border-slate-200">
            <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap border-b border-r border-slate-200">
              Permission Name
            </th>
            {matrix.actions.map((action) => (
              <th
                key={action}
                className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap border-b border-slate-200"
              >
                {formatRoleName(action)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {matrix.resources.map((resource) => (
            <tr key={resource} className="group hover:bg-slate-50/40">
              <td className="sticky left-0 z-20 bg-white px-4 py-2 text-[12px] font-semibold text-slate-800 whitespace-nowrap border-b border-r border-slate-200 group-hover:bg-slate-50">
                {formatRoleName(resource)}
              </td>
              {matrix.actions.map((action) => {
                const permission = matrix.cell[resource]?.[action];
                const label = `${formatRoleName(action)} - ${formatRoleName(resource)}`;
                return (
                  <td key={`${resource}-${action}`} className="relative z-0 px-4 py-1 whitespace-nowrap border-b border-slate-100">
                    <PermissionCheckbox
                      checked={Boolean(permission && selected.has(Number(permission.id)))}
                      readOnly={readOnly}
                      disabled={!permission}
                      label={label}
                      onChange={(checked) => onToggle?.(permission.id, checked)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
