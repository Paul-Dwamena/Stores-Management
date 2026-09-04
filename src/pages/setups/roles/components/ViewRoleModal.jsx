import React from "react";
import ReactDOM from "react-dom";
import { Shield, X, Info } from "lucide-react";
import Button from "../../../../components/common/base/Button";
import SectionLoadState from "../../../../components/common/SectionLoadState";
import { isBuiltInRole, isSuperAdminSystemRole } from "../../../../services/rolesService";
import PermissionMatrixTable from "./PermissionMatrixTable";

export default function ViewRoleModal({
  isOpen,
  onClose,
  role,
  catalog = [],
  canReadPermissions = true,
  onEdit,
  onDelete,
  loading = false,
  error = null,
  onRetry,
}) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !role) return null;

  const permissionCount = role.permissionCount ?? role.permissions?.length ?? 0;
  const isSuperAdmin = isSuperAdminSystemRole(role);
  const isSystem = isBuiltInRole(role);

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 animate-in fade-in duration-200"
        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        onClick={onClose}
      />

      <div className="relative flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between border-b border-slate-100 p-4 sm:p-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Shield size={18} className="shrink-0 text-primary" />
              <h2 className="truncate text-lg font-extrabold text-slate-900">
                {role.label || role.name}
              </h2>
            </div>
            <p className="mt-1 text-[12px] font-medium text-slate-500">
              {role.description || "No description provided for this role."}
            </p>
            <p className="mt-2 text-[11px] font-bold text-amber-600">
              {permissionCount} permissions assigned
              {isSystem ? " · System role" : ""}
            </p>
            {isSuperAdmin ? (
              <div className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-md border border-sky-100 bg-sky-50 px-2 py-1 text-[10px] font-medium text-sky-700">
                <Info size={12} className="shrink-0 text-sky-500" />
                <span>Super Admin permissions cannot be edited or deleted.</span>
              </div>
            ) : isSystem ? (
              <div className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-md border border-sky-100 bg-sky-50 px-2 py-1 text-[10px] font-medium text-sky-700">
                <Info size={12} className="shrink-0 text-sky-500" />
                <span>System role name is locked; permissions can be edited.</span>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative min-h-[180px] flex-1 overflow-auto px-4 py-4 sm:px-6 sm:py-6">
            <SectionLoadState
            loading={loading}
            error={error}
            onRetry={onRetry}
            loadingLabel="Loading role…"
            errorTitle="Couldn’t load role details"
          >
            {canReadPermissions ? (
              <PermissionMatrixTable
                catalog={catalog}
                selectedIds={(role.permissions || []).map((permission) => permission.id)}
                readOnly
              />
            ) : (
              <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8">
                <span
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium italic text-slate-400"
                  title="You don't have permission to view permissions"
                >
                  <Info size={14} className="shrink-0" aria-hidden="true" />
                  Access denied
                </span>
              </div>
            )}
          </SectionLoadState>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6">
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <Button onClick={onClose} variant="ghost" size="modal" className="border border-slate-200">
              Close
            </Button>
            {loading || error ? null : (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {onDelete ? (
                  <Button variant="danger" size="modal" onClick={onDelete}>
                    Delete
                  </Button>
                ) : null}
                {onEdit ? (
                  <Button size="modal" onClick={onEdit}>
                    Edit
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
