import React, { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import AddModal from "../../../../components/common/AddModal";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import { StoreAllocationsTable } from "./RequisitionRequestSummary";
import { getRequisitionStoreAllocations } from "./RaiseSupplyRequestModal";

const fieldClassName =
  "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12px] outline-none focus:border-emerald-500 transition-colors text-slate-700";
const readOnlyClassName =
  "w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-[12px] text-slate-700";

function RemoveRowButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
      aria-label={label}
    >
      <Trash2 size={14} />
    </button>
  );
}

export default function BatchApprovalRequestActionModal({
  isOpen,
  onClose,
  requisitions = [],
  onApprove,
}) {
  const items = useMemo(
    () => requisitions.filter((row) => row?.status === "PENDING_SUPPLY_APPROVAL"),
    [requisitions],
  );
  const [visibleIds, setVisibleIds] = useState([]);
  const [rowForms, setRowForms] = useState({});
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setVisibleIds(items.map((row) => row.id));
    setRowForms(
      Object.fromEntries(
        items.map((row) => [
          row.id,
          { approvalComment: "" },
        ]),
      ),
    );
    setErrors({});
    setConfirmOpen(false);
  }, [isOpen, items]);

  const visibleItems = items.filter((row) => visibleIds.includes(row.id));

  const removeRow = (id) => {
    setVisibleIds((current) => current.filter((itemId) => itemId !== id));
    setErrors((current) => {
      const next = { ...current };
      delete next[id];
      delete next.items;
      return next;
    });
  };

  const setRowField = (id, field, value) => {
    setRowForms((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }));
    setErrors((current) => {
      if (!current[id]?.[field]) return current;
      const next = { ...current, [id]: { ...current[id] } };
      delete next[id][field];
      if (Object.keys(next[id]).length === 0) delete next[id];
      return next;
    });
  };

  const requestApproval = () => {
    const nextErrors = {};
    if (visibleItems.length === 0) nextErrors.items = "Keep at least one request, or close this window.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning(nextErrors.items || "Keep at least one request, or close this window.");
      return;
    }
    setConfirmOpen(true);
  };

  const confirmApproval = () => {
    onApprove?.({
      requests: visibleItems.map((row) => ({
        id: row.id,
        quantity: Number(row.actualQuantity ?? row.quantity) || row.quantity,
        storeLocation: row.storeLocation,
        storeLocations: row.storeLocations || [],
        comment: rowForms[row.id].approvalComment.trim(),
        approvalComment: rowForms[row.id].approvalComment.trim(),
      })),
    });
    setConfirmOpen(false);
  };

  return (
    <>
      <AddModal
        isOpen={isOpen && !confirmOpen}
        onClose={onClose}
        onSave={requestApproval}
        title="Approve selected supply requests"
        subtitle="Review raised supply details, then approve each request with a comment. Remove a row to leave it out."
        saveLabel={`Approve selected (${visibleItems.length})`}
        fillViewport
      >
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[1300px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Request</th>
                  <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Item</th>
                  <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Qty requested</th>
                  <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Stores & qty supplied</th>
                  <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Request comment</th>
                  <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Approval comment</th>
                  <th className="w-12 px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 text-right"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-[12px] text-slate-400">
                      No requests left in this list. Close and select items again.
                    </td>
                  </tr>
                ) : visibleItems.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 text-[12px] font-bold text-slate-900">{row.requestNumber}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-700">{row.itemName || row.itemCode}</td>
                    <td className="px-4 py-3">
                      <div className={cn(readOnlyClassName, "min-w-[90px]")}>
                        {row.quantityRequested ?? row.quantity ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top min-w-[260px]">
                      <StoreAllocationsTable allocations={getRequisitionStoreAllocations(row)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className={cn(readOnlyClassName, "min-w-[200px]")}>
                        {row.comment || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <textarea
                        rows={2}
                        value={rowForms[row.id]?.approvalComment ?? ""}
                        onChange={(event) =>
                          setRowField(row.id, "approvalComment", event.target.value)
                        }
                        className={cn(
                          fieldClassName,
                          "min-w-[220px] resize-none",
                          errors[row.id]?.approvalComment && "border-rose-500 bg-rose-50",
                        )}
                        placeholder="Approval comment…"
                      />
                      {errors[row.id]?.approvalComment && (
                        <p className="mt-1 text-[10px] font-medium text-rose-600">
                          {errors[row.id].approvalComment}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <RemoveRowButton
                        onClick={() => removeRow(row.id)}
                        label={`Remove ${row.requestNumber}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {errors.items && <p className="text-[10px] font-medium text-rose-600">{errors.items}</p>}
        </div>
      </AddModal>

      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmApproval}
        className="!z-[10001]"
        title="Approve selected requests?"
        message={`Approve ${visibleItems.length} supply request${visibleItems.length === 1 ? "" : "s"} for issuance?`}
        confirmText="Approve requests"
      />
    </>
  );
}
