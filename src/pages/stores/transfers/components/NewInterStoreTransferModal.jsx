import React, { useEffect, useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import AddModal from "../../../../components/common/AddModal";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import { ConfiguredCustomFields } from "../../../../components/common/ConfiguredFormSections";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import { useFormTreeSections } from "../../../../hooks/useFormTreeSections";
import {
  NEW_INTER_STORE_TRANSFER_FORM_FIELD_CATALOG,
  NEW_INTER_STORE_TRANSFER_FORM_SETUP_CHANGED_EVENT,
  getActiveNewInterStoreTransferFormSections,
  getNewInterStoreTransferFormSetup,
} from "../../../../mockdata/setups";
import {
  getInterStoreFromStoreOptions,
  getInterStoreItemsInStore,
  getInterStoreStockLocations,
} from "../../../../mockdata/stores";
import ReceiverPicker from "../../supplies/components/ReceiverPicker";
import IssueOtpSection from "../../supplies/components/IssueOtpSection";
import AddReceiverModal from "../../supplies/components/AddReceiverModal";

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 transition-colors text-slate-700";

const thClass =
  "px-3 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-left";

function lineKey(item) {
  return `${item.itemType}:${item.itemId || item.itemCode}`;
}

export default function NewInterStoreTransferModal({
  isOpen,
  onClose,
  onSave,
}) {
  const [fromStore, setFromStore] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [lines, setLines] = useState([]);
  const [notes, setNotes] = useState("");
  const [customValues, setCustomValues] = useState({});
  const [errors, setErrors] = useState({});
  const { sections, visibleKeys } = useFormTreeSections(
    NEW_INTER_STORE_TRANSFER_FORM_SETUP_CHANGED_EVENT,
    getNewInterStoreTransferFormSetup,
    getActiveNewInterStoreTransferFormSections,
  );
  const systemKeys = new Set(NEW_INTER_STORE_TRANSFER_FORM_FIELD_CATALOG.map((field) => field.key));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [dispatcher, setDispatcher] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [addDispatcherOpen, setAddDispatcherOpen] = useState(false);

  const fromStoreOptions = useMemo(() => getInterStoreFromStoreOptions(), [isOpen]);
  const storeOptions = useMemo(() => getInterStoreStockLocations(), [isOpen]);
  const stockItems = useMemo(
    () => getInterStoreItemsInStore(fromStore),
    [fromStore, isOpen],
  );

  useEffect(() => {
    if (!isOpen) return;
    setFromStore("");
    setSearchQuery("");
    setLines([]);
    setNotes("");
    setCustomValues({});
    setErrors({});
    setConfirmOpen(false);
    setPendingPayload(null);
    setDispatcher("");
    setOtpSent(false);
    setOtp("");
    setOtpVerified(false);
    setAddDispatcherOpen(false);
  }, [isOpen]);

  const selectedKeys = useMemo(
    () => new Set(lines.map((line) => lineKey(line))),
    [lines],
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return stockItems;
    return stockItems.filter((item) =>
      [item.itemCode, item.itemName, item.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [stockItems, searchQuery]);

  const destinationOptions = useMemo(
    () => storeOptions.filter((store) => store !== fromStore),
    [storeOptions, fromStore],
  );

  const handleFromStoreChange = (value) => {
    setFromStore(value);
    setLines([]);
    setSearchQuery("");
    setErrors((prev) => {
      if (!prev.fromStore && !prev.lines) return prev;
      const next = { ...prev };
      delete next.fromStore;
      delete next.lines;
      return next;
    });
  };

  const toggleItem = (item) => {
    const key = lineKey(item);
    setLines((current) => {
      if (current.some((line) => lineKey(line) === key)) {
        return current.filter((line) => lineKey(line) !== key);
      }
      return [
        ...current,
        {
          itemId: item.itemId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          itemType: item.itemType,
          description: item.description,
          stockQuantity: item.stockQuantity,
          movingQuantity: "1",
          toStore: "",
          supplier: item.supplier || "—",
        },
      ];
    });
    setErrors((prev) => {
      if (!prev.lines) return prev;
      const next = { ...prev };
      delete next.lines;
      return next;
    });
  };

  const updateLine = (key, patch) => {
    setLines((current) =>
      current.map((line) => (lineKey(line) === key ? { ...line, ...patch } : line)),
    );
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSave = () => {
    const nextErrors = {};
    if (!fromStore) nextErrors.fromStore = "Select the sending store first.";
    if (!lines.length) nextErrors.lines = "Select at least one item from this store.";
    if (!dispatcher.trim()) nextErrors.dispatcher = "Select the person dispatching.";
    else if (!otpVerified) nextErrors.dispatcher = "Verify the OTP sent to the dispatcher first.";

    lines.forEach((line) => {
      const key = lineKey(line);
      const moving = Number(line.movingQuantity);
      const rowErrors = {};
      if (!line.toStore) rowErrors.toStore = "Select a store.";
      if (line.toStore && line.toStore === fromStore) {
        rowErrors.toStore = "Must differ from the sending store.";
      }
      if (!line.movingQuantity || Number.isNaN(moving) || moving <= 0) {
        rowErrors.movingQuantity = "Enter a quantity.";
      } else if (moving > Number(line.stockQuantity)) {
        rowErrors.movingQuantity = `Max ${line.stockQuantity}.`;
      }
      if (Object.keys(rowErrors).length) nextErrors[key] = rowErrors;
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Complete the transfer lines and dispatcher OTP before requesting approval.");
      return;
    }

    setPendingPayload({
      fromStore,
      notes: notes.trim(),
      dispatcher: dispatcher.trim(),
      lines: lines.map((line) => ({
        ...line,
        movingQuantity: Number(line.movingQuantity),
      })),
    });
    setConfirmOpen(true);
  };

  const handleSendOtp = () => {
    if (!dispatcher.trim()) {
      setErrors((prev) => ({ ...prev, dispatcher: "Select the person dispatching first." }));
      toast.warning("Select the person dispatching first.");
      return;
    }
    setOtpSent(true);
    toast.info(`OTP sent to ${dispatcher.trim()}.`);
  };

  const finalizeSave = () => {
    if (!pendingPayload) return;
    onSave?.(pendingPayload);
    setPendingPayload(null);
    setConfirmOpen(false);
  };

  return (
    <>
      <AddModal
        isOpen={isOpen && !confirmOpen && !addDispatcherOpen}
        onClose={onClose}
        onSave={handleSave}
        title="New inter-store transfer"
        subtitle="Choose the sending store, select items, confirm the dispatcher with OTP, then request approval."
        dialogClassName="max-w-5xl"
        saveLabel="Request approval"
        saveDisabled={!otpVerified}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="transferFromStore" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              From store
            </label>
            <select
              id="transferFromStore"
              value={fromStore}
              onChange={(e) => handleFromStoreChange(e.target.value)}
              className={cn(fieldClassName, errors.fromStore && "border-rose-400 bg-rose-50")}
            >
              <option value="">Select sending store</option>
              {fromStoreOptions.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
            {errors.fromStore ? (
              <p className="text-[10px] text-rose-600">{errors.fromStore}</p>
            ) : (
              <p className="text-[11px] text-slate-400">
                Items appear after a sending store is selected.
              </p>
            )}
          </div>

          {fromStore ? (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Items in this store
              </p>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by code or description…"
                  className={cn(fieldClassName, "pl-8")}
                />
              </div>
              <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-50">
                {filteredItems.length === 0 ? (
                  <p className="px-3 py-4 text-[12px] text-slate-400">
                    No stocked items in this store.
                  </p>
                ) : (
                  filteredItems.map((item) => {
                    const selected = selectedKeys.has(lineKey(item));
                    return (
                      <label
                        key={lineKey(item)}
                        className={cn(
                          "flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors",
                          selected ? "bg-slate-50" : "hover:bg-slate-50",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleItem(item)}
                          className="mt-1 rounded border-slate-300 text-primary focus:ring-slate-900/25"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-[12px] font-mono font-bold text-slate-800">
                              {item.itemCode}
                            </span>
                            <span className="text-[12px] font-semibold text-slate-700">
                              {item.itemName}
                            </span>
                          </span>
                          <span className="block text-[11px] text-slate-500 mt-0.5">
                            {item.description}
                            {` · Stock ${item.stockQuantity}`}
                          </span>
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
              {errors.lines ? (
                <p className="text-[10px] text-rose-600">{errors.lines}</p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Transfer lines
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left min-w-[860px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className={thClass}>Item code</th>
                    <th className={thClass}>Description</th>
                    <th className={thClass}>Stock qty</th>
                    <th className={thClass}>Moving qty</th>
                    <th className={thClass}>Select store</th>
                    <th className={cn(thClass, "text-right w-10")} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-[12px] text-slate-400">
                        {fromStore
                          ? "Select items above to add them here."
                          : "Select a sending store to start."}
                      </td>
                    </tr>
                  ) : (
                    lines.map((line) => {
                      const key = lineKey(line);
                      const rowErrors = errors[key] || {};
                      return (
                        <tr key={key} className="align-top">
                          <td className="px-3 py-2.5 text-[12px] font-mono font-bold text-slate-800 whitespace-nowrap">
                            {line.itemCode}
                          </td>
                          <td className="px-3 py-2.5 text-[12px] text-slate-700 min-w-[160px]">
                            {line.description || "—"}
                          </td>
                          <td className="px-3 py-2.5 text-[12px] font-semibold text-slate-800 whitespace-nowrap">
                            {line.stockQuantity}
                          </td>
                          <td className="px-3 py-2.5 w-28">
                            <input
                              type="number"
                              min="1"
                              max={line.stockQuantity}
                              value={line.movingQuantity}
                              onChange={(e) => updateLine(key, { movingQuantity: e.target.value })}
                              className={cn(
                                fieldClassName,
                                "bg-white py-1.5",
                                rowErrors.movingQuantity && "border-rose-400 bg-rose-50",
                              )}
                            />
                            {rowErrors.movingQuantity ? (
                              <p className="text-[10px] text-rose-600 mt-1">{rowErrors.movingQuantity}</p>
                            ) : null}
                          </td>
                          <td className="px-3 py-2.5 min-w-[220px]">
                            <select
                              value={line.toStore}
                              onChange={(e) => updateLine(key, { toStore: e.target.value })}
                              className={cn(
                                fieldClassName,
                                "bg-white py-1.5",
                                rowErrors.toStore && "border-rose-400 bg-rose-50",
                              )}
                            >
                              <option value="">Select store</option>
                              {destinationOptions.map((store) => (
                                <option key={store} value={store}>
                                  {store}
                                </option>
                              ))}
                            </select>
                            {rowErrors.toStore ? (
                              <p className="text-[10px] text-rose-600 mt-1">{rowErrors.toStore}</p>
                            ) : null}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => toggleItem(line)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md"
                              title="Remove line"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {visibleKeys.has("notes") ? (
          <div className="space-y-1.5">
            <label htmlFor="transferNotes" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Reason / notes
            </label>
            <textarea
              id="transferNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Why is this stock moving between stores?"
              className={cn(fieldClassName, "resize-none")}
            />
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
            idPrefix="ist"
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <ReceiverPicker
              id="transfer-dispatcher-search"
              label="Person dispatching"
              placeholder="Select dispatcher"
              addButtonLabel="Add dispatcher"
              value={dispatcher}
              onChange={(value) => {
                setDispatcher(value);
                setOtpSent(false);
                setOtp("");
                setOtpVerified(false);
                setErrors((prev) => {
                  if (!prev.dispatcher) return prev;
                  const next = { ...prev };
                  delete next.dispatcher;
                  return next;
                });
              }}
              error={errors.dispatcher}
              selectClassName={fieldClassName}
              onAddClick={() => setAddDispatcherOpen(true)}
            />
            <IssueOtpSection
              suppliedTo={dispatcher}
              otpSent={otpSent}
              otp={otp}
              otpVerified={otpVerified}
              onSendOtp={handleSendOtp}
              onOtpChange={(value) => {
                setOtp(value);
                setOtpVerified(false);
              }}
              onVerifiedChange={setOtpVerified}
            />
            {!otpVerified ? (
              <p className="text-[11px] text-amber-700">
                Request approval stays disabled until the dispatcher confirms the OTP.
              </p>
            ) : null}
          </div>
        </div>
      </AddModal>


      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={finalizeSave}
        title="Send for approval?"
        message={
          pendingPayload
            ? `Request transfer of ${pendingPayload.lines.length} item${pendingPayload.lines.length === 1 ? "" : "s"} from ${pendingPayload.fromStore} (dispatcher: ${pendingPayload.dispatcher})? This goes to the approval queue first.`
            : "Request this inter-store transfer?"
        }
        confirmText="Request approval"
      />

      <AddReceiverModal
        isOpen={addDispatcherOpen}
        onClose={() => setAddDispatcherOpen(false)}
        title="Add dispatcher"
        saveLabel="Add dispatcher"
        subtitle="Create a dispatcher with name, email, phone, and role. They can dispatch this transfer immediately."
        onCreated={(created) => {
          setDispatcher(created.name);
          setOtpSent(false);
          setOtp("");
          setOtpVerified(false);
          setErrors((prev) => {
            if (!prev.dispatcher) return prev;
            const next = { ...prev };
            delete next.dispatcher;
            return next;
          });
        }}
      />
    </>
  );
}
