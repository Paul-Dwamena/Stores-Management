import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import Button from "../../../../components/common/base/Button";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import RequestDetailsModal, {
  AccordionSection,
  DetailRow,
} from "../../../../components/common/details/RequestDetailsModal";
import { formatApiDate, formatApiDateTime } from "../../../../utils/apiResponseHelpers";

function lineKey(line, index) {
  return `${line.itemId || line.itemCode || "item"}:${index}`;
}

function ReceiveLineDetailsModal({ isOpen, onClose, transfer, line }) {
  const [openSection, setOpenSection] = useState("item");

  useEffect(() => {
    if (isOpen) setOpenSection("item");
  }, [isOpen]);

  if (!transfer || !line) return null;

  const toggle = (id) => setOpenSection((current) => (current === id ? "" : id));

  return (
    <RequestDetailsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Item details"
      subtitle="Transfer line"
      identifier={`${transfer.transferNumber} · ${line.itemCode}`}
      className="!z-[10004]"
      dialogClassName="max-w-4xl"
    >
      <AccordionSection
        title="Item"
        open={openSection === "item"}
        onToggle={() => toggle("item")}
      >
        <DetailRow label="Item code">{line.itemCode || "—"}</DetailRow>
        <DetailRow label="Name">{line.itemName || "—"}</DetailRow>
        <DetailRow label="Description">{line.description || "—"}</DetailRow>
        <DetailRow label="Qty requested">
          {line.quantityRequested ?? line.movingQuantity ?? "—"}
        </DetailRow>
        <DetailRow label="Qty approved">{line.quantityApproved ?? "—"}</DetailRow>
      </AccordionSection>

      <AccordionSection
        title="Stores & dates"
        open={openSection === "stores"}
        onToggle={() => toggle("stores")}
      >
        <DetailRow label="Supplying store">{transfer.fromStore || "—"}</DetailRow>
        <DetailRow label="Destination store">{line.toStore || transfer.toStore || "—"}</DetailRow>
        <DetailRow label="Date requested">
          {formatApiDateTime(line.requestedAt || transfer.createdAt)}
        </DetailRow>
        <DetailRow label="Date approved">
          {formatApiDateTime(line.approvedAt || transfer.approvedAt)}
        </DetailRow>
      </AccordionSection>

      <AccordionSection
        title="People"
        open={openSection === "people"}
        onToggle={() => toggle("people")}
      >
        <DetailRow label="Transfer person">{transfer.requestedBy || "—"}</DetailRow>
        <DetailRow label="Dispatcher">{transfer.dispatcher || "—"}</DetailRow>
      </AccordionSection>
    </RequestDetailsModal>
  );
}

export default function ReceiveTransferToStoreModal({
  isOpen,
  onClose,
  onConfirm,
  transfer,
  saving = false,
}) {
  const [detailLine, setDetailLine] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setDetailLine(null);
      setConfirmOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !transfer) return null;

  const lines = transfer.lines || [];

  return (
    <>
      {ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 animate-in fade-in duration-200"
            style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            onClick={() => !saving && onClose()}
          />
          <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 m-0 sm:m-4 max-h-[90vh] flex flex-col min-h-0">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Receive to store</h2>
                <p className="text-[12px] text-slate-500 font-medium mt-1">
                  {transfer.transferNumber} · {transfer.fromStore}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-6">
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full text-left min-w-[1100px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Item code</th>
                      <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Name</th>
                      <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Description</th>
                      <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Qty requested</th>
                      <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Qty approved</th>
                      <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Supplying store</th>
                      <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Date requested</th>
                      <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Date approved</th>
                      <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 text-right">More</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {lines.map((line, index) => (
                      <tr key={lineKey(line, index)} className="align-top">
                        <td className="px-3 py-2.5 text-[12px] font-mono font-bold text-slate-800 whitespace-nowrap">
                          {line.itemCode}
                        </td>
                        <td className="px-3 py-2.5 text-[12px] font-semibold text-slate-800">
                          {line.itemName}
                        </td>
                        <td className="px-3 py-2.5 text-[12px] text-slate-700">
                          {line.description || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-[12px] font-semibold text-slate-800 whitespace-nowrap">
                          {line.quantityRequested ?? line.movingQuantity ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-[12px] font-semibold text-slate-800 whitespace-nowrap">
                          {line.quantityApproved ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-[12px] text-slate-700">
                          {transfer.fromStore}
                        </td>
                        <td className="px-3 py-2.5 text-[12px] text-slate-600 whitespace-nowrap">
                          {formatApiDate(line.requestedAt || transfer.createdAt)}
                        </td>
                        <td className="px-3 py-2.5 text-[12px] text-slate-600 whitespace-nowrap">
                          {formatApiDate(line.approvedAt || transfer.approvedAt)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => setDetailLine(line)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                          >
                            More
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-slate-100">
              <Button variant="ghost" className="border border-slate-200" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={() => setConfirmOpen(true)} disabled={saving}>
                Receive to store
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      <ReceiveLineDetailsModal
        isOpen={Boolean(detailLine)}
        onClose={() => setDetailLine(null)}
        transfer={transfer}
        line={detailLine}
      />

      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => !saving && setConfirmOpen(false)}
        onConfirm={onConfirm}
        className="!z-[10003]"
        title="Receive these items?"
        message={`Book ${transfer.transferNumber} into the destination store${lines.length > 1 ? "s" : ""}?`}
        confirmText="Receive to store"
        confirmLoading={saving}
        closeOnConfirm={false}
      />
    </>
  );
}
