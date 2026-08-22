import React from "react";
import { cn } from "../../../../utils/cn";
import {
  PERMISSION_ACTIONS,
  PERMISSION_ACTION_LABELS,
  PERMISSION_MODULES,
} from "../utils/roleConstants";

function PermissionCheckbox({ checked, onChange, readOnly, label }) {
  if (readOnly) {
    return (
      <div className="flex justify-center py-2">
        <span
          className={cn(
            "inline-flex h-4 w-4 items-center justify-center rounded border",
            checked
              ? "border-emerald-500 bg-emerald-500 text-white"
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
    <label className="flex cursor-pointer justify-center py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
        aria-label={label}
      />
    </label>
  );
}

export default function PermissionMatrixTable({
  permissions,
  onPermissionChange,
  readOnly = false,
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full min-w-[640px] text-left">
        <thead className="bg-slate-50">
          <tr className="border-b border-slate-200">
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Permission Name
            </th>
            {PERMISSION_ACTIONS.map((action) => (
              <th
                key={action}
                className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500"
              >
                {PERMISSION_ACTION_LABELS[action]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {PERMISSION_MODULES.map((module) => (
            <tr key={module.id} className="hover:bg-slate-50/40">
              <td className="px-4 py-2 text-[12px] font-semibold text-slate-800">
                {module.label}
              </td>
              {PERMISSION_ACTIONS.map((action) => (
                <td key={`${module.id}-${action}`} className="px-3 py-1">
                  <PermissionCheckbox
                    checked={Boolean(permissions?.[module.id]?.[action])}
                    readOnly={readOnly}
                    label={`${module.label} ${PERMISSION_ACTION_LABELS[action]}`}
                    onChange={(checked) =>
                      onPermissionChange?.(module.id, action, checked)
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
