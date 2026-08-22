import React from "react";
import ReactDOM from "react-dom";
import { Shield, X } from "lucide-react";
import Button from "../../../../components/common/base/Button";
import PermissionMatrixTable from "./PermissionMatrixTable";
import { countRolePermissions } from "../utils/roleHelpers";

export default function ViewRoleModal({
  isOpen,
  onClose,
  role,
  onEdit,
  onDelete,
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

  const permissionCount = countRolePermissions(role.permissions);

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 animate-in fade-in duration-200"
        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        onClick={onClose}
      />

      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between border-b border-slate-100 p-4 sm:p-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Shield size={18} className="shrink-0 text-emerald-600" />
              <h2 className="truncate text-lg font-extrabold text-slate-900">
                {role.name}
              </h2>
            </div>
            <p className="mt-1 text-[12px] font-medium text-slate-500">
              {role.description || "No description provided for this role."}
            </p>
            <p className="mt-2 text-[11px] font-bold text-amber-600">
              {permissionCount} permissions assigned
              {role.isSystem ? " · System role" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <PermissionMatrixTable permissions={role.permissions} readOnly />
        </div>

        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6">
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <Button onClick={onClose} variant="ghost" size="modal" className="border border-slate-200">
              Close
            </Button>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {!role.isSystem && onDelete ? (
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
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
