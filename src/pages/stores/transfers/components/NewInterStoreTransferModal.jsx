import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import AddModal from "../../../../components/common/AddModal";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import SectionLoadState from "../../../../components/common/SectionLoadState";
import { ConfiguredCustomFields } from "../../../../components/common/ConfiguredFormSections";
import { requiredFieldLabel } from "../../../../components/common/fields/requiredFieldLabel";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import { useFormTreeSections } from "../../../../hooks/useFormTreeSections";
import {
  NEW_INTER_STORE_TRANSFER_FORM_FIELD_CATALOG,
  NEW_INTER_STORE_TRANSFER_FORM_SETUP_CHANGED_EVENT,
  getActiveNewInterStoreTransferFormSections,
  getNewInterStoreTransferFormSetup,
} from "../../../../mockdata/setups";
import { listStores } from "../../../../services/storesService";
import { listInventoryItems } from "../../../../services/inventoryService";
import { listUsers } from "../../../../services/usersService";
import { listRoles, findDispatcherRole } from "../../../../services/rolesService";
import { sendDispatcherConfirmationOtp } from "../../../../services/transfersService";
import { ItemPhotoThumb } from "../../inventory/components/ItemPhotoField";
import DispatcherPicker from "./DispatcherPicker";
import DispatcherOtpSection from "./DispatcherOtpSection";
import AddDispatcherModal from "./AddDispatcherModal";

const fieldClassName =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 transition-colors text-slate-700";

const thClass =
  "px-3 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-left";

function lineKey(item) {
  return String(item.itemId || item.itemCode);
}

export default function NewInterStoreTransferModal({
  isOpen,
  onClose,
  onSave,
  saving = false,
}) {
  const [stores, setStores] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [dispatchers, setDispatchers] = useState([]);
  const [dispatcherRoleId, setDispatcherRoleId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [fromStoreId, setFromStoreId] = useState("");
  const [toStoreId, setToStoreId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [lines, setLines] = useState([]);
  const [notes, setNotes] = useState("");
  const [dispatcherId, setDispatcherId] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [addDispatcherOpen, setAddDispatcherOpen] = useState(false);
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

  const loadFormData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [storeRows, inventoryRows, userRows, roleRows] = await Promise.all([
        listStores(),
        listInventoryItems(),
        listUsers(),
        listRoles(),
      ]);
      const dispatcherRole = findDispatcherRole(roleRows);
      setDispatcherRoleId(dispatcherRole?.id ?? null);
      setStores(storeRows.filter((store) => store.isActive !== false));
      setInventory(inventoryRows.filter((item) => item.isActive !== false));
      setDispatchers(
        userRows
          .filter((user) => user.isActive !== false)
          .map((user) => ({
            id: user.id,
            name: user.name,
            phone: user.phone || "",
            email: user.email || "",
            firstName: user.firstName,
            lastName: user.lastName,
          })),
      );
    } catch (err) {
      setLoadError(err.message || "Unable to load stores and inventory.");
      setStores([]);
      setInventory([]);
      setDispatchers([]);
      setDispatcherRoleId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const ensureDispatcherRoleId = useCallback(async () => {
    const roles = await listRoles();
    const dispatcherRole = findDispatcherRole(roles);
    if (!dispatcherRole) {
      const names = roles.map((role) => role.name || role.label).filter(Boolean).join(", ");
      throw new Error(
        names
          ? `No Dispatcher role found among: ${names}. Create a role named Dispatcher in Setups first.`
          : "No Dispatcher role found. Create a role named Dispatcher in Setups first.",
      );
    }
    setDispatcherRoleId(dispatcherRole.id);
    return dispatcherRole.id;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    loadFormData();
  }, [isOpen, loadFormData]);

  useEffect(() => {
    if (!isOpen) return;
    setFromStoreId("");
    setToStoreId("");
    setSearchQuery("");
    setLines([]);
    setNotes("");
    setDispatcherId("");
    setOtpSent(false);
    setOtp("");
    setOtpVerified(false);
    setOtpSending(false);
    setAddDispatcherOpen(false);
    setCustomValues({});
    setErrors({});
    setLoadError(null);
    setConfirmOpen(false);
    setPendingPayload(null);
  }, [isOpen]);

  const fromStoreOptions = useMemo(() => {
    const storeIdsWithStock = new Set();
    inventory.forEach((item) => {
      (item.stores || []).forEach((storeStock) => {
        if (Number(storeStock.quantity) > 0) {
          storeIdsWithStock.add(storeStock.id);
        }
      });
    });
    return stores.filter((store) => storeIdsWithStock.has(store.id));
  }, [stores, inventory]);

  const stockItems = useMemo(() => {
    const fromId = Number(fromStoreId);
    if (!fromId) return [];
    return inventory.flatMap((item) => {
      const storeStock = (item.stores || []).find((store) => store.id === fromId);
      const stockQuantity = Number(storeStock?.quantity) || 0;
      if (stockQuantity <= 0) return [];
      return [{
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.name,
        photo: item.photo || "",
        stockQuantity,
      }];
    });
  }, [fromStoreId, inventory]);

  const selectedKeys = useMemo(
    () => new Set(lines.map((line) => lineKey(line))),
    [lines],
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return stockItems;
    return stockItems.filter((item) =>
      [item.itemCode, item.itemName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [stockItems, searchQuery]);

  const destinationOptions = useMemo(
    () => stores.filter((store) => String(store.id) !== String(fromStoreId)),
    [stores, fromStoreId],
  );

  const fromStoreName = stores.find((store) => String(store.id) === String(fromStoreId))?.name || "";
  const toStoreName = stores.find((store) => String(store.id) === String(toStoreId))?.name || "";
  const dispatcherName =
    dispatchers.find((person) => String(person.id) === String(dispatcherId))?.name || "";
  const selectedDispatcher = useMemo(
    () => dispatchers.find((person) => String(person.id) === String(dispatcherId)) || null,
    [dispatchers, dispatcherId],
  );

  const resetDispatcherOtp = () => {
    setOtpSent(false);
    setOtp("");
    setOtpVerified(false);
  };

  const handleSendOtp = async () => {
    if (!dispatcherId) {
      setErrors((prev) => ({ ...prev, dispatcher: "Select the person dispatching first." }));
      toast.warning("Select the person dispatching first.");
      return;
    }
    if (!selectedDispatcher?.phone?.trim()) {
      toast.warning("The selected dispatcher needs a phone number before an OTP can be sent.");
      return;
    }
    setOtpSending(true);
    try {
      await sendDispatcherConfirmationOtp(selectedDispatcher.phone.trim());
      setOtpSent(true);
      setOtp("");
      setOtpVerified(false);
      toast.success(`OTP sent to ${dispatcherName || selectedDispatcher.name} on ${selectedDispatcher.phone.trim()}.`);
    } catch (error) {
      toast.error(error.message ?? "Could not send OTP.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleFromStoreChange = (value) => {
    setFromStoreId(value);
    if (String(toStoreId) === String(value)) {
      setToStoreId("");
    }
    setLines([]);
    setSearchQuery("");
    setErrors((prev) => {
      if (!prev.fromStore && !prev.toStore && !prev.lines) return prev;
      const next = { ...prev };
      delete next.fromStore;
      delete next.toStore;
      delete next.lines;
      return next;
    });
  };

  const handleToStoreChange = (value) => {
    setToStoreId(value);
    setErrors((prev) => {
      if (!prev.toStore) return prev;
      const next = { ...prev };
      delete next.toStore;
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
          photo: item.photo || "",
          stockQuantity: item.stockQuantity,
          movingQuantity: "1",
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
    if (!fromStoreId) nextErrors.fromStore = "Select the sending store first.";
    if (!toStoreId) nextErrors.toStore = "Select the receiving store.";
    else if (String(toStoreId) === String(fromStoreId)) {
      nextErrors.toStore = "Must differ from the sending store.";
    }
    if (!lines.length) nextErrors.lines = "Select at least one item from this store.";
    if (!dispatcherId) nextErrors.dispatcher = "Select the person dispatching.";
    else if (!otpVerified) nextErrors.dispatcher = "Verify the OTP sent to the dispatcher first.";

    lines.forEach((line) => {
      const key = lineKey(line);
      const moving = Number(line.movingQuantity);
      const rowErrors = {};
      if (!line.movingQuantity || Number.isNaN(moving) || moving <= 0) {
        rowErrors.movingQuantity = "Enter a quantity.";
      } else if (moving > Number(line.stockQuantity)) {
        rowErrors.movingQuantity = `Max ${line.stockQuantity}.`;
      }
      if (Object.keys(rowErrors).length) nextErrors[key] = rowErrors;
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Complete the transfer lines, dispatcher, and OTP before requesting approval.");
      return;
    }

    setPendingPayload({
      fromStoreId: Number(fromStoreId),
      toStoreId: Number(toStoreId),
      dispatcherId: Number(dispatcherId),
      notes: notes.trim(),
      lines: lines.map((line) => ({
        ...line,
        toStoreId: Number(toStoreId),
        movingQuantity: Number(line.movingQuantity),
      })),
    });
    setConfirmOpen(true);
  };

  const finalizeSave = async () => {
    if (!pendingPayload || saving) return;
    await onSave?.(pendingPayload);
    if (!saving) {
      setPendingPayload(null);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <AddModal
        isOpen={isOpen && !confirmOpen && !addDispatcherOpen}
        onClose={onClose}
        onSave={handleSave}
        title="New inter-store transfer"
        subtitle="Choose the sending and receiving stores, select items, confirm the dispatcher with OTP, then request approval."
        dialogClassName="max-w-5xl"
        saveLabel="Request approval"
        saveDisabled={loading || saving || Boolean(loadError) || !otpVerified}
      >
        <SectionLoadState
          loading={loading}
          error={loadError}
          onRetry={loadFormData}
          loadingLabel="Loading stores and inventory…"
          errorTitle="Couldn't load transfer form data"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="transferFromStore" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {requiredFieldLabel("From store", true)}
                </label>
                <select
                  id="transferFromStore"
                  value={fromStoreId}
                  onChange={(e) => handleFromStoreChange(e.target.value)}
                  className={cn(fieldClassName, errors.fromStore && "border-rose-400 bg-rose-50")}
                >
                  <option value="">Select sending store</option>
                  {fromStoreOptions.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                {errors.fromStore ? (
                  <p className="text-[10px] text-rose-600">{errors.fromStore}</p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Only stores with on-hand stock are listed.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="transferToStore" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {requiredFieldLabel("To store", true)}
                </label>
                <select
                  id="transferToStore"
                  value={toStoreId}
                  onChange={(e) => handleToStoreChange(e.target.value)}
                  disabled={!fromStoreId}
                  className={cn(
                    fieldClassName,
                    errors.toStore && "border-rose-400 bg-rose-50",
                    !fromStoreId && "opacity-60 cursor-not-allowed",
                  )}
                >
                  <option value="">Select receiving store</option>
                  {destinationOptions.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                {errors.toStore ? (
                  <p className="text-[10px] text-rose-600">{errors.toStore}</p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    {fromStoreId ? "All lines will go to this store." : "Select a sending store first."}
                  </p>
                )}
              </div>
            </div>

            {fromStoreId ? (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {requiredFieldLabel("Items in this store", true)}
                </p>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by code or name…"
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
                            "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors",
                            selected ? "bg-slate-50" : "hover:bg-slate-50",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleItem(item)}
                            className="rounded border-slate-300 text-primary focus:ring-slate-900/25 shrink-0"
                          />
                          <ItemPhotoThumb
                            src={item.photo}
                            name={item.itemName}
                            className="h-9 w-9"
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
                              {`Stock ${item.stockQuantity}`}
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
                {requiredFieldLabel("Transfer lines", true)}
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left min-w-[680px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className={thClass}>Photo</th>
                      <th className={thClass}>Item code</th>
                      <th className={thClass}>Name</th>
                      <th className={thClass}>Stock qty</th>
                      <th className={thClass}>{requiredFieldLabel("Moving qty", true)}</th>
                      <th className={cn(thClass, "text-right w-10")} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {lines.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-[12px] text-slate-400">
                          {fromStoreId
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
                            <td className="px-3 py-2.5">
                              <ItemPhotoThumb
                                src={line.photo}
                                name={line.itemName}
                                className="h-9 w-9"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-[12px] font-mono font-bold text-slate-800 whitespace-nowrap">
                              {line.itemCode}
                            </td>
                            <td className="px-3 py-2.5 text-[12px] font-semibold text-slate-800 min-w-[140px]">
                              {line.itemName || "—"}
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

            <DispatcherPicker
              id="transfer-dispatcher-search"
              value={dispatcherId}
              items={dispatchers}
              onChange={(value) => {
                setDispatcherId(value);
                resetDispatcherOtp();
                setErrors((prev) => {
                  if (!prev.dispatcher) return prev;
                  const next = { ...prev };
                  delete next.dispatcher;
                  return next;
                });
              }}
              error={errors.dispatcher}
              onAddClick={() => setAddDispatcherOpen(true)}
            />
            <DispatcherOtpSection
              dispatcherId={dispatcherId}
              dispatchers={dispatchers}
              otpSent={otpSent}
              otp={otp}
              otpVerified={otpVerified}
              onSendOtp={handleSendOtp}
              sendLoading={otpSending}
              sendDisabled={!dispatcherId || !selectedDispatcher?.phone?.trim()}
              onOtpChange={(value) => {
                setOtp(value);
                setOtpVerified(false);
              }}
              onVerifiedChange={setOtpVerified}
              itemCount={lines.length || undefined}
            />
            {!otpVerified && !errors.dispatcher ? (
              <p className="text-[11px] text-amber-700">
                Request approval stays disabled until the dispatcher confirms the OTP.
              </p>
            ) : null}
          </div>
        </SectionLoadState>
      </AddModal>

      <AddDispatcherModal
        isOpen={addDispatcherOpen}
        onClose={() => setAddDispatcherOpen(false)}
        dispatcherRoleId={dispatcherRoleId}
        onEnsureDispatcherRole={ensureDispatcherRoleId}
        onCreated={(created) => {
          setDispatchers((current) => {
            if (current.some((person) => String(person.id) === String(created.id))) {
              return current;
            }
            return [
              ...current,
              {
                id: created.id,
                name: created.name,
                phone: created.phone || "",
                email: created.email || "",
              },
            ];
          });
          setDispatcherId(String(created.id));
          resetDispatcherOtp();
          setErrors((prev) => {
            if (!prev.dispatcher) return prev;
            const next = { ...prev };
            delete next.dispatcher;
            return next;
          });
        }}
      />

      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => !saving && setConfirmOpen(false)}
        onConfirm={finalizeSave}
        title="Send for approval?"
        message={
          pendingPayload
            ? `Request transfer of ${pendingPayload.lines.length} item${pendingPayload.lines.length === 1 ? "" : "s"} from ${fromStoreName}${toStoreName ? ` to ${toStoreName}` : ""}${dispatcherName ? ` (dispatcher: ${dispatcherName})` : ""}? This goes to the approval queue first.`
            : "Request this inter-store transfer?"
        }
        confirmText="Request approval"
        confirmLoading={saving}
        closeOnConfirm={false}
      />
    </>
  );
}
