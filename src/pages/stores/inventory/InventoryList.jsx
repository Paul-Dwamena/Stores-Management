import React, { useEffect, useMemo, useState } from "react";
import {
  Package,
  AlertTriangle,
  Wallet,
  Boxes,
  Plus,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import Button from "../../../components/common/base/Button";
import SummaryStatCard from "../../../components/common/SummaryStatCard";
import SearchInput from "../../../components/common/fields/SearchInput";
import Pagination from "../../../components/common/Pagination";
import { TableRowActions, TableViewAction } from "../../../components/common/tableActions";
import SectionLoadState from "../../../components/common/SectionLoadState";
import { toast } from "../../../components/common/ToastNotification";
import {
  listInventoryItems,
  getInventoryItem,
  listItemReceipts,
  listItemSupplies,
  stockItem,
  stockItemsBulk,
  formatInventoryStatus,
  formatInventoryMoney,
} from "../../../services/inventoryService";
import { getInventoryStats } from "../../../services/statsService";
import { createItem, updateItem, updateItemPhoto } from "../../../services/itemsService";
import {
  AccessoryDetailModal,
  NewInventoryItemModal,
} from "./components";
import { ItemPhotoThumb } from "./components/ItemPhotoField";
import { STATUS_BADGE_CLASS, workflowStatusBadgeClass } from "../../../utils/workflowStatusBadge";

const PAGE_SIZE = 10;

const INVENTORY_STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "IN_STOCK", label: "In stock" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
  { value: "INACTIVE", label: "Inactive" },
];

const filterLabelClassName =
  "text-[11px] font-medium text-slate-500 tracking-wider shrink-0";

const filterSelectClassName =
  "px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25";

function statusBadgeClass(status) {
  return workflowStatusBadgeClass(status);
}

export default function InventoryList({
  embedded = false,
  tabsSlot = null,
  onCreatedItemType,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [stats, setStats] = useState([
    { label: "Accessory items", value: "0", icon: Package, tone: "teal" },
    { label: "Total quantity", value: "0", icon: Boxes, tone: "sky" },
    { label: "Attention needed", value: "0", icon: AlertTriangle, tone: "amber" },
    { label: "Purchase value", value: "—", icon: Wallet, tone: "violet" },
  ]);

  const reload = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [rows, inventoryStats] = await Promise.all([
        listInventoryItems(),
        getInventoryStats().catch(() => null),
      ]);
      setItems(rows.sort((a, b) => Number(b.id) - Number(a.id)));
      if (inventoryStats) {
        setStats([
          { label: "Accessory items", value: String(inventoryStats.totalItems), icon: Package, tone: "teal" },
          { label: "Total quantity", value: String(inventoryStats.totalQuantity), icon: Boxes, tone: "sky" },
          { label: "Attention needed", value: String(inventoryStats.attentionNeeded), icon: AlertTriangle, tone: "amber" },
          {
            label: "Purchase value",
            value: formatInventoryMoney(inventoryStats.purchaseValue),
            icon: Wallet,
            tone: "violet",
          },
        ]);
      }
    } catch (err) {
      setLoadError(err.message || "Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const toStockBody = (payload) => ({
    supplierId: payload.supplierId,
    location: payload.location,
    condition: payload.condition,
    quantity: payload.quantity,
    unitCost: payload.unitCost ?? payload.unitPrice,
    deliveredByName: payload.deliveredByName,
    deliveredByPhone: payload.deliveredByPhone,
    deliveredByEmail: payload.deliveredByEmail,
    waybillNumber: payload.waybillNumber,
    notes: payload.notes,
  });

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.itemCode?.toLowerCase().includes(q) ||
        item.name?.toLowerCase().includes(q) ||
        item.brand?.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery, statusFilter]);

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  const applyDetailResult = (itemId, result) => {
    setSelected((prev) => {
      if (!prev || prev.id !== itemId) return prev;
      if (result.status === "fulfilled") {
        return {
          ...prev,
          ...result.value,
          detailReady: true,
          detailLoading: false,
          detailError: null,
        };
      }
      return {
        ...prev,
        detailReady: false,
        detailLoading: false,
        detailError: result.reason?.message || "Unable to load item details.",
      };
    });
  };

  const applyReceiptsResult = (itemId, result) => {
    setSelected((prev) => {
      if (!prev || prev.id !== itemId) return prev;
      if (result.status === "fulfilled") {
        return {
          ...prev,
          receipts: result.value,
          receiptsLoading: false,
          receiptsError: null,
        };
      }
      return {
        ...prev,
        receipts: [],
        receiptsLoading: false,
        receiptsError: result.reason?.message || "Unable to load receipts.",
      };
    });
  };

  const applySuppliesResult = (itemId, result) => {
    setSelected((prev) => {
      if (!prev || prev.id !== itemId) return prev;
      if (result.status === "fulfilled") {
        return {
          ...prev,
          supplies: result.value,
          suppliesLoading: false,
          suppliesError: null,
        };
      }
      return {
        ...prev,
        supplies: [],
        suppliesLoading: false,
        suppliesError: result.reason?.message || "Unable to load supplies.",
      };
    });
  };

  const loadSelectedSections = async (
    itemId,
    { detail = true, receipts = true, supplies = true } = {},
  ) => {
    if (!itemId) return;
    setSelected((prev) => {
      if (!prev || prev.id !== itemId) return prev;
      return {
        ...prev,
        ...(detail ? { detailLoading: true, detailError: null } : null),
        ...(receipts ? { receiptsLoading: true, receiptsError: null } : null),
        ...(supplies ? { suppliesLoading: true, suppliesError: null } : null),
      };
    });

    const tasks = [];
    if (detail) tasks.push(["detail", getInventoryItem(itemId)]);
    if (receipts) tasks.push(["receipts", listItemReceipts(itemId)]);
    if (supplies) tasks.push(["supplies", listItemSupplies(itemId)]);

    const settled = await Promise.all(
      tasks.map(async ([key, promise]) => {
        try {
          return [key, { status: "fulfilled", value: await promise }];
        } catch (error) {
          return [key, { status: "rejected", reason: error }];
        }
      }),
    );

    settled.forEach(([key, result]) => {
      if (key === "detail") applyDetailResult(itemId, result);
      if (key === "receipts") applyReceiptsResult(itemId, result);
      if (key === "supplies") applySuppliesResult(itemId, result);
    });
  };

  const openView = async (row) => {
    setSelected({
      id: row.id,
      name: row.name || "",
      itemCode: row.itemCode || "",
      status: row.status || "",
      detailReady: false,
      detailLoading: true,
      detailError: null,
      receipts: [],
      receiptsLoading: true,
      receiptsError: null,
      supplies: [],
      suppliesLoading: true,
      suppliesError: null,
    });
    await loadSelectedSections(row.id);
  };

  const refreshSelected = async (itemId) => {
    await loadSelectedSections(itemId);
  };

  const retryItemDetail = async () => {
    if (!selected?.id) return;
    await loadSelectedSections(selected.id, {
      detail: true,
      receipts: false,
      supplies: false,
    });
  };

  const retryReceipts = async () => {
    if (!selected?.id) return;
    await loadSelectedSections(selected.id, {
      detail: false,
      receipts: true,
      supplies: false,
    });
  };

  const retrySupplies = async () => {
    if (!selected?.id) return;
    await loadSelectedSections(selected.id, {
      detail: false,
      receipts: false,
      supplies: true,
    });
  };

  const handleSaveItem = async ({ type, mode = "new", payload }) => {
    if (type === "vehicle_part") {
      toast.info("Vehicle parts are not available on this API.");
      return;
    }
    if (mode === "existing") {
      await stockItem(payload.itemId, toStockBody(payload));
      toast.success("Stock received.");
    } else {
      const created = await createItem({
        name: payload.name.trim(),
        brand: payload.brand.trim(),
        unit: "pcs",
        description: payload.description?.trim() || null,
        photo: payload.photoFile || null,
      });
      await stockItem(created.id, toStockBody(payload));
      toast.success(`${created.name} added to inventory.`);
    }
    setAddOpen(false);
    setPage(0);
    onCreatedItemType?.("accessories");
    reload();
  };

  const handleUpdateDetails = async (payload) => {
    if (!selected) return;
    const updated = await updateItem(selected.id, {
      name: payload.name?.trim() || null,
      code: payload.code?.trim() || null,
      brand: payload.brand?.trim() || null,
      description: payload.description?.trim() || null,
      unit: payload.unit?.trim() || null,
      is_active: payload.isActive !== false,
    });
    let nextPhoto = updated.photo || selected.photo || "";
    if (payload.photoFile instanceof File) {
      const photoResult = await updateItemPhoto(selected.id, payload.photoFile);
      nextPhoto = photoResult.photo || nextPhoto;
    }
    await reload();
    await loadSelectedSections(selected.id);
    setSelected((prev) => {
      if (!prev || prev.id !== selected.id) return prev;
      return {
        ...prev,
        unit: updated.unit || prev.unit || payload.unit?.trim() || "",
        itemCode: updated.itemCode || prev.itemCode,
        isActive: updated.isActive,
        photo: nextPhoto || prev.photo,
      };
    });
  };

  const handleReceiveStock = async (payload) => {
    if (!selected) return;
    await stockItem(selected.id, toStockBody(payload));
    toast.success("Stock received.");
    await Promise.all([reload(), refreshSelected(selected.id)]);
  };

  const handleBulkReceipt = async ({ mode, inventoryType, shared, lines }) => {
    if (inventoryType === "vehicle_part") {
      toast.info("Vehicle parts are not available on this API.");
      return;
    }
    await stockItemsBulk({ mode, shared, lines });
    toast.success(
      `${lines.length} stock receipt${lines.length === 1 ? "" : "s"} recorded.`,
    );
    setAddOpen(false);
    setPage(0);
    onCreatedItemType?.("accessories");
    reload();
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

      <div className="card overflow-hidden relative min-h-[200px]">
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
              placeholder="Search by code, name, brand, or description…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
            />
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="inventoryStatusFilter" className={filterLabelClassName}>
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
                  {INVENTORY_STATUS_OPTIONS.map((option) => (
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
          <table className="w-full text-left min-w-[920px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider w-16">
                  Photo
                </th>
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
                  Status
                </th>
                <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading || loadError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-2">
                    <SectionLoadState
                      loading={loading}
                      error={loadError}
                      onRetry={reload}
                      loadingLabel="Loading inventory…"
                      errorTitle="Couldn’t load inventory"
                    />
                  </td>
                </tr>
              ) : pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[13px] text-slate-400">
                    No accessories found.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5">
                      <ItemPhotoThumb src={row.photo} name={row.name} />
                    </td>
                    <td className="px-6 py-3.5 text-[12px] font-bold text-slate-900 whitespace-nowrap">
                      {row.itemCode}
                    </td>
                    <td className="px-6 py-3.5 text-[12px] font-semibold capitalize text-slate-800">
                      {row.name}
                    </td>
                    <td className="px-6 py-3.5 text-[12px] text-slate-700">{row.brand}</td>
                    <td className="px-6 py-3.5 text-[12px] text-slate-600 max-w-[240px]">
                      <span className="line-clamp-2">{row.description || "—"}</span>
                    </td>
                    <td className="px-6 py-3.5 text-[12px] font-bold text-slate-800">
                      {row.quantity}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={cn(
                          STATUS_BADGE_CLASS,
                          "capitalize",
                          statusBadgeClass(row.status),
                        )}
                      >
                        {formatInventoryStatus(row.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <TableRowActions>
                        <TableViewAction title="View item" onClick={() => openView(row)} />
                      </TableRowActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && !loadError ? (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-start">
            <Pagination
              page={safePage}
              size={PAGE_SIZE}
              totalElements={totalElements}
              onPageChange={setPage}
              showWhenEmpty={false}
            />
          </div>
        ) : null}
      </div>

      <AccessoryDetailModal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        item={selected}
        variant="accessory"
        onReceiveStock={handleReceiveStock}
        onUpdateDetails={handleUpdateDetails}
        onRetryDetail={retryItemDetail}
        onRetryReceipts={retryReceipts}
        onRetrySupplies={retrySupplies}
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
