import React from "react";
import { addRequisition } from "../../../../mockdata/stores";
import NewRequisitionModal from "../../../stores/supplies/components/NewRequisitionModal";
import { buildStoresRequestPayload } from "../utils/requestHelpers";

export default function NewRequestModal({ isOpen, onClose, onSave }) {
  return (
    <NewRequisitionModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={(requisition) => {
        const created = addRequisition({
          ...requisition,
          kind: "accessories",
        });
        onSave?.(buildStoresRequestPayload(created ?? requisition));
      }}
    />
  );
}
