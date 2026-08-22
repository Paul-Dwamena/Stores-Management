import React, { useEffect, useState } from "react";
import AddModal from "../../../../components/common/AddModal";
import { toast } from "../../../../components/common/ToastNotification";
import { addRequisition } from "../../../../mockdata/stores";
import NewRequisitionModal from "../../../stores/supplies/components/NewRequisitionModal";
import {
  REQUEST_TYPE_OPTIONS,
  buildStoresRequestPayload,
  getRequestTypeAction,
  getRequestTypeLabel,
} from "../utils/requestHelpers";

export default function NewRequestModal({ isOpen, onClose, onSave }) {
  const [requestType, setRequestType] = useState("request_from_stores");
  const [supplyRequestOpen, setSupplyRequestOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setRequestType("request_from_stores");
    setSupplyRequestOpen(false);
  }, [isOpen]);

  const handleContinue = () => {
    const action = getRequestTypeAction(requestType);
    if (!action) {
      toast.warning("This request type is not configured yet.");
      return;
    }
    if (action.mode === "modal" && action.template === "stores") {
      onClose();
      setSupplyRequestOpen(true);
    }
  };

  return (
    <>
      <AddModal
        isOpen={isOpen}
        onClose={onClose}
        title="New request"
        saveLabel="Continue"
        onSave={handleContinue}
      >
        <div className="space-y-3">
          <p className="text-[11px] text-muted">
            Request accessories from store inventory. After you submit, the request appears in Approvals.
          </p>
          <label className="text-[10px] font-bold uppercase tracking-wider text-subtle" htmlFor="requestType">
            Request type
          </label>
          <select
            id="requestType"
            value={requestType}
            onChange={(event) => setRequestType(event.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-border rounded-lg text-[12px] outline-none focus:border-brand text-text"
          >
            {REQUEST_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-subtle">
            {getRequestTypeLabel(requestType)} — continue to fill in the item request form.
          </p>
        </div>
      </AddModal>

      <NewRequisitionModal
        isOpen={supplyRequestOpen}
        onClose={() => setSupplyRequestOpen(false)}
        onSave={(requisition) => {
          const created = addRequisition({
            ...requisition,
            kind: "accessories",
          });
          onSave?.(buildStoresRequestPayload(created ?? requisition));
          setSupplyRequestOpen(false);
        }}
      />
    </>
  );
}
