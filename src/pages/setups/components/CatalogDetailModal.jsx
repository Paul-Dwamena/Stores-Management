import React from "react";
import RequestDetailsModal, { DetailRow } from "../../../components/common/details/RequestDetailsModal";
import Button from "../../../components/common/base/Button";

export default function CatalogDetailModal({
  isOpen,
  onClose,
  title,
  subtitle,
  status,
  identifier,
  fields = [],
  onEdit,
  editLabel = "Edit",
  onToggleStatus,
  statusActionLabel,
}) {
  const isActive = status === "Active";

  return (
    <RequestDetailsModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      status={status}
      identifier={identifier}
      dialogClassName="max-w-lg"
      footerRight={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {onToggleStatus ? (
            <Button
              variant={isActive ? "danger" : "secondary"}
              size="modal"
              onClick={onToggleStatus}
            >
              {statusActionLabel || (isActive ? "Deactivate" : "Activate")}
            </Button>
          ) : null}
          {onEdit ? (
            <Button size="modal" onClick={onEdit}>
              {editLabel}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="rounded-xl border border-slate-100 px-4">
        {fields.map((field) => (
          <DetailRow key={field.label} label={field.label}>
            {field.value || "—"}
          </DetailRow>
        ))}
      </div>
    </RequestDetailsModal>
  );
}
