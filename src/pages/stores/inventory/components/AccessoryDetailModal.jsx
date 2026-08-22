import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { ChevronDown, Plus, X } from "lucide-react";
import Button from "../../../../components/common/base/Button";
import AddModal from "../../../../components/common/AddModal";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import { TableViewAction } from "../../../../components/common/tableActions";
import { cn } from "../../../../utils/cn";
import {
  formatAccessoryDate,
  formatAccessoryMoney,
  formatAccessoryStatus,
  getInventoryAverageUnitCost,
  getInventoryStockByLocation,
} from "../../../../mockdata/stores";
import { getSuppliers } from "../../../../mockdata/org";
import ReceiveIntoStoreModal from "./ReceiveIntoStoreModal";
import EditInventoryItemModal from "./EditInventoryItemModal";
import { ItemPhotoThumb } from "./ItemPhotoField";

function StatusPill({ status }) {
  const raw = (status ?? "").toString().toUpperCase();
  const tone =
    raw === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : raw === "LOW_STOCK"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : raw === "OUT_OF_STOCK"
          ? "bg-rose-50 text-rose-700 border-rose-200"
          : "bg-slate-50 text-slate-500 border-slate-200";

  return (
    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border", tone)}>
      {formatAccessoryStatus(status)}
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

function isPendingSupply(row) {
  return (
    row?.status === "PENDING_APPROVAL"
    || (!row?.dateSupplied && String(row?.approvedBy || "").toLowerCase() === "pending")
  );
}

function MiniTable({ columns, rows, emptyLabel, onView, onApprove }) {
  const tableMinWidth = Math.max(
    960,
    columns.reduce((sum, column) => sum + (column.minWidth ?? 120), 0) + 140,
  );

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
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
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
                    {column.render ? column.render(row) : row[column.key] ?? "—"}
                  </td>
                ))}
                <td className="px-4 py-3 text-right align-top">
                  <div className="inline-flex items-center justify-end gap-2">
                    {onApprove && isPendingSupply(row) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => onApprove(row)}
                      >
                        Approve
                      </Button>
                    ) : null}
                    <TableViewAction
                      title="View all details"
                      onClick={() => onView(row)}
                    />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const ACCESSORY_COLLECTIVE_COLUMNS = [
  { key: "itemCode", label: "Item code", minWidth: 130 },
  { key: "name", label: "Name", minWidth: 180 },
  { key: "brand", label: "Brand", minWidth: 120 },
  { key: "description", label: "Description", minWidth: 220, wrap: true },
  { key: "quantity", label: "Quantity", minWidth: 100 },
  {
    key: "dateCollected",
    label: "Date received",
    minWidth: 130,
    render: (row) => formatAccessoryDate(row.dateCollected),
  },
  {
    key: "unitCost",
    label: "Unit cost",
    minWidth: 120,
    render: (row) => formatAccessoryMoney(row.unitCost),
  },
  { key: "location", label: "Location", minWidth: 160 },
  { key: "collectedBy", label: "Received by", minWidth: 150 },
];

const ACCESSORY_SUPPLY_COLUMNS = [
  { key: "itemCode", label: "Item code", minWidth: 130 },
  { key: "name", label: "Name", minWidth: 180 },
  { key: "brand", label: "Brand", minWidth: 120 },
  { key: "description", label: "Description", minWidth: 220, wrap: true },
  { key: "quantity", label: "Quantity", minWidth: 100 },
  {
    key: "status",
    label: "Status",
    minWidth: 120,
    render: (row) =>
      isPendingSupply(row) ? (
        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
          Pending approval
        </span>
      ) : (
        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
          Approved
        </span>
      ),
  },
  {
    key: "dateRequested",
    label: "Date requested",
    minWidth: 130,
    render: (row) => formatAccessoryDate(row.dateRequested),
  },
  {
    key: "dateSupplied",
    label: "Date supplied",
    minWidth: 130,
    render: (row) => formatAccessoryDate(row.dateSupplied),
  },
  {
    key: "unitCost",
    label: "Unit cost",
    minWidth: 120,
    render: (row) => formatAccessoryMoney(row.unitCost),
  },
  { key: "location", label: "Location", minWidth: 160 },
  { key: "receivedBy", label: "Received by", minWidth: 150 },
  {
    key: "suppliedBy",
    label: "Supplied by",
    minWidth: 200,
    wrap: true,
    render: (row) => (
      <div className="space-y-0.5 leading-snug">
        <p>
          <span className="text-slate-400 font-medium">Title:</span>{" "}
          {row.suppliedByTitle || "Fleet manager"}
        </p>
        <p>
          <span className="text-slate-400 font-medium">Name:</span>{" "}
          {row.suppliedByName || row.suppliedBy || "Emmanuel Tetteh"}
        </p>
      </div>
    ),
  },
  { key: "approvedBy", label: "Approved by", minWidth: 150 },
];

const VEHICLE_PART_COLLECTIVE_COLUMNS = [
  { key: "itemCode", label: "Item code", minWidth: 140 },
  { key: "make", label: "Make", minWidth: 110 },
  { key: "model", label: "Model", minWidth: 120 },
  { key: "year", label: "Year", minWidth: 80 },
  { key: "chassisNumber", label: "Chassis number", minWidth: 180 },
  { key: "name", label: "Name", minWidth: 180 },
  { key: "brand", label: "Brand", minWidth: 120 },
  { key: "description", label: "Description", minWidth: 220, wrap: true },
  { key: "quantity", label: "Quantity", minWidth: 100 },
  {
    key: "dateCollected",
    label: "Date received",
    minWidth: 130,
    render: (row) => formatAccessoryDate(row.dateCollected),
  },
  {
    key: "unitCost",
    label: "Unit cost",
    minWidth: 120,
    render: (row) => formatAccessoryMoney(row.unitCost),
  },
  { key: "location", label: "Location", minWidth: 160 },
  { key: "collectedBy", label: "Received by", minWidth: 150 },
];

const VEHICLE_PART_SUPPLY_COLUMNS = [
  { key: "itemCode", label: "Item code", minWidth: 140 },
  { key: "make", label: "Make", minWidth: 110 },
  { key: "model", label: "Model", minWidth: 120 },
  { key: "year", label: "Year", minWidth: 80 },
  { key: "chassisNumber", label: "Chassis number", minWidth: 180 },
  { key: "name", label: "Name", minWidth: 180 },
  { key: "brand", label: "Brand", minWidth: 120 },
  { key: "description", label: "Description", minWidth: 220, wrap: true },
  { key: "quantity", label: "Quantity", minWidth: 100 },
  {
    key: "status",
    label: "Status",
    minWidth: 120,
    render: (row) =>
      isPendingSupply(row) ? (
        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
          Pending approval
        </span>
      ) : (
        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
          Approved
        </span>
      ),
  },
  {
    key: "dateRequested",
    label: "Date requested",
    minWidth: 130,
    render: (row) => formatAccessoryDate(row.dateRequested),
  },
  {
    key: "dateSupplied",
    label: "Date supplied",
    minWidth: 130,
    render: (row) => formatAccessoryDate(row.dateSupplied),
  },
  {
    key: "unitCost",
    label: "Unit cost",
    minWidth: 120,
    render: (row) => formatAccessoryMoney(row.unitCost),
  },
  { key: "location", label: "Location", minWidth: 160 },
  { key: "receivedBy", label: "Received by", minWidth: 150 },
  {
    key: "suppliedBy",
    label: "Supplied by",
    minWidth: 200,
    wrap: true,
    render: (row) => (
      <div className="space-y-0.5 leading-snug">
        <p>
          <span className="text-slate-400 font-medium">Title:</span>{" "}
          {row.suppliedByTitle || "Fleet manager"}
        </p>
        <p>
          <span className="text-slate-400 font-medium">Name:</span>{" "}
          {row.suppliedByName || row.suppliedBy || "Emmanuel Tetteh"}
        </p>
      </div>
    ),
  },
  { key: "approvedBy", label: "Approved by", minWidth: 150 },
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
    waybillNumber: "Waybill number",
    deliveredByName: "Delivered by",
    supplierPhone: "Supplier phone",
    supplierEmail: "Supplier email",
    totalPurchaseCost: "Total purchase cost",
    averageUnitCost: "Average unit cost",
    minStock: "Minimum stock",
    createdAt: "Item created",
    updatedAt: "Last updated",
    componentPath: "Component path",
  };
  return labels[key] || key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase());
}

function formatDetailValue(key, value) {
  if (value == null || value === "") return "—";
  if (key === "supplierId") {
    return getSuppliers().find((supplier) => supplier.id === value)?.name || value;
  }
  if (key === "condition") return formatCondition(value);
  if (["unitCost", "averageUnitCost", "totalPurchaseCost"].includes(key)) {
    return formatAccessoryMoney(value);
  }
  if (key.startsWith("date") || key.endsWith("At")) return formatAccessoryDate(value);
  if (key === "status") {
    if (value === "PENDING_APPROVAL") return "Pending approval";
    if (value === "APPROVED") return "Approved";
    return formatAccessoryStatus(value);
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const RECEIVING_FIELD_KEYS = [
  "condition",
  "supplierId",
  "waybillNumber",
  "deliveredByName",
  "supplierPhone",
  "supplierEmail",
  "notes",
];

function scalarEntries(record) {
  return Object.entries(record || {}).filter(
    ([, value]) => value == null || typeof value !== "object",
  );
}

function movementEntries(record, type) {
  const entries = scalarEntries(record).filter(
    ([key]) => type === "Receivable" || !RECEIVING_FIELD_KEYS.includes(key),
  );
  if (type !== "Receivable") return entries;

  const existingKeys = new Set(entries.map(([key]) => key));
  RECEIVING_FIELD_KEYS.forEach((key) => {
    if (!existingKeys.has(key)) entries.push([key, ""]);
  });
  return entries;
}

function DetailGrid({ entries }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="border-b border-slate-100 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {formatDetailLabel(key)}
          </p>
          <p className="mt-1 break-words text-[12px] font-medium text-slate-700">
            {formatDetailValue(key, value)}
          </p>
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
  onApproveSupply,
  onUpdateDetails,
}) {
  const [openSections, setOpenSections] = useState({
    information: true,
    collectives: true,
    supplies: true,
  });
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [pendingApprove, setPendingApprove] = useState(null);

  const isVehiclePart = variant === "vehicle_part";

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setOpenSections({ information: true, collectives: true, supplies: true });
      setReceiveOpen(false);
      setEditOpen(false);
      setSelectedMovement(null);
      setPendingApprove(null);
    } else {
      document.body.style.overflow = "";
      setReceiveOpen(false);
      setEditOpen(false);
      setSelectedMovement(null);
      setPendingApprove(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const toggle = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const averageUnitCost = getInventoryAverageUnitCost(item);
  const stockByLocation = getInventoryStockByLocation(item);
  const estimatedStockValue = (Number(item.quantity) || 0) * averageUnitCost;

  const handleReceiveSave = (payload) => {
    onReceiveStock?.(payload);
    setReceiveOpen(false);
  };

  const requestApprove = (row) => {
    if (!row) return;
    setPendingApprove(row);
  };

  const confirmApprove = () => {
    if (!pendingApprove) return;
    onApproveSupply?.(pendingApprove);
    setPendingApprove(null);
    setSelectedMovement(null);
  };

  const viewingPendingSupply =
    selectedMovement?.type === "Supply" && isPendingSupply(selectedMovement?.row);

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
            <StatusPill status={item.status} />
            <span className="text-[12px] text-slate-400 font-medium">{item.itemCode}</span>
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
                onClick={(e) => {
                  e.stopPropagation();
                  setReceiveOpen(true);
                }}
                className="inline-flex items-center gap-1.5 shrink-0"
              >
                <Plus size={14} />
                Submit stock receipt
              </Button>
            }
          >
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
            <DetailRow label="Description">{item.description || "—"}</DetailRow>
            <DetailRow label="Shelf location">{item.shelfPosition || "—"}</DetailRow>
            <DetailRow label="Quantity on hand">{item.quantity}</DetailRow>
            <DetailRow label="Average unit cost">
              {formatAccessoryMoney(averageUnitCost)}
            </DetailRow>
            <DetailRow label="Estimated stock value">
              {formatAccessoryMoney(estimatedStockValue)}
            </DetailRow>
            <DetailRow label="Locations">
              {stockByLocation.length === 0 ? (
                "—"
              ) : (
                <ul className="space-y-1.5">
                  {stockByLocation.map((row) => (
                    <li
                      key={row.location}
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
          </AccordionSection>

          <AccordionSection
            title={`Receivables (${item.collectives?.length ?? 0})`}
            open={openSections.collectives}
            onToggle={() => toggle("collectives")}
          >
            <MiniTable
              columns={
                isVehiclePart ? VEHICLE_PART_COLLECTIVE_COLUMNS : ACCESSORY_COLLECTIVE_COLUMNS
              }
              rows={item.collectives ?? []}
              emptyLabel="No receivables recorded for this item."
              onView={(row) => setSelectedMovement({ row, type: "Receivable" })}
            />
          </AccordionSection>

          <AccordionSection
            title={`Supplies (${item.supplies?.length ?? 0})`}
            open={openSections.supplies}
            onToggle={() => toggle("supplies")}
          >
            <MiniTable
              columns={isVehiclePart ? VEHICLE_PART_SUPPLY_COLUMNS : ACCESSORY_SUPPLY_COLUMNS}
              rows={item.supplies ?? []}
              emptyLabel="No supply records for this item."
              onView={(row) => setSelectedMovement({ row, type: "Supply" })}
              onApprove={requestApprove}
            />
          </AccordionSection>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 rounded-b-2xl">
          <Button onClick={onClose} variant="ghost" size="modal" className="border border-slate-200">
            Close
          </Button>
          {onUpdateDetails && !isVehiclePart ? (
            <Button size="modal" onClick={() => setEditOpen(true)}>
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
        onSave={(payload) => {
          onUpdateDetails?.(payload);
          setEditOpen(false);
        }}
      />

      <AddModal
        isOpen={Boolean(selectedMovement) && !pendingApprove}
        onClose={() => setSelectedMovement(null)}
        onSave={
          viewingPendingSupply
            ? () => requestApprove(selectedMovement.row)
            : () => setSelectedMovement(null)
        }
        title="Inventory Record Details"
        subtitle={`${selectedMovement?.type || "Movement"} information and complete linked item details.`}
        saveLabel={viewingPendingSupply ? "Approve receipt" : "Close"}
        saveVariant={viewingPendingSupply ? "primary" : "ghost"}
        hideCancelButton={!viewingPendingSupply}
        secondaryAction={
          viewingPendingSupply
            ? { label: "Close", onClick: () => setSelectedMovement(null) }
            : undefined
        }
        dialogClassName="max-w-2xl"
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusPill status={item.status} />
          {selectedMovement?.type === "Supply" ? (
            isPendingSupply(selectedMovement.row) ? (
              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                Pending approval
              </span>
            ) : (
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Approved
              </span>
            )
          ) : null}
          <span className="text-[12px] font-bold text-slate-900">{item.itemCode}</span>
          <span className="text-[11px] text-slate-500">{item.name}</span>
        </div>
        <div className="space-y-4">
          <DetailSection title="Item Details">
            <DetailGrid
              entries={scalarEntries(item).filter(
                ([key]) => !RECEIVING_FIELD_KEYS.includes(key),
              )}
            />
          </DetailSection>
          <DetailSection title={`${selectedMovement?.type || "Movement"} Details`}>
            <DetailGrid
              entries={movementEntries(selectedMovement?.row, selectedMovement?.type)}
            />
          </DetailSection>
        </div>
      </AddModal>

      <ConfirmationModal
        isOpen={Boolean(pendingApprove)}
        onClose={() => setPendingApprove(null)}
        onConfirm={confirmApprove}
        className="!z-[10001]"
        title="Approve stock receipt?"
        message={
          pendingApprove
            ? `Approve receipt of ${pendingApprove.quantity} ${item.itemCode || "item"} into ${pendingApprove.location || "store"}? This will add it to receivables and update on-hand stock.`
            : "Approve this stock receipt?"
        }
        confirmText="Approve receipt"
      />
    </div>,
    document.body,
  );
}
