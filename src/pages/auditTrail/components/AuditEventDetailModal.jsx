import React from "react";
import AddModal from "../../../components/common/AddModal";
import { cn } from "../../../utils/cn";
import { EMPTY_DISPLAY } from "../../../utils/apiResponseHelpers";
import { formatAuditWhen } from "../../../services/auditService";
import { AuditActionBadge } from "../utils/auditActionBadge";

function MetaItem({ label, value, className }) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-[13px] font-medium text-slate-800 break-words">{value || EMPTY_DISPLAY}</p>
    </div>
  );
}

export default function AuditEventDetailModal({ isOpen, onClose, event }) {
  if (!event) return null;

  const userLabel = event.user?.email
    ? `${event.user.name} (${event.user.email})`
    : event.user?.name || "System";

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      title="Audit event"
      subtitle={event.resourceTarget}
      dialogClassName="max-w-xl"
      hideCancelButton
      saveLabel="Close"
      onSave={onClose}
    >
      <div className="space-y-5">
        <p className="text-[13px] text-slate-600 leading-relaxed">
          {event.description || EMPTY_DISPLAY}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-slate-100 bg-slate-50/60 p-4">
          <MetaItem label="Created at" value={formatAuditWhen(event.createdAt)} />
          <MetaItem label="Resource" value={event.resourceLabel} />
          <MetaItem label="Resource ID" value={event.resourceId ?? EMPTY_DISPLAY} />
          <MetaItem label="Action" value={<AuditActionBadge action={event.action} actionLabel={event.actionLabel} />} />
          <MetaItem label="User" value={userLabel} />
          <MetaItem label="IP address" value={event.ipAddress} />
          <MetaItem label="User agent" value={event.userAgent} className="sm:col-span-2" />
        </div>

        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Audit metadata
          </p>
          {(event.changes ?? []).length === 0 ? (
            <p className="text-[12px] text-slate-400">No audit metadata recorded.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Field
                    </th>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Before
                    </th>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      After
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {event.changes.map((change) => (
                    <tr key={`${event.id}-${change.field}`}>
                      <td className="px-3 py-2.5 text-[12px] font-semibold text-slate-700">
                        {change.field}
                      </td>
                      <td className="px-3 py-2.5 text-[12px] text-slate-500">{change.before}</td>
                      <td
                        className={cn(
                          "px-3 py-2.5 text-[12px] font-medium",
                          change.after === "Removed" ? "text-rose-600" : "text-primary",
                        )}
                      >
                        {change.after}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AddModal>
  );
}
