import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { ChevronDown, Plus, X } from "lucide-react";
import Button from "../../../../components/common/base/Button";
import AddModal from "../../../../components/common/AddModal";
import SectionLoadState from "../../../../components/common/SectionLoadState";
import { TableViewAction } from "../../../../components/common/tableActions";
import { cn } from "../../../../utils/cn";
import {
  formatInventoryMoney,
  formatInventoryStatus,
} from "../../../../services/inventoryService";
import { formatApiDateTime } from "../../../../utils/apiResponseHelpers";
import { SupplyStatusBadge } from "../../supplies/utils/SupplyStatusBadge";
import ReceiveIntoStoreModal from "./ReceiveIntoStoreModal";
import EditInventoryItemModal from "./EditInventoryItemModal";
import { ItemPhotoThumb } from "./ItemPhotoField";

function StatusPill({ status }) {
  const raw = (status ?? "").toString().toUpperCase();
  const tone =
    raw === "IN_STOCK" || raw === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : raw === "LOW_STOCK"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : raw === "OUT_OF_STOCK"
          ? "bg-rose-50 text-rose-700 border-rose-200"
          : raw === "INACTIVE"
            ? "bg-slate-50 text-slate-600 border-slate-200"
            : "bg-slate-50 text-slate-500 border-slate-200";

  return (
    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border", tone)}>
      {formatInventoryStatus(status)}
    </span>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 py-2 border-b border-slate-50 last:border-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="text-[13px] text-slate-700 font-medium">{children}</div>
    </div>
  );
}

function formatCondition(value) {
  if (!value) return "—";
  return value
    .toString()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function cellValue(value) {
  if (value == null || value === "") return "—";
  return value;
}

function AccordionSection({ title, open, onToggle, action, children }) {
  return (
    <div className="border border-slate-200 rounded-md overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/80">
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 flex items-center gap-2 text-left hover:bg-slate-50"
        >
          <ChevronDown
            size={16}
            className={cn(
              "shrink-0 text-slate-400 transition-transform",
              open ? "rotate-0" : "-rotate-90",
            )}
          />
          <span className="text-[13px] font-bold text-slate-800">{title}</span>
        </button>
        {action}
      </div>
      {open && <div className="p-4 bg-white">{children}</div>}
    </div>
  );
}

function MiniTable({
  columns,
  rows,
  emptyLabel,
  onView,
  loading = false,
  error = null,
  onRetry,
  loadingLabel = "Loading…",
  errorTitle = "Couldn’t load this table",
}) {
  const tableMinWidth = Math.max(
    960,
    columns.reduce((sum, column) => sum + (column.minWidth ?? 120), 0) + 140,
  );
  const colSpan = columns.length + 1;
  const showBodyState = loading || Boolean(error);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-100 -mx-1">
      <table
        className="w-full text-left"
        style={{ minWidth: `${tableMinWidth}px` }}
      >
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-100">
            {columns.map((column) => (
              <th
                key={column.key}
                style={{ width: column.minWidth ?? 120, minWidth: column.minWidth ?? 120 }}
                className="px-4 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
              >
                {column.label}
              </th>
            ))}
            <th className="px-4 py-2.5 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {showBodyState ? (
            <tr>
              <td colSpan={colSpan} className="px-4 py-2">
                <SectionLoadState
                  loading={loading}
                  error={error}
                  onRetry={onRetry}
                  loadingLabel={loadingLabel}
                  errorTitle={errorTitle}
                />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={colSpan}
                className="px-4 py-8 text-center text-[12px] text-slate-400"
              >
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/50">
                {columns.map((column) => (
                  <td
                    key={`${row.id}-${column.key}`}
                    style={{ width: column.minWidth ?? 120, minWidth: column.minWidth ?? 120 }}
                    className={cn(
                      "px-4 py-3 text-[12px] text-slate-700 align-top",
                      column.wrap ? "whitespace-normal break-words" : "whitespace-nowrap",
                    )}
                  >
                    {column.render
                      ? column.render(row)
                      : cellValue(row[column.key])}
                  </td>
                ))}
                <td className="px-4 py-3 text-right align-top">
                  <TableViewAction
                    title="View all details"
                    onClick={() => onView(row)}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const RECEIPT_COLUMNS = [
  {
    key: "supplierName",
    label: "Supplier",
    minWidth: 180,
    wrap: true,
    render: (row) => {
      if (!row.supplierName) return "—";
      return (
        <div>
          <div className="font-medium text-slate-800">{row.supplierName}</div>
          {row.supplierPhone ? (
            <div className="mt-0.5 text-[11px] text-slate-500">{row.supplierPhone}</div>
          ) : null}
        </div>
      );
    },
  },
  {
    key: "storeName",
    label: "Store",
    minWidth: 160,
    wrap: true,
    render: (row) => {
      if (!row.storeName && !row.storeCode) return "—";
      if (row.storeName && row.storeCode) {
        return `${row.storeName} (${row.storeCode})`;
      }
      return row.storeName || row.storeCode;
    },
  },
  {
    key: "deliveredByName",
    label: "Delivered by",
    minWidth: 150,
    wrap: true,
    render: (row) => {
      if (!row.deliveredByName && !row.deliveredByPhone) return "—";
      return (
        <div>
          <div>{row.deliveredByName || "—"}</div>
          {row.deliveredByPhone ? (
            <div className="mt-0.5 text-[11px] text-slate-500">{row.deliveredByPhone}</div>
          ) : null}
        </div>
      );
    },
  },
  {
    key: "condition",
    label: "Condition",
    minWidth: 120,
    render: (row) => formatCondition(row.condition),
  },
  {
    key: "quantity",
    label: "Quantity",
    minWidth: 100,
    render: (row) => cellValue(row.quantity),
  },
  {
    key: "unitPrice",
    label: "Unit price",
    minWidth: 120,
    render: (row) =>
      row.unitPrice == null ? "—" : formatInventoryMoney(row.unitPrice),
  },
  {
    key: "receivedAt",
    label: "Received",
    minWidth: 150,
    render: (row) => formatApiDateTime(row.receivedAt),
  },
];

const SUPPLY_COLUMNS = [
  { key: "itemCode", label: "Item code", minWidth: 130 },
  { key: "name", label: "Name", minWidth: 180 },
  { key: "brand", label: "Brand", minWidth: 120 },
  { key: "description", label: "Description", minWidth: 220, wrap: true },
  { key: "quantity", label: "Quantity", minWidth: 100 },
  {
    key: "status",
    label: "Status",
    minWidth: 140,
    render: (row) => <SupplyStatusBadge status={row.status} />,
  },
  {
    key: "dateRequested",
    label: "Date requested",
    minWidth: 130,
    render: (row) => formatApiDateTime(row.dateRequested || row.createdAt),
  },
  {
    key: "dateSupplied",
    label: "Date supplied",
    minWidth: 130,
    render: (row) => formatApiDateTime(row.dateSupplied),
  },
  { key: "location", label: "Location", minWidth: 160 },
  { key: "requestedBy", label: "Requested by", minWidth: 150 },
];


function formatDetailLabel(key) {
  const labels = {
    id: "Record ID",
    itemCode: "Item code",
    chassisNumber: "Chassis number",
    dateCollected: "Date received",
    dateRequested: "Date requested",
    dateSupplied: "Date supplied",
    unitCost: "Unit cost",
    collectedBy: "Received by",
    receivedBy: "Received by",
    suppliedByTitle: "Supplier representative title",
    suppliedByName: "Supplier representative",
    suppliedBy: "Supplied by",
    approvedBy: "Approved by",
    supplierId: "Supplier",
    supplierName: "Supplier",
    storeName: "Store",
    storeCode: "Store code",
    itemBrand: "Item brand",
    unitPrice: "Unit price",
    receivedAt: "Received at",
    supplierPhone: "Supplier phone",
    supplierEmail: "Supplier email",
    deliveredByPhone: "Delivered by (phone)",
    deliveredByEmail: "Delivered by (email)",
    deliveredByName: "Delivered by (full name)",
    waybillNumber: "Waybill number",
    totalPurchaseCost: "Total purchase cost",
    averageUnitCost: "Average unit cost",
    minStock: "Minimum stock",
    createdAt: "Item created",
    updatedAt: "Last updated",
    componentPath: "Component path",
    quantity: "Total quantity",
    totalQuantity: "Total quantity",
    photo: "Photo",
  };
  return labels[key] || key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase());
}

function formatDetailValue(key, value) {
  if (value == null || value === "") return "—";
  if (key === "supplierId") return String(value);
  if (key === "condition") return formatCondition(value);
  if (["unitCost", "unitPrice", "averageUnitCost", "totalPurchaseCost"].includes(key)) {
    return formatInventoryMoney(value);
  }
  if (key.startsWith("date") || key.endsWith("At")) return formatApiDateTime(value);
  if (key === "status") return formatInventoryStatus(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function isPhotoValue(key, value) {
  if (key !== "photo" && key !== "imageUrl") return false;
  return typeof value === "string" && value.trim().length > 0;
}

function scalarEntries(record) {
  const skip = new Set([
    "detailReady",
    "detailLoading",
    "detailError",
    "receiptsLoading",
    "receiptsError",
    "receipts",
    "supplies",
    "stores",
  ]);
  return Object.entries(record || {}).filter(
    ([key, value]) =>
      !skip.has(key)
      && (value == null || typeof value !== "object"),
  );
}

function DetailGrid({ entries }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="border-b border-slate-100 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {formatDetailLabel(key)}
          </p>
          {isPhotoValue(key, value) ? (
            <div className="mt-1">
              <ItemPhotoThumb src={value} name="Item photo" className="h-16 w-16" />
            </div>
          ) : (
            <p className="mt-1 break-words text-[12px] font-medium text-slate-700">
              {formatDetailValue(key, value)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function DetailSection({ title, children }) {
  const [open, setOpen] = useState(true);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex w-full items-center gap-2 bg-slate-50 px-4 py-3 text-left",
          open && "border-b border-slate-200",
        )}
        aria-expanded={open}
      >
        <ChevronDown
          size={15}
          className={cn(
            "shrink-0 text-slate-400 transition-transform",
            open && "rotate-180",
          )}
        />
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
          {title}
        </span>
      </button>
      {open && <div className="px-4">{children}</div>}
    </section>
  );
}

export default function AccessoryDetailModal({
  isOpen,
  onClose,
  item,
  variant = "accessory",
  onReceiveStock,
  onUpdateDetails,
  onRetryDetail,
  onRetryReceipts,
}) {
  const [openSections, setOpenSections] = useState({
    information: true,
    collectives: true,
    supplies: true,
  });
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);

  const isVehiclePart = variant === "vehicle_part";
  const detailReady = Boolean(item?.detailReady);
  const detailLoading = Boolean(item?.detailLoading);
  const detailError = item?.detailError || null;
  const receiptsLoading = Boolean(item?.receiptsLoading);
  const receiptsError = item?.receiptsError || null;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setOpenSections({ information: true, collectives: true, supplies: true });
      setReceiveOpen(false);
      setEditOpen(false);
      setSelectedMovement(null);
    } else {
      document.body.style.overflow = "";
      setReceiveOpen(false);
      setEditOpen(false);
      setSelectedMovement(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const toggle = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const receipts = Array.isArray(item.receipts) ? item.receipts : [];
  const supplies = item.supplies || [];
  const averageUnitCost = detailReady && receipts.length
    ? receipts.reduce((sum, row) => sum + Number(row.unitPrice || 0), 0) / receipts.length
    : 0;
  const stockByLocation = detailReady
    ? (item.stores || []).map((store) => ({
      id: store.id,
      location: store.name,
      quantity: store.quantity,
    }))
    : [];
  const estimatedStockValue = detailReady
    ? (Number(item.quantity) || 0) * averageUnitCost
    : 0;

  const handleReceiveSave = async (payload) => {
    await onReceiveStock?.(payload);
    setReceiveOpen(false);
  };

  const receiptsTitle = receiptsLoading || receiptsError
    ? "Receipts"
    : `Receipts (${receipts.length})`;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/60 animate-in fade-in duration-200"
        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        onClick={onClose}
      />

      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 m-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Item Details</h2>
            <p className="text-[12px] text-slate-500 font-medium mt-1">
              {isVehiclePart
                ? "Vehicle part inventory record and movement history."
                : "Accessory inventory record and movement history."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-6 overflow-y-auto space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {detailReady ? <StatusPill status={item.status} /> : null}
            <span className="text-[12px] text-slate-400 font-medium">
              {item.itemCode || item.name || `Item #${item.id}`}
            </span>
          </div>

          <AccordionSection
            title="Item Information"
            open={openSections.information}
            onToggle={() => toggle("information")}
            action={
              <Button
                type="button"
                size="sm"
                variant="primary"
                disabled={!detailReady}
                onClick={(e) => {
                  e.stopPropagation();
                  setReceiveOpen(true);
                }}
                className="inline-flex items-center gap-1.5 shrink-0"
              >
                <Plus size={14} />
                Receive stock
              </Button>
            }
          >
            <SectionLoadState
              loading={detailLoading}
              error={detailError}
              onRetry={onRetryDetail}
              loadingLabel="Loading item details…"
            >
              {detailReady ? (
                <>
                  <DetailRow label="Photo">
                    <ItemPhotoThumb src={item.photo} name={item.name} className="h-16 w-16" />
                  </DetailRow>
                  <DetailRow label="Item Code">{item.itemCode}</DetailRow>
                  {isVehiclePart ? (
                    <>
                      <DetailRow label="Make">{item.make}</DetailRow>
                      <DetailRow label="Model">{item.model}</DetailRow>
                      <DetailRow label="Year">{item.year ?? "—"}</DetailRow>
                      <DetailRow label="Chassis Number">{item.chassisNumber}</DetailRow>
                      <DetailRow label="Name">{item.name}</DetailRow>
                      <DetailRow label="Component path">{item.componentPath || "—"}</DetailRow>
                      <DetailRow label="Brand">{item.brand || "—"}</DetailRow>
                    </>
                  ) : (
                    <>
                      <DetailRow label="Name">{item.name}</DetailRow>
                      <DetailRow label="Brand">{item.brand}</DetailRow>
                    </>
                  )}
                  <DetailRow label="Unit">{item.unit || "—"}</DetailRow>
                  <DetailRow label="Description">{item.description || "—"}</DetailRow>
                  <DetailRow label="Shelf location">{item.shelfPosition || "—"}</DetailRow>
                  <DetailRow label="Total quantity">{item.quantity}</DetailRow>
                  <DetailRow label="Average unit cost">
                    {formatInventoryMoney(averageUnitCost)}
                  </DetailRow>
                  <DetailRow label="Estimated stock value">
                    {formatInventoryMoney(estimatedStockValue)}
                  </DetailRow>
                  <DetailRow label="Locations">
                    {stockByLocation.length === 0 ? (
                      "—"
                    ) : (
                      <ul className="space-y-1.5">
                        {stockByLocation.map((row) => (
                          <li
                            key={row.id ?? row.location}
                            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5"
                          >
                            <span>{row.location}</span>
                            <span className="tabular-nums text-slate-500">
                              {row.quantity} on hand
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </DetailRow>
                  <DetailRow label="Status">
                    <StatusPill status={item.status} />
                  </DetailRow>
                </>
              ) : null}
            </SectionLoadState>
          </AccordionSection>

          <AccordionSection
            title={receiptsTitle}
            open={openSections.collectives}
            onToggle={() => toggle("collectives")}
          >
            <MiniTable
              columns={RECEIPT_COLUMNS}
              rows={receipts}
              emptyLabel="No receipts recorded for this item."
              onView={(row) => setSelectedMovement({ row, type: "Receipt" })}
              loading={receiptsLoading}
              error={receiptsError}
              onRetry={onRetryReceipts}
              loadingLabel="Loading receipts…"
              errorTitle="Couldn’t load receipts"
            />
          </AccordionSection>

          <AccordionSection
            title={`Supplies (${supplies.length})`}
            open={openSections.supplies}
            onToggle={() => toggle("supplies")}
          >
            <MiniTable
              columns={SUPPLY_COLUMNS}
              rows={supplies}
              emptyLabel="No supplies recorded for this item."
              onView={(row) => setSelectedMovement({ row, type: "Supply" })}
            />
          </AccordionSection>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 rounded-b-2xl">
          <Button onClick={onClose} variant="ghost" size="modal" className="border border-slate-200">
            Close
          </Button>
          {onUpdateDetails && !isVehiclePart ? (
            <Button size="modal" disabled={!detailReady} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          ) : null}
        </div>
      </div>

      <ReceiveIntoStoreModal
        isOpen={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        item={item}
        onSave={handleReceiveSave}
      />

      <EditInventoryItemModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        item={item}
        onSave={async (payload) => {
          await onUpdateDetails?.(payload);
          setEditOpen(false);
        }}
      />

      <AddModal
        isOpen={Boolean(selectedMovement)}
        onClose={() => setSelectedMovement(null)}
        onSave={() => setSelectedMovement(null)}
        title={selectedMovement?.type === "Supply" ? "Supply details" : "Receipt details"}
        subtitle={
          selectedMovement?.type === "Supply"
            ? "Supply information and linked item details."
            : "Stock receipt information and linked item details."
        }
        saveLabel="Close"
        saveVariant="ghost"
        hideCancelButton
        dialogClassName="max-w-2xl"
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {detailReady ? <StatusPill status={item.status} /> : null}
          <span className="text-[12px] font-bold text-slate-900">{item.itemCode}</span>
          <span className="text-[11px] text-slate-500">{item.name}</span>
        </div>
        <div className="space-y-4">
          {detailReady ? (
            <DetailSection title="Item Details">
              <DetailGrid entries={scalarEntries(item)} />
            </DetailSection>
          ) : null}
          <DetailSection title={`${selectedMovement?.type || "Record"} Details`}>
            <DetailGrid entries={scalarEntries(selectedMovement?.row)} />
          </DetailSection>
        </div>
      </AddModal>
    </div>,
    document.body,
  );
}

