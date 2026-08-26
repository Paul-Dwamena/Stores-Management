import React, { useEffect, useState } from "react";
import AddModal from "../../../../components/common/AddModal";
import Button from "../../../../components/common/base/Button";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import SectionLoadState from "../../../../components/common/SectionLoadState";
import {
  ConfiguredCustomFields,
  ShowConfiguredField,
} from "../../../../components/common/ConfiguredFormSections";
import { requiredFieldLabel } from "../../../../components/common/fields/requiredFieldLabel";
import { useFormTreeSections } from "../../../../hooks/useFormTreeSections";
import {
  APPROVE_SUPPLY_REQUEST_FORM_FIELD_CATALOG,
  APPROVE_SUPPLY_REQUEST_FORM_SETUP_CHANGED_EVENT,
  getActiveApproveSupplyRequestFormSections,
  getApproveSupplyRequestFormSetup,
} from "../../../../mockdata/setups";
import RequisitionRequestSummary from "./RequisitionRequestSummary";
import RejectRequisitionModal from "./RejectRequisitionModal";

const readOnlyClassName =
  "w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-[12px] text-slate-700";
const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 transition-colors text-slate-700 resize-none";

function ReadOnlyField({ label, value }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <div className={readOnlyClassName}>{value || "—"}</div>
    </div>
  );
}

export default function ApprovalRequestActionModal({
  isOpen,
  onClose,
  requisition,
  onSubmit,
  onReject,
  loading = false,
  error = null,
  onRetry,
}) {
  const busy = loading || Boolean(error);
  const [approvalComment, setApprovalComment] = useState("");
  const [customValues, setCustomValues] = useState({});
  const [errors, setErrors] = useState({});
  const [rejectOpen, setRejectOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const { sections, visibleKeys } = useFormTreeSections(
    APPROVE_SUPPLY_REQUEST_FORM_SETUP_CHANGED_EVENT,
    getApproveSupplyRequestFormSetup,
    getActiveApproveSupplyRequestFormSections,
  );
  const systemKeys = new Set(APPROVE_SUPPLY_REQUEST_FORM_FIELD_CATALOG.map((field) => field.key));

  useEffect(() => {
    if (!isOpen || !requisition) return;
    setApprovalComment("");
    setCustomValues({});
    setErrors({});
    setRejectOpen(false);
    setConfirmOpen(false);
    setPendingPayload(null);
  }, [isOpen, requisition]);

  const handleSubmit = () => {
    setErrors({});
    setPendingPayload({ approvalComment: approvalComment.trim() });
    setConfirmOpen(true);
  };

  const finalizeSubmit = () => {
    if (!pendingPayload) return;
    onSubmit?.(pendingPayload);
    setPendingPayload(null);
    setConfirmOpen(false);
  };

  return (
    <>
      <AddModal
        isOpen={isOpen && !rejectOpen && !confirmOpen}
        onClose={onClose}
        onSave={handleSubmit}
        title="Approve supply request"
        subtitle="Review the raised supply details, then approve or reject with a comment."
        dialogClassName="max-w-3xl"
        saveLabel="Approve"
        saveDisabled={busy}
        hideCancelButton
        secondaryAction={{ label: "Cancel", onClick: onClose }}
        footerActions={
          busy ? null : (
            <Button variant="danger" size="modal" onClick={() => setRejectOpen(true)}>
              Reject
            </Button>
          )
        }
      >
        <SectionLoadState
          loading={loading}
          error={error}
          onRetry={onRetry}
          loadingLabel="Loading request…"
          errorTitle="Couldn’t load this request"
        >
        <div className="space-y-4">
          <RequisitionRequestSummary requisition={requisition} />
          <ShowConfiguredField visibleKeys={visibleKeys} fieldKey="requestComment">
            <ReadOnlyField
              label="Request comment"
              value={requisition?.comment || "—"}
            />
          </ShowConfiguredField>
          {visibleKeys.has("approvalComment") ? (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {requiredFieldLabel("Approval comment", false)}
            </label>
            <textarea
              value={approvalComment}
              onChange={(e) => {
                setApprovalComment(e.target.value);
                setErrors((current) => ({ ...current, approvalComment: undefined }));
              }}
              rows={3}
              placeholder="Add an approval or decision comment…"
              className={fieldClassName}
            />
            {errors.approvalComment ? (
              <p className="text-[10px] text-rose-600">{errors.approvalComment}</p>
            ) : null}
          </div>
          ) : null}
          <ConfiguredCustomFields
            sections={sections}
            systemKeys={systemKeys}
            form={customValues}
            formErrors={errors}
            handleChange={(key) => (event) => {
              const value = event?.target ? event.target.value : event;
              setCustomValues((current) => ({ ...current, [key]: value }));
            }}
            idPrefix="asr"
          />
        </div>
        </SectionLoadState>
      </AddModal>

      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setPendingPayload(null);
        }}
        onConfirm={finalizeSubmit}
        className="!z-[10001]"
        title="Approve supply request?"
        message={
          requisition?.requestNumber
            ? `Approve ${requisition.requestNumber}? This moves the request to pending issuance.`
            : "Approve this supply request? This moves it to pending issuance."
        }
        confirmText="Approve"
      />

      <RejectRequisitionModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        requestLabel={requisition?.requestNumber}
        onConfirm={(reason, mode) => {
          setRejectOpen(false);
          onReject?.(reason, mode);
        }}
      />
    </>
  );
}
