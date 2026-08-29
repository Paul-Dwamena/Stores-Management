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
import { getInventoryItem, stockItem } from "../../../services/inventoryService";
import {
  rejectGeneralRequest,
  listGeneralRequests,
} from "../../../services/generalRequestsService";
import { listUsers } from "../../../services/usersService";
import { listRoles, findReceiverRole } from "../../../services/rolesService";
import { createIssuance } from "../../../services/issuancesService";
import {
  listPendingSupplyLines,
  listSupplyRequests,
  createSupplyRequest,
  approveSupplyRequest,
  rejectSupplyRequest,
  rejectPendingIssuance,
  getSupplyRequest,
  sendSupplyConfirmationOtp,
  toRequisitionFromSupplyRequest,
} from "../../../services/supplyRequestsService";
import { getSuppliesStats } from "../../../services/statsService";
import RaiseSupplyRequestModal, { buildIssueStoreOptions } from "./components/RaiseSupplyRequestModal";
import RegisterItemFromRequestModal from "./components/RegisterItemFromRequestModal";
import ReceiveIntoStoreModal from "../inventory/components/ReceiveIntoStoreModal";
import ApprovalRequestActionModal from "./components/ApprovalRequestActionModal";
import IssueItemActionModal from "./components/IssueItemActionModal";
import RequisitionDetailModal from "./components/RequisitionDetailModal";
import {
  getSupplyViewAction,
  supplyStatusKey,
} from "./utils/supplyStatus";
import { SupplyStatusBadge } from "./utils/SupplyStatusBadge";

const PAGE_SIZE = 10;

const BATCH_API_NOT_READY = "Batch actions API is not ready yet.";

const SUPPLY_STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "PENDING_SUPPLY_REQUEST", label: "Pending supply request" },
  { value: "PENDING_SUPPLY_APPROVAL", label: "Pending supply approval" },
  { value: "PENDING_ISSUANCE", label: "Pending issuance" },
  { value: "SUPPLIED", label: "Supplied" },
  { value: "PARTIALLY_SUPPLIED", label: "Partially supplied" },
  { value: "REJECTED", label: "Rejected" },
];

const filterLabelClassName =
  "text-[11px] font-medium text-slate-500 tracking-wider shrink-0";

const filterSelectClassName =
  "px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 shrink-0";

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

function raisedGeneralRequestItemIds(supplyRequests = []) {
  const ids = new Set();
  supplyRequests.forEach((request) => {
    (request.items || []).forEach((item) => {
      if (item.generalRequestItemId != null) {
        ids.add(Number(item.generalRequestItemId));
      }
    });
  });
  return ids;
}

function pendingLinesNotRaised(pendingLines = [], supplyRequests = []) {
  const raisedItemIds = raisedGeneralRequestItemIds(supplyRequests);
  return pendingLines.filter(
    (row) => !raisedItemIds.has(Number(row.generalRequestItemId ?? row.id)),
  );
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
  const [storeOptions, setStoreOptions] = useState(null);
  const [inventoryItem, setInventoryItem] = useState(null);
  const [receiveStockOpen, setReceiveStockOpen] = useState(false);
  const [registerItemOpen, setRegisterItemOpen] = useState(false);
  const [receiverOptions, setReceiverOptions] = useState([]);
  const [receiverRoleId, setReceiverRoleId] = useState(null);
  const [locationOptions, setLocationOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState([
    { label: "Accessory reqs", value: "0", icon: Package, tone: "teal" },
    { label: "Pending", value: "0", icon: Clock3, tone: "amber" },
    { label: "Supplied", value: "0", icon: CheckCircle2, tone: "sky" },
    { label: "Rejected", value: "0", icon: AlertTriangle, tone: "rose" },
  ]);

  const reload = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [pending, supplies, generalRequests, suppliesStats] = await Promise.all([
        listPendingSupplyLines(),
        listSupplyRequests().catch(() => []),
        listGeneralRequests().catch(() => []),
        getSuppliesStats().catch(() => null),
      ]);
      const requestNumberByGeneralId = Object.fromEntries(
        generalRequests.map((request) => [request.id, request.requestNumber]),
      );
      setRows(sortNewestFirst(pending));
      setSupplyRows(
        sortNewestFirst(
          supplies.map((request) => ({
            ...request,
            requestNumber: requestNumberByGeneralId[request.generalRequestId] || null,
          })),
          "createdAt",
        ),
      );
      if (suppliesStats) {
        setStats([
          {
            label: "Accessory reqs",
            value: String(suppliesStats.generalRequests),
            icon: Package,
            tone: "teal",
          },
          { label: "Pending", value: String(suppliesStats.pending), icon: Clock3, tone: "amber" },
          { label: "Supplied", value: String(suppliesStats.supplied), icon: CheckCircle2, tone: "sky" },
          { label: "Rejected", value: String(suppliesStats.rejected), icon: AlertTriangle, tone: "rose" },
        ]);
      }
      return { pending, supplies };
    } catch (err) {
      setLoadError(err.message || "Unable to load pending supply requests.");
      return { pending: [], supplies: [] };
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
    const pending = pendingLinesNotRaised(rows, supplyRows).map((row) => ({
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
    statusFilter === "PENDING_ISSUANCE" || statusFilter === "PARTIALLY_SUPPLIED";
  const showBulkSelection = showRaiseSelection || showApprovalSelection || showIssueSelection;
  const showLocationFilter =
    statusFilter === "ALL"
    || statusFilter === "PENDING_SUPPLY_APPROVAL"
    || statusFilter === "PENDING_ISSUANCE"
    || statusFilter === "PARTIALLY_SUPPLIED"
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

  const activeAction = activeRow ? getSupplyViewAction(activeRow.status) : null;

  const raiseBlockReason = useMemo(() => {
    if (activeAction !== "raise_supply_request" || !activeRow || detailLoading || detailError) {
      return null;
    }
    if (!activeRow.itemId) return "unregistered";
    if (!storeOptions?.some((store) => Number(store.quantity) > 0)) return "out_of_stock";
    return null;
  }, [activeAction, activeRow, detailLoading, detailError, storeOptions]);

  const handleItemRegistered = async (result) => {
    setRegisterItemOpen(false);
    const { pending } = await reload();
    if (!activeRow) return;

    const generalRequestItemId =
      result.generalRequestItemId ?? activeRow.generalRequestItemId ?? activeRow.id;
    const refreshed = pending.find(
      (row) =>
        Number(row.generalRequestItemId ?? row.id) === Number(generalRequestItemId),
    );

    const updatedRow = refreshed
      ? {
          ...refreshed,
          listKey: activeRow.listKey || `line-${refreshed.id}`,
          source: activeRow.source || "pending_line",
        }
      : {
          ...activeRow,
          itemId: result.itemId,
          generalRequestItemId,
        };

    await openRow(updatedRow);
  };

  const handleReceiveStock = async (payload) => {
    if (!inventoryItem?.id) return;
    await stockItem(inventoryItem.id, payload);
    toast.success("Stock received.");
    setReceiveStockOpen(false);
    if (activeRow) {
      await openRow({ ...activeRow, itemId: inventoryItem.id });
    }
  };
  const colSpan = 9 + (showBulkSelection ? 1 : 0);

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


  const openRow = async (row) => {
    const action = getSupplyViewAction(row.status);
    setStoreOptions(null);
    setInventoryItem(null);
    setReceiverOptions([]);
    setReceiverRoleId(null);
    setActiveRow(row);
    setDetailLoading(true);
    setDetailError(null);

    let workingRow = row;

    try {
      if (row.source === "supply_request" && row.id) {
        const detail = await getSupplyRequest(row.id);
        workingRow = {
          ...toRequisitionFromSupplyRequest(detail),
          listKey: row.listKey,
          source: row.source,
        };
        setActiveRow(workingRow);
      }

      if (action === "raise_supply_request") {
        if (workingRow.itemId) {
          const item = await getInventoryItem(workingRow.itemId);
          setInventoryItem(item);
          workingRow = {
            ...workingRow,
            itemName: item.name || workingRow.itemName,
            itemCode: item.itemCode || workingRow.itemCode,
            description: item.description || workingRow.description,
          };
          setActiveRow(workingRow);
          const stocked = (item.stores || []).filter((store) => Number(store.quantity) > 0);
          setStoreOptions(
            stocked.map((store) => ({
              id: store.id,
              name: store.name,
              quantity: store.quantity,
            })),
          );
        } else {
          setStoreOptions([]);
        }
      }

      if (action === "issue_item") {
        const inventoryPromise = workingRow.itemId
          ? getInventoryItem(workingRow.itemId).catch(() => null)
          : Promise.resolve(null);
        const [users, roles, item] = await Promise.all([
          listUsers().catch(() => []),
          listRoles(),
          inventoryPromise,
        ]);
        const receiverRole = findReceiverRole(roles);
        setReceiverRoleId(receiverRole?.id ?? null);
        setReceiverOptions(
          users
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
        setInventoryItem(item);
        setStoreOptions(buildIssueStoreOptions(workingRow, item));
      }
    } catch (err) {
      setDetailError(err.message || "Unable to load request details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeAction = () => {
    setActiveRow(null);
    setStoreOptions(null);
    setInventoryItem(null);
    setReceiveStockOpen(false);
    setRegisterItemOpen(false);
    setReceiverOptions([]);
    setReceiverRoleId(null);
    setDetailLoading(false);
    setDetailError(null);
  };

  const retryActiveRow = () => {
    if (activeRow) openRow(activeRow);
  };

  const ensureReceiverRoleId = async () => {
    const roles = await listRoles();
    const receiverRole = findReceiverRole(roles);
    if (!receiverRole) {
      const names = roles.map((role) => role.name || role.label).filter(Boolean).join(", ");
      throw new Error(
        names
          ? `No Receiver role found among: ${names}. Rename a role to “Receiver” or create one in Setups.`
          : "No Receiver role found. Create a role named Receiver in Setups first.",
      );
    }
    setReceiverRoleId(receiverRole.id);
    return receiverRole.id;
  };

  const handleSendIssueOtp = async ({ receiverId, suppliedTo }) => {
    const receiver = receiverOptions.find(
      (person) =>
        Number(person.id) === Number(receiverId)
        || person.name === String(suppliedTo || "").trim(),
    );
    const phone = receiver?.phone?.trim();
    if (!phone) {
      throw new Error("The selected receiver needs a phone number before an OTP can be sent.");
    }
    await sendSupplyConfirmationOtp(phone);
  };

  const handleConfirmIssue = async (payload) => {
    if (!activeRow || saving) return;
    const supplyRequestId = activeRow.id;
    const supplyRequestItemId =
      payload?.supplyRequestItemId
      ?? (() => {
        const storeId = payload?.storeId;
        const allocation = (activeRow.storeAllocations || []).find(
          (row) => Number(row.storeId) === Number(storeId),
        );
        if (allocation?.supplyRequestItemId != null) return allocation.supplyRequestItemId;
        const item = (activeRow.items || []).find(
          (row) => Number(row.storeId) === Number(storeId),
        );
        if (item?.supplyRequestItemId != null) return item.supplyRequestItemId;
        if (item?.id != null) return item.id;
        const items = activeRow.items || [];
        return items.length === 1 ? items[0]?.supplyRequestItemId ?? items[0]?.id ?? null : null;
      })();
    const storeId = payload?.storeId;
    const receiverId = payload?.receiverId;
    const quantity = Number(payload?.quantity);

    if (!supplyRequestId) {
      toast.error("Missing supply request id.");
      return;
    }
    if (!supplyRequestItemId) {
      toast.error("Missing supply request line for the selected store.");
      return;
    }
    if (!storeId) {
      toast.error("Select a store with a valid store id.");
      return;
    }
    if (!receiverId) {
      toast.error("Select a receiver.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Enter a valid quantity to issue.");
      return;
    }

    setSaving(true);
    try {
      await createIssuance({
        supply_request_id: supplyRequestId,
        supply_request_item_id: supplyRequestItemId,
        store_id: storeId,
        quantity_issued: quantity,
        comment: payload?.comment || null,
        reciever_id: receiverId,
      });
      toast.success("Item issued successfully.");
      closeAction();
      reload();
    } catch (err) {
      toast.error(err.message || "Could not issue item.");
    } finally {
      setSaving(false);
    }
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
      const status = supplyStatusKey(activeRow.status);
      if (status === "PENDING_SUPPLY_REQUEST") {
        const requestItemId = activeRow.generalRequestItemId ?? activeRow.id;
        if (requestItemId == null) {
          toast.error("Missing request item for rejection.");
          return;
        }
        await rejectGeneralRequest(
          activeRow.generalRequestId,
          rejectReason,
          requestItemId,
        );
      } else if (status === "PENDING_SUPPLY_APPROVAL") {
        await rejectSupplyRequest(activeRow.id, rejectReason);
      } else if (status === "PENDING_ISSUANCE" || status === "PARTIALLY_SUPPLIED") {
        await rejectPendingIssuance(activeRow.id, rejectReason);
      } else {
        toast.error("This item cannot be rejected from its current status.");
        return;
      }
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
                      className="rounded border-slate-300 text-primary focus:ring-slate-900/25"
                    />
                  </th>
                ) : null}
                <th className="px-6 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  Request #
                </th>
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
                          className="rounded border-slate-300 text-primary focus:ring-slate-900/25"
                        />
                      </td>
                    ) : null}
                    <td className="px-6 py-3.5 font-mono text-[12px] font-semibold text-slate-800 whitespace-nowrap">
                      {row.requestNumber || "—"}
                    </td>
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
        raiseBlockReason={raiseBlockReason}
        onReceiveStock={() => setReceiveStockOpen(true)}
        onRegisterItem={() => setRegisterItemOpen(true)}
        onSubmit={handleRaise}
        onReject={handleReject}
        loading={detailLoading}
        saving={saving}
        error={detailError}
        onRetry={retryActiveRow}
      />

      <RegisterItemFromRequestModal
        isOpen={registerItemOpen}
        onClose={() => setRegisterItemOpen(false)}
        requisition={activeRow}
        onRegistered={handleItemRegistered}
      />

      <ReceiveIntoStoreModal
        isOpen={receiveStockOpen}
        onClose={() => setReceiveStockOpen(false)}
        item={
          inventoryItem
            ? {
                id: inventoryItem.id,
                name: inventoryItem.name,
                itemCode: inventoryItem.itemCode,
              }
            : null
        }
        onSave={handleReceiveStock}
      />

      <ApprovalRequestActionModal
        isOpen={activeAction === "approval_request"}
        onClose={closeAction}
        requisition={activeRow}
        onSubmit={handleApprovalSubmit}
        onReject={handleReject}
        loading={detailLoading}
        saving={saving}
        error={detailError}
        onRetry={retryActiveRow}
      />

      <IssueItemActionModal
        isOpen={activeAction === "issue_item"}
        onClose={closeAction}
        requisition={activeRow}
        storeOptions={storeOptions}
        preferredStore={locationFilter !== "ALL" ? locationFilter : undefined}
        receivers={receiverOptions}
        receiverRoleId={receiverRoleId}
        onEnsureReceiverRole={ensureReceiverRoleId}
        onReceiverCreated={(user) => {
          if (!user?.id) return;
          setReceiverOptions((prev) => {
            if (prev.some((row) => Number(row.id) === Number(user.id))) return prev;
            return [
              ...prev,
              {
                id: user.id,
                name: user.name,
                role: "Receiver",
                phone: user.phone || "",
                firstName: user.firstName,
                lastName: user.lastName,
              },
            ];
          });
        }}
        onSendOtp={handleSendIssueOtp}
        onConfirmIssue={handleConfirmIssue}
        onReject={handleReject}
        loading={detailLoading}
        saving={saving}
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
