import React, { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import Button from "../../../../components/common/base/Button";
import RequestDetailsModal, {
  AccordionSection,
  DetailRow,
  FileAttachmentRow,
  StatusPill,
} from "../../../../components/common/details/RequestDetailsModal";
import { formatApprovalAmount } from "../../../../mockdata/approvals";

function ApproverRow({ approver }) {
  return (
    <div className="rounded-lg border border-slate-100 p-3 bg-slate-50/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold text-slate-900">{approver.name}</p>
          {approver.date ? (
            <p className="text-[11px] text-slate-400 mt-0.5">{approver.date}</p>
          ) : null}
        </div>
        <StatusPill status={approver.status} />
      </div>
      {approver.comment ? (
        <p className="text-[12px] text-slate-600 mt-2 leading-relaxed">{approver.comment}</p>
      ) : null}
    </div>
  );
}

export default function ApprovalRequestDetailModal({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
}) {
  const [openSections, setOpenSections] = useState({
    documents: true,
    payment: true,
    information: true,
    history: true,
  });

  if (!isOpen || !request) return null;

  const isPending = request.queue === "pending";
  const toggle = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <RequestDetailsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Details"
      subtitle={
        isPending
          ? "Review the request details, then approve or reject."
          : "Complete information about the request."
      }
      status={request.status}
      identifier={request.requestNumber}
      footerRight={
        isPending ? (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button onClick={() => onReject?.(request)} variant="danger" size="modal">
              <XCircle size={16} />
              Reject
            </Button>
            <Button onClick={() => onApprove?.(request)} variant="primary" size="modal">
              <CheckCircle2 size={16} />
              Approve
            </Button>
          </div>
        ) : null
      }
    >
      <AccordionSection
        title="Supporting Documents"
        open={openSections.documents}
        onToggle={() => toggle("documents")}
      >
        {request.spendingDetails ? null : (
          <>
            <DetailRow label="Receipt Number">
              {request.supportingDocuments?.receiptNumber || "—"}
            </DetailRow>
            <DetailRow label="Receipt Date Of Purchase">
              {request.supportingDocuments?.purchaseDate || "—"}
            </DetailRow>
          </>
        )}
        {request.spendingDetails?.attachments
        && Object.keys(request.spendingDetails.attachments).length > 0 ? (
          Object.entries(request.spendingDetails.attachments).map(([key, value]) => (
            <FileAttachmentRow key={key} label={key.replaceAll("_", " ")} fileName={value} />
          ))
        ) : (
          <FileAttachmentRow
            label="File Attachment"
            fileName={request.supportingDocuments?.fileName}
          />
        )}
      </AccordionSection>

      <AccordionSection
        title="Payment Details"
        open={openSections.payment}
        onToggle={() => toggle("payment")}
      >
        {request.paymentDetails ? (
          <>
            <DetailRow label="Payment Reference">
              {request.paymentDetails.paymentReference}
            </DetailRow>
            <DetailRow label="Transaction ID">{request.paymentDetails.transactionId}</DetailRow>
            <DetailRow label="Payment Status">
              <StatusPill status={request.paymentDetails.paymentStatus} />
            </DetailRow>
            <DetailRow label="Payment Message">{request.paymentDetails.paymentMessage}</DetailRow>
            <DetailRow label="Initiated At">{request.paymentDetails.initiatedAt}</DetailRow>
            <DetailRow label="Completed At">{request.paymentDetails.completedAt}</DetailRow>
          </>
        ) : (
          <p className="text-[13px] text-slate-400">No payment has been initiated for this request.</p>
        )}
      </AccordionSection>

      <AccordionSection
        title="Request Information"
        open={openSections.information}
        onToggle={() => toggle("information")}
      >
        <DetailRow label="Request Number">{request.requestNumber}</DetailRow>
        <DetailRow label="Request Type">{request.requestType}</DetailRow>
        <DetailRow label="Status">
          <StatusPill status={request.status} />
        </DetailRow>
        <DetailRow label="Amount">{formatApprovalAmount(request.amount)}</DetailRow>
        <DetailRow label="Requester">{request.requester}</DetailRow>
        <DetailRow label="Cost Center">{request.costCenter}</DetailRow>
        <DetailRow label="Purpose">{request.purpose || "—"}</DetailRow>
        {request.spendingDetails ? (
          <>
            <DetailRow label="Expense Category">
              {request.spendingDetails.expenseCategory || "—"}
            </DetailRow>
            <DetailRow label="Funding Request">
              {request.spendingDetails.fundingRequest || "—"}
            </DetailRow>
            <DetailRow label="Payee">{request.spendingDetails.payee || "—"}</DetailRow>
            <DetailRow label="Payee Account">
              {request.spendingDetails.payeeAccount || "—"}
            </DetailRow>
          </>
        ) : null}
        {request.storesDetails ? (
          <>
            <DetailRow label="Item">{request.storesDetails.itemName || "—"}</DetailRow>
            <DetailRow label="Item code">{request.storesDetails.itemCode || "—"}</DetailRow>
            <DetailRow label="Quantity">{request.storesDetails.quantity ?? "—"}</DetailRow>
            {request.storesDetails.fromStore ? (
              <DetailRow label="From store">{request.storesDetails.fromStore}</DetailRow>
            ) : null}
            {request.storesDetails.toStore ? (
              <DetailRow label="To store">{request.storesDetails.toStore}</DetailRow>
            ) : null}
          </>
        ) : null}
      </AccordionSection>

      <AccordionSection
        title="Approval History"
        open={openSections.history}
        onToggle={() => toggle("history")}
      >
        <div className="space-y-2">
          {(request.approvalHistory || []).flatMap((entry, index) =>
            (entry.approvers || []).map((approver) => (
              <ApproverRow
                key={`${entry.status || "decision"}-${approver.name}-${index}`}
                approver={approver}
              />
            )),
          )}
        </div>
      </AccordionSection>
    </RequestDetailsModal>
  );
}
