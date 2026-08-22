import React, { useEffect, useMemo, useState } from "react";
import {
  Package,
  AlertTriangle,
  Wallet,
  Boxes,
  Plus,
  Wrench,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import Button from "../../../components/common/base/Button";
import SummaryStatCard from "../../../components/common/SummaryStatCard";
import SearchInput from "../../../components/common/fields/SearchInput";
import Pagination from "../../../components/common/Pagination";
import { TableRowActions, TableViewAction } from "../../../components/common/tableActions";
import { toast } from "../../../components/common/ToastNotification";
import {
  ACCESSORY_STATUS_OPTIONS,
  VEHICLE_PART_STATUS_OPTIONS,
  addAccessory,
  addAccessoriesBatch,
  addVehiclePart,
  addVehiclePartsBatch,
  formatAccessoryMoney,
  formatAccessoryStatus,
  getAccessories,
  getVehicleParts,
  receiveAccessoryStock,
  receiveAccessoryStockBatch,
  approveAccessoryStockReceipt,
  receiveVehiclePartStock,
  receiveVehiclePartStockBatch,
  approveVehiclePartStockReceipt,
} from "../../../mockdata/stores";
import {
  AccessoryDetailModal,
  NewInventoryItemModal,
} from "./components";

const PAGE_SIZE = 10;

const filterLabelClassName =
  "text-[11px] font-medium text-slate-500 tracking-wider shrink-0";

const filterSelectClassName =
  "px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 outline-none focus:border-emerald-500";

const dateInputClassName =
  "w-full min-w-[150px] h-9 px-3 text-[12px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 cursor-pointer";

function statusBadgeClass(status) {
  const raw = (status ?? "").toString().toUpperCase();
  if (raw === "ACTIVE") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (raw === "LOW_STOCK") return "bg-amber-50 text-amber-700 border-amber-200";
  if (raw === "OUT_OF_STOCK") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function openDatePicker(event) {
  const input = event.currentTarget;
  try {
    input.showPicker?.();
  } catch {
    /* Unsupported browsers fall back to native focus behaviour. */
  }
}

function DateRangeFilter({ dateFrom, dateTo, onFromChange, onToChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label
          htmlFor="inventoryDateFrom"
          className="text-[11px] font-medium text-slate-500 tracking-wider shrink-0"
        >
          From :
        </label>
        <input
          id="inventoryDateFrom"
          type="date"
          value={dateFrom}
          max={dateTo || undefined}
          onChange={onFromChange}
          onClick={openDatePicker}
          onFocus={openDatePicker}
          className={dateInputClassName}
        />
      </div>
      <div className="flex items-center gap-2">
        <label
          htmlFor="inventoryDateTo"
          className="text-[11px] font-medium text-slate-500 tracking-wider shrink-0"
        >
          To :
        </label>
        <input
          id="inventoryDateTo"
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={onToChange}
          onClick={openDatePicker}
          onFocus={openDatePicker}
          className={dateInputClassName}
        />
      </div>
    </div>
  );
}

function matchesDateRange(createdAt, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return true;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  if (dateFrom) {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    if (created < from) return false;
  }
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    if (created > to) return false;
  }
  return true;
}

export default function InventoryList({
  embedded = false,
  tabsSlot = null,
  view = "accessories",
  onCreatedItemType,
}) {
  const isVehicleParts = view === "vehicle_parts";
  const [accessoryItems, setAccessoryItems] = useState(() => getAccessories());
  const [vehiclePartItems, setVehiclePartItems] = useState(() => getVehicleParts());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const items = isVehicleParts ? vehiclePartItems : accessoryItems;
  const statusOptions = isVehicleParts ? VEHICLE_PART_STATUS_OPTIONS : ACCESSORY_STATUS_OPTIONS;

  useEffect(() => {
    setPage(0);
    setSearchQuery("");
    setStatusFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setSelected(null);
    setAddOpen(false);
  }, [view]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (!matchesDateRange(item.createdAt, dateFrom, dateTo)) return false;
      if (!q) return true;

      if (isVehicleParts) {
        return (
          item.itemCode.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          (item.make || "").toLowerCase().includes(q) ||
          (item.model || "").toLowerCase().includes(q) ||
          String(item.year ?? "").includes(q) ||
          (item.chassisNumber || "").toLowerCase().includes(q) ||
          (item.brand || "").toLowerCase().includes(q)
        );
      }

      return (
        item.itemCode.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery, statusFilter, dateFrom, dateTo, isVehicleParts]);

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  const stats = useMemo(() => {
    const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalCost = items.reduce((sum, item) => sum + (Number(item.totalPurchaseCost) || 0), 0);
    const lowStock = items.filter(
      (item) => item.status === "LOW_STOCK" || item.status === "OUT_OF_STOCK",
    ).length;
    return [
      {
        label: isVehicleParts ? "Vehicle part SKUs" : "Accessory items",
        value: String(items.length),
        icon: isVehicleParts ? Wrench : Package,
        tone: "teal",
      },
      { label: "Total quantity", value: String(totalQty), icon: Boxes, tone: "sky" },
      { label: "Purchase value", value: formatAccessoryMoney(totalCost), icon: Wallet, tone: "violet" },
      { label: "Attention needed", value: String(lowStock), icon: AlertTriangle, tone: "amber" },
    ];
  }, [items, isVehicleParts]);

  const handleSaveItem = ({ type, mode = "new", payload }) => {
    try {
      if (mode === "existing") {
        const updated =
          type === "vehicle_part"
            ? receiveVehiclePartStock(payload.itemId, payload)
            : receiveAccessoryStock(payload.itemId, payload);
        if (type === "vehicle_part") {
          setVehiclePartItems(getVehicleParts());
          onCreatedItemType?.("vehicle_parts");
        } else {
          setAccessoryItems(getAccessories());
          onCreatedItemType?.("accessories");
        }
        toast.success(
          `Submitted receipt of ${payload.quantity} of ${updated.name} for approval.`,
        );
      } else if (type === "accessory") {
        const created = addAccessory(payload);
        setAccessoryItems(getAccessories());
        toast.success(`${created.name} added to accessories inventory.`);
        onCreatedItemType?.("accessories");
      } else {
        const created = addVehiclePart(payload);
        setVehiclePartItems(getVehicleParts());
        toast.success(`${created.name} added to vehicle parts inventory.`);
        onCreatedItemType?.("vehicle_parts");
      }
      setAddOpen(false);
      setPage(0);
    } catch (error) {
      toast.error(error.message ?? "Could not add inventory item.");
    }
  };

  const handleReceiveStock = (payload) => {
    if (!selected) return;
    try {
      const updated = isVehicleParts
        ? receiveVehiclePartStock(selected.id, payload)
        : receiveAccessoryStock(selected.id, payload);
      if (isVehicleParts) {
        setVehiclePartItems(getVehicleParts());
      } else {
        setAccessoryItems(getAccessories());
      }
      setSelected(updated);
      toast.success(
        `Stock receipt submitted for approval. It will appear in receivables after approval.`,
      );
    } catch (error) {
      toast.error(error.message ?? "Could not submit stock receipt.");
      throw error;
    }
  };

  const handleApproveSupply = (supply) => {
    if (!selected?.id || !supply?.id) return;
    try {
      const updated = isVehicleParts
        ? approveVehiclePartStockReceipt(selected.id, supply.id)
        : approveAccessoryStockReceipt(selected.id, supply.id);
      if (isVehicleParts) {
        setVehiclePartItems(getVehicleParts());
      } else {
        setAccessoryItems(getAccessories());
      }
      setSelected(updated);
      toast.success("Stock receipt approved. Receivables and on-hand stock updated.");
    } catch (error) {
      toast.error(error.message ?? "Could not approve stock receipt.");
    }
  };

  const handleBulkReceipt = ({ mode, inventoryType, shared, lines }) => {
    let updated;
    if (inventoryType === "vehicle_part") {
      updated =
        mode === "new"
          ? addVehiclePartsBatch(lines, shared)
          : receiveVehiclePartStockBatch(lines, shared);
      setVehiclePartItems(getVehicleParts());
    } else {
      updated =
        mode === "new"
          ? addAccessoriesBatch(lines, shared)
          : receiveAccessoryStockBatch(lines, shared);
      setAccessoryItems(getAccessories());
    }
    setAddOpen(false);
    setPage(0);
    onCreatedItemType?.(inventoryType === "vehicle_part" ? "vehicle_parts" : "accessories");
    toast.success(
      mode === "existing"
        ? `${updated.length} stock receipt${updated.length === 1 ? "" : "s"} submitted for approval.`
        : `${updated.length} ${inventoryType === "vehicle_part" ? "vehicle part" : "accessory"} receipt${updated.length === 1 ? "" : "s"} recorded.`,
    );
  };

  return (
    <div className={embedded ? "space-y-4" : "space-y-4 pb-8"}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <SummaryStatCard
          variant={embedded ? "light" : "filled"}
            key={stat.label}
            title={stat.label}
            value={stat.value}
            icon={stat.icon}
            tone={stat.tone}
          />
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-2 sm:px-4 bg-slate-50/30">
            <div className="min-w-0 flex-1">{tabsSlot}</div>
            <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 py-2">
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus size={16} /> New item
              </Button>
            </div>
          </div>

          <div className="p-4 bg-slate-50/30 flex flex-col xl:flex-row justify-between gap-4">
            <SearchInput
              placeholder={
                isVehicleParts
                  ? "Search by code, make, model, chassis, or component…"
                  : "Search by code, name, brand, or description…"
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
            />
            <div className="flex flex-wrap items-center gap-3">
              <DateRangeFilter
                dateFrom={dateFrom}
                dateTo={dateTo}
                onFromChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(0);
                }}
                onToChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(0);
                }}
              />
              <div className="flex items-center gap-2">
                <label
                  htmlFor="inventoryStatusFilter"
                  className={filterLabelClassName}
                >
                  Status :
                </label>
                <select
                  id="inventoryStatusFilter"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                  className={filterSelectClassName}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isVehicleParts ? (
            <table className="w-full text-left min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Item code
                  </th>
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Make
                  </th>
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Chassis number
                  </th>
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-[13px] text-slate-400">
                      No vehicle parts found.
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3.5 text-[12px] font-bold text-slate-900 whitespace-nowrap">
                        {row.itemCode}
                      </td>
                      <td className="px-6 py-3.5 text-[12px] text-slate-700">{row.make}</td>
                      <td className="px-6 py-3.5 text-[12px] text-slate-700">{row.model}</td>
                      <td className="px-6 py-3.5 text-[12px] text-slate-700">{row.year ?? "—"}</td>
                      <td className="px-6 py-3.5 text-[12px] font-medium text-slate-800 whitespace-nowrap">
                        {row.chassisNumber}
                      </td>
                      <td className="px-6 py-3.5 text-[12px] font-semibold text-slate-800">
                        {row.name}
                      </td>
                      <td className="px-6 py-3.5 text-[12px] font-bold text-slate-800">
                        {row.quantity}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 rounded text-[9px] font-bold border capitalize",
                            statusBadgeClass(row.status),
                          )}
                        >
                          {formatAccessoryStatus(row.status)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <TableRowActions>
                          <TableViewAction title="View item" onClick={() => setSelected(row)} />
                        </TableRowActions>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left min-w-[960px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Item code
                  </th>
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Total purchase cost
                  </th>
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[13px] text-slate-400">
                      No accessories found.
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3.5 text-[12px] font-bold text-slate-900 whitespace-nowrap">
                        {row.itemCode}
                      </td>
                      <td className="px-6 py-3.5 text-[12px] font-semibold text-slate-800">
                        {row.name}
                      </td>
                      <td className="px-6 py-3.5 text-[12px] text-slate-700">{row.brand}</td>
                      <td className="px-6 py-3.5 text-[12px] text-slate-600 max-w-[240px]">
                        <span className="line-clamp-2">{row.description || "—"}</span>
                      </td>
                      <td className="px-6 py-3.5 text-[12px] font-bold text-slate-800">
                        {row.quantity}
                      </td>
                      <td className="px-6 py-3.5 text-[12px] font-bold text-slate-800 whitespace-nowrap">
                        {formatAccessoryMoney(row.totalPurchaseCost)}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 rounded text-[9px] font-bold border capitalize",
                            statusBadgeClass(row.status),
                          )}
                        >
                          {formatAccessoryStatus(row.status)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <TableRowActions>
                          <TableViewAction title="View item" onClick={() => setSelected(row)} />
                        </TableRowActions>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-start">
          <Pagination
            page={safePage}
            size={PAGE_SIZE}
            totalElements={totalElements}
            onPageChange={setPage}
            showWhenEmpty={false}
          />
        </div>
      </div>

      <AccessoryDetailModal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        item={selected}
        variant={isVehicleParts ? "vehicle_part" : "accessory"}
        onReceiveStock={handleReceiveStock}
        onApproveSupply={handleApproveSupply}
      />

      <NewInventoryItemModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleSaveItem}
        onBulkSave={handleBulkReceipt}
      />
    </div>
  );
}
