import React from "react";
import RequestDetailsModal, { DetailRow } from "../../../components/common/details/RequestDetailsModal";
import Button from "../../../components/common/base/Button";
import SectionLoadState from "../../../components/common/SectionLoadState";

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
  onDelete,
  deleteLabel = "Delete",
  onToggleStatus,
  statusActionLabel,
  loading = false,
  error = null,
  onRetry,
}) {
  const isActive = status === "Active";
  const busy = loading || Boolean(error);

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
        busy ? null : (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {onDelete ? (
            <Button variant="danger" size="modal" onClick={onDelete}>
              {deleteLabel}
            </Button>
          ) : null}
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
        )
      }
    >
      <SectionLoadState
        loading={loading}
        error={error}
        onRetry={onRetry}
        loadingLabel="Loading details…"
        errorTitle="Couldn’t load details"
      >
        <div className="rounded-xl border border-slate-100 px-4">
          {fields.map((field) => (
            <DetailRow key={field.label} label={field.label}>
              {field.value || "—"}
            </DetailRow>
          ))}
        </div>
      </SectionLoadState>
    </RequestDetailsModal>
  );
}
