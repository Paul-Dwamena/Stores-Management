import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Package,
} from "lucide-react";
import Button from "../../../components/common/base/Button";
import SummaryStatCard from "../../../components/common/SummaryStatCard";
import SearchInput from "../../../components/common/fields/SearchInput";
import Pagination from "../../../components/common/Pagination";
import { TableRowActions, TableViewAction } from "../../../components/common/tableActions";
import SectionLoadState from "../../../components/common/SectionLoadState";
import { toast } from "../../../components/common/ToastNotification";
import { formatApiDateTime, sortNewestFirst } from "../../../utils/apiResponseHelpers";
import { listStores } from "../../../services/storesService";
import { getInventoryItem } from "../../../services/inventoryService";
import { rejectGeneralRequest } from "../../../services/generalRequestsService";
import {
  listPendingSupplyLines,
  listSupplyRequests,
  createSupplyRequest,
  approveSupplyRequest,
  getSupplyRequest,
  toRequisitionFromSupplyRequest,
} from "../../../services/supplyRequestsService";
import RaiseSupplyRequestModal from "./components/RaiseSupplyRequestModal";
import ApprovalRequestActionModal from "./components/ApprovalRequestActionModal";
import IssueItemActionModal from "./components/IssueItemActionModal";
import RequisitionDetailModal from "./components/RequisitionDetailModal";
import {
  getSupplyViewAction,
  supplyStatusKey,
} from "./utils/supplyStatus";
import { SupplyStatusBadge } from "./utils/SupplyStatusBadge";

const PAGE_SIZE = 10;

const ISSUE_API_NOT_READY = "Issuance API is not ready yet.";
const BATCH_API_NOT_READY = "Batch actions API is not ready yet.";

const SUPPLY_STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "PENDING_SUPPLY_REQUEST", label: "Pending supply request" },
  { value: "PENDING_SUPPLY_APPROVAL", label: "Pending supply approval" },
  { value: "PENDING_ISSUANCE", label: "Pending issuance" },
  { value: "SUPPLIED", label: "Supplied" },
  { value: "PARTIAL_SUPPLIED", label: "Partial supplied" },
  { value: "REJECTED", label: "Rejected" },
];

const PENDING_STATUSES = [
  "PENDING_SUPPLY_REQUEST",
  "PENDING_SUPPLY_APPROVAL",
  "PENDING_ISSUANCE",
  "PARTIAL_SUPPLIED",
];
const SUPPLIED_STATUSES = ["SUPPLIED", "PARTIAL_SUPPLIED"];

const filterLabelClassName =
  "text-[11px] font-medium text-slate-500 tracking-wider shrink-0";

const filterSelectClassName =
  "px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 outline-none focus:border-emerald-500 shrink-0";

const dateInputClassName =
  "min-w-0 w-[7.5rem] bg-transparent text-[12px] font-medium text-slate-700 outline-none cursor-pointer";

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
    <div className="flex items-center gap-2 shrink-0">
      <span className={filterLabelClassName}>Date :</span>
      <div className="flex w-[17.5rem] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
        <input
          id="supplyDateFrom"
          type="date"
          value={dateFrom}
          max={dateTo || undefined}
          onChange={onFromChange}
          onClick={openDatePicker}
          onFocus={openDatePicker}
          className={dateInputClassName}
          aria-label="From date"
        />
        <span className="text-[11px] text-slate-300 shrink-0">–</span>
        <input
          id="supplyDateTo"
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={onToChange}
          onClick={openDatePicker}
          onFocus={openDatePicker}
          className={dateInputClassName}
          aria-label="To date"
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

export default function PendingSuppliesList({ embedded = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [supplyRows, setSupplyRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeRow, setActiveRow] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [storeOptions, setStoreOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [pending, supplies] = await Promise.all([
        listPendingSupplyLines(),
        listSupplyRequests().catch(() => []),
      ]);
      setRows(sortNewestFirst(pending));
      setSupplyRows(sortNewestFirst(supplies, "createdAt"));
    } catch (err) {
      setLoadError(err.message || "Unable to load pending supply requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    let cancelled = false;
    listStores()
      .then((stores) => {
        if (!cancelled) {
          setLocationOptions(
            stores
              .filter((store) => store.isActive !== false)
              .map((store) => store.name)
              .filter(Boolean),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setLocationOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const supplyId = searchParams.get("supplyId");
    if (!supplyId) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("supplyId");
    setSearchParams(nextParams, { replace: true });

    getSupplyRequest(supplyId)
      .catch(async () => {
        const listed = await listSupplyRequests();
        return listed.find((row) => String(row.id) === String(supplyId)) || null;
      })
      .then((request) => {
        if (!request) {
          toast.error("Could not open that supply request.");
          return;
        }
        setActiveRow(toRequisitionFromSupplyRequest(request));
      })
      .catch((err) => {
        toast.error(err.message || "Could not open that supply request.");
      });
  }, [searchParams, setSearchParams]);

  const displayRows = useMemo(() => {
    const pending = rows.map((row) => ({
      ...row,
      listKey: `line-${row.id}`,
      source: "pending_line",
    }));
    const raised = supplyRows.map((request) => ({
      ...toRequisitionFromSupplyRequest(request),
      listKey: `supply-${request.id}`,
      source: "supply_request",
    }));
    return sortNewestFirst([...pending, ...raised], "createdAt");
  }, [rows, supplyRows]);

  const rowStoreNames = (row) => {
    if (Array.isArray(row.storeAllocations) && row.storeAllocations.length) {
      return row.storeAllocations.map((line) => line.location).filter(Boolean);
    }
    if (Array.isArray(row.items) && row.items.length) {
      return row.items.map((item) => item.storeName).filter(Boolean);
    }
    if (row.storeName) return [row.storeName];
    if (row.storeLocation) return [row.storeLocation];
    return [];
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return displayRows.filter((row) => {
      if (statusFilter !== "ALL" && supplyStatusKey(row.status) !== statusFilter) {
        return false;
      }
      if (locationFilter !== "ALL") {
        const stores = rowStoreNames(row);
        if (!stores.includes(locationFilter)) return false;
      }
      if (!matchesDateRange(row.createdAt, dateFrom, dateTo)) return false;
      if (!q) return true;
      return [
        row.requestNumber,
        row.itemName,
        row.itemCode,
        row.description,
        row.requesterName,
        row.reason,
        String(row.id),
        String(row.generalRequestId || ""),
        ...rowStoreNames(row),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [displayRows, searchQuery, statusFilter, locationFilter, dateFrom, dateTo]);

  const showRaiseSelection = statusFilter === "PENDING_SUPPLY_REQUEST";
  const showApprovalSelection = statusFilter === "PENDING_SUPPLY_APPROVAL";
  const showIssueSelection =
    statusFilter === "PENDING_ISSUANCE" || statusFilter === "PARTIAL_SUPPLIED";
  const showBulkSelection = showRaiseSelection || showApprovalSelection || showIssueSelection;
  const showLocationFilter =
    statusFilter === "ALL"
    || statusFilter === "PENDING_SUPPLY_APPROVAL"
    || statusFilter === "PENDING_ISSUANCE"
    || statusFilter === "PARTIAL_SUPPLIED"
    || statusFilter === "SUPPLIED";

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const selectedRows = useMemo(
    () =>
      displayRows.filter(
        (row) =>
          selectedIds.includes(row.listKey)
          && (statusFilter === "ALL" || supplyStatusKey(row.status) === statusFilter),
      ),
    [displayRows, selectedIds, statusFilter],
  );

  const allPagedSelected =
    showBulkSelection
    && pagedRows.length > 0
    && pagedRows.every((row) => selectedIds.includes(row.listKey));

  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, locationFilter, dateFrom, dateTo]);

  useEffect(() => {
    setSelectedIds([]);
  }, [statusFilter, locationFilter]);

  useEffect(() => {
    if (!showLocationFilter && locationFilter !== "ALL") {
      setLocationFilter("ALL");
    }
  }, [showLocationFilter, locationFilter]);

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  const stats = useMemo(() => {
    const pendingRaise = rows.filter(
      (row) => supplyStatusKey(row.status) === "PENDING_SUPPLY_REQUEST",
    ).length;
    const pending = pendingRaise + supplyRows.filter((row) =>
      PENDING_STATUSES.includes(supplyStatusKey(row.status)),
    ).length;
    const supplied = supplyRows.filter((row) =>
      SUPPLIED_STATUSES.includes(supplyStatusKey(row.status)),
    ).length;
    const rejected = supplyRows.filter((row) => supplyStatusKey(row.status) === "REJECTED").length;
    return [
      {
        label: "Accessory reqs",
        value: String(pendingRaise + supplyRows.length),
        icon: Package,
        tone: "teal",
      },
      { label: "Pending", value: String(pending), icon: Clock3, tone: "amber" },
      { label: "Supplied", value: String(supplied), icon: CheckCircle2, tone: "sky" },
      { label: "Rejected", value: String(rejected), icon: AlertTriangle, tone: "rose" },
    ];
  }, [rows, supplyRows]);

  const activeAction = activeRow ? getSupplyViewAction(activeRow.status) : null;
  const colSpan = 8 + (showBulkSelection ? 1 : 0);

  const toggleRowSelected = (listKey) => {
    setSelectedIds((prev) =>
      prev.includes(listKey) ? prev.filter((id) => id !== listKey) : [...prev, listKey],
    );
  };

  const toggleSelectAllPaged = () => {
    if (allPagedSelected) {
      const pageIds = new Set(pagedRows.map((row) => row.listKey));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
      return;
    }
    setSelectedIds((prev) => [
      ...new Set([...prev, ...pagedRows.map((row) => row.listKey)]),
    ]);
  };

  const notifyBatchNotReady = () => {
    toast.info(BATCH_API_NOT_READY);
  };

  const toStoreOptions = (stores = []) =>
    stores
      .filter((store) => store.isActive !== false)
      .map((store) => ({ id: store.id, name: store.name, quantity: store.quantity ?? null }));

  const openRow = async (row) => {
    const action = getSupplyViewAction(row.status);
    setStoreOptions([]);
    setActiveRow(row);
    setDetailLoading(true);
    setDetailError(null);

    try {
      if (row.source === "supply_request" && row.id) {
        const detail = await getSupplyRequest(row.id);
        setActiveRow({
          ...toRequisitionFromSupplyRequest(detail),
          listKey: row.listKey,
          source: row.source,
        });
      }

      if (action === "raise_supply_request") {
        let options = [];
        if (row.itemId) {
          const item = await getInventoryItem(row.itemId);
          const stocked = (item.stores || []).filter((store) => Number(store.quantity) > 0);
          options = stocked.length ? stocked : item.stores || [];
        }
        if (!options.length) {
          options = toStoreOptions(await listStores());
        }
        setStoreOptions(options);
      }
    } catch (err) {
      setDetailError(err.message || "Unable to load request details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeAction = () => {
    setActiveRow(null);
    setStoreOptions([]);
    setDetailLoading(false);
    setDetailError(null);
  };

  const retryActiveRow = () => {
    if (activeRow) openRow(activeRow);
  };

  const handleSendIssueOtp = () => {
    toast.info(ISSUE_API_NOT_READY);
    return null;
  };

  const handleConfirmIssue = () => {
    toast.info(ISSUE_API_NOT_READY);
  };

  const handleRaise = async (payload) => {
    if (!activeRow || saving) return;
    setSaving(true);
    try {
      await createSupplyRequest({
        general_request_id: activeRow.generalRequestId,
        comment: payload.comment,
        items: (payload.storeAllocations || []).map((line) => ({
          general_request_item_id: activeRow.generalRequestItemId,
          store_id: Number(line.storeId),
          quantity_requested: Number(line.quantity),
        })),
      });
      toast.success("Supply request submitted for approval.");
      closeAction();
      reload();
    } catch (err) {
      toast.error(err.message || "Could not raise supply request.");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (reason) => {
    if (!activeRow || saving) return;
    const rejectReason = String(reason || "").trim();
    if (!rejectReason) {
      toast.error("Enter a rejection reason.");
      return;
    }
    setSaving(true);
    try {
      await rejectGeneralRequest(activeRow.generalRequestId, rejectReason);
      toast.success("Request rejected.");
      closeAction();
      reload();
    } catch (err) {
      toast.error(err.message || "Could not reject request.");
    } finally {
      setSaving(false);
    }
  };

  const handleApprovalSubmit = async (payload) => {
    if (!activeRow || saving) return;
    setSaving(true);
    try {
      await approveSupplyRequest(activeRow.id, payload?.approvalComment);
      toast.success("Supply request approved. Ready for issuance.");
      closeAction();
      reload();
    } catch (err) {
      toast.error(err.message || "Could not approve supply request.");
    } finally {
      setSaving(false);
    }
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
            <div className="min-w-0 flex-1" />
            <div className="flex flex-nowrap items-center gap-2 shrink-0 py-2 ml-auto">
              {showRaiseSelection && selectedRows.length > 0 ? (
                <Button size="sm" onClick={notifyBatchNotReady}>
                  <ClipboardList size={16} />
                  Raise selected ({selectedRows.length})
                </Button>
              ) : null}
              {showApprovalSelection && selectedRows.length > 0 ? (
                <Button size="sm" onClick={notifyBatchNotReady}>
                  <CheckCircle2 size={16} />
                  Approve selected ({selectedRows.length})
                </Button>
              ) : null}
              {showIssueSelection && selectedRows.length > 0 ? (
                <Button size="sm" onClick={notifyBatchNotReady}>
                  <Package size={16} />
                  Issue selected ({selectedRows.length})
                </Button>
              ) : null}
            </div>
          </div>

          <div className="p-4 bg-slate-50/30 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput
              containerClassName="w-full max-w-sm shrink-0"
              placeholder="Search by request number, item, or requester…"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <div className="flex min-w-0 flex-nowrap items-center gap-3 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <DateRangeFilter
                dateFrom={dateFrom}
                dateTo={dateTo}
                onFromChange={(e) => setDateFrom(e.target.value)}
                onToChange={(e) => setDateTo(e.target.value)}
              />
              {showLocationFilter ? (
                <div className="flex items-center gap-2 shrink-0">
                  <label htmlFor="supplyLocationFilter" className={filterLabelClassName}>
                    Location :
                  </label>
                  <select
                    id="supplyLocationFilter"
                    value={locationFilter}
                    onChange={(event) => setLocationFilter(event.target.value)}
                    className={filterSelectClassName}
                  >
                    <option value="ALL">All locations</option>
                    {locationOptions.map((store) => (
                      <option key={store} value={store}>
                        {store}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="flex items-center gap-2 shrink-0">
                <label htmlFor="supplyStatusFilter" className={filterLabelClassName}>
                  Status :
                </label>
                <select
                  id="supplyStatusFilter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className={filterSelectClassName}
                >
                  {SUPPLY_STATUS_OPTIONS.map((option) => (
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
          <table className="w-full min-w-[1200px] text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {showBulkSelection ? (
                  <th className="px-4 py-2.5 w-10">
                    <input
                      type="checkbox"
                      checked={allPagedSelected}
                      onChange={toggleSelectAllPaged}
                      aria-label="Select all on page"
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                ) : null}
                <th className="px-6 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  Item code
                </th>
                <th className="px-6 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  Name
                </th>
                <th className="px-6 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  Description
                </th>
                <th className="px-6 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  Quantity
                </th>
                <th className="px-6 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  Date requested
                </th>
                <th className="px-6 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  Requested by
                </th>
                <th className="px-6 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  Status
                </th>
                <th className="px-6 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading || loadError ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-2">
                    <SectionLoadState
                      loading={loading}
                      error={loadError}
                      onRetry={reload}
                      loadingLabel="Loading supplies…"
                      errorTitle="Couldn’t load supplies"
                    />
                  </td>
                </tr>
              ) : pagedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={colSpan}
                    className="px-6 py-12 text-center text-[13px] text-slate-400"
                  >
                    No supply requests found.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <tr key={row.listKey} className="hover:bg-slate-50/50">
                    {showBulkSelection ? (
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.listKey)}
                          onChange={() => toggleRowSelected(row.listKey)}
                          aria-label={`Select ${row.requestNumber || row.itemCode}`}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                    ) : null}
                    <td className="px-6 py-3.5 font-mono text-[12px] text-slate-600 whitespace-nowrap">
                      {row.itemCode || "—"}
                    </td>
                    <td className="px-6 py-3.5 text-[12px] font-semibold text-slate-900">
                      {row.itemName || "—"}
                    </td>
                    <td className="px-6 py-3.5 text-[12px] text-slate-700 max-w-[280px]">
                      <span className="line-clamp-2">{row.description || "—"}</span>
                    </td>
                    <td className="px-6 py-3.5 text-[12px] font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                      {row.quantity ?? row.quantityRequested ?? "—"}
                    </td>
                    <td className="px-6 py-3.5 text-[12px] text-slate-600 whitespace-nowrap">
                      {formatApiDateTime(row.createdAt)}
                    </td>
                    <td className="px-6 py-3.5 text-[12px] text-slate-700 whitespace-nowrap">
                      {row.requesterName || row.requestedBy || "—"}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <SupplyStatusBadge status={row.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <TableRowActions>
                        <TableViewAction
                          title="View supply request"
                          onClick={() => openRow(row)}
                        />
                      </TableRowActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && !loadError ? (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
            <Pagination
              page={safePage}
              size={PAGE_SIZE}
              totalElements={filtered.length}
              onPageChange={setPage}
              showWhenEmpty={false}
            />
          </div>
        ) : null}
      </div>

      <RaiseSupplyRequestModal
        isOpen={activeAction === "raise_supply_request"}
        onClose={closeAction}
        requisition={activeRow}
        storeOptions={storeOptions}
        onSubmit={handleRaise}
        onReject={handleReject}
        loading={detailLoading}
        error={detailError}
        onRetry={retryActiveRow}
      />

      <ApprovalRequestActionModal
        isOpen={activeAction === "approval_request"}
        onClose={closeAction}
        requisition={activeRow}
        onSubmit={handleApprovalSubmit}
        onReject={handleReject}
        loading={detailLoading}
        error={detailError}
        onRetry={retryActiveRow}
      />

      <IssueItemActionModal
        isOpen={activeAction === "issue_item"}
        onClose={closeAction}
        requisition={activeRow}
        preferredStore={locationFilter !== "ALL" ? locationFilter : undefined}
        onSendOtp={handleSendIssueOtp}
        onConfirmIssue={handleConfirmIssue}
        onReject={handleReject}
        loading={detailLoading}
        error={detailError}
        onRetry={retryActiveRow}
      />

      <RequisitionDetailModal
        isOpen={activeAction === "view_details"}
        onClose={closeAction}
        requisition={activeRow}
        loading={detailLoading}
        error={detailError}
        onRetry={retryActiveRow}
      />
    </div>
  );
}
