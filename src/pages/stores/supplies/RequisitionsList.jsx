import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Package,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import Button from "../../../components/common/base/Button";
import SummaryStatCard from "../../../components/common/SummaryStatCard";
import SearchInput from "../../../components/common/fields/SearchInput";
import Pagination from "../../../components/common/Pagination";
import { TableRowActions, TableViewAction } from "../../../components/common/tableActions";
import { toast } from "../../../components/common/ToastNotification";
import {
  REQUISITION_KIND_TABS,
  REQUISITION_STATUS_OPTIONS,
  getStoreLocationOptions,
  approveRequisitionBatch,
  advanceRequisition,
  formatRequisitionDate,
  formatRequisitionStatus,
  getRequisitions,
  getRequisitionByRef,
  ensureRequisitionForStoreRequest,
  getRequisitionDisplayRows,
  getRequisitionRemainingQuantity,
  createIssuanceBatchId,
  isRequisitionIssuable,
  raiseRequisitionBatch,
  rejectRequisition,
} from "../../../mockdata/stores";
import { getRequests } from "../../../mockdata/requests";
import {
  ApprovalRequestActionModal,
  BatchApprovalRequestActionModal,
  BatchIssueItemActionModal,
  BatchRaiseSupplyRequestModal,
  IssueItemActionModal,
  RaiseSupplyRequestModal,
  RequisitionDetailModal,
} from "./components";
import { getRequisitionStoreAllocations, getRequisitionStoreIssueLines, getStoreIssueRemaining, getStoresWithRemainingQty } from "./components/RaiseSupplyRequestModal";

const PAGE_SIZE = 10;

const filterLabelClassName =
  "text-[11px] font-medium text-slate-500 tracking-wider shrink-0";

const filterSelectClassName =
  "px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 outline-none focus:border-emerald-500";

function statusBadgeClass(status) {
  switch (status) {
    case "PENDING_SUPPLY_REQUEST":
      return "bg-gray-100 text-gray-700 border-gray-300";
    case "PENDING_SUPPLY_APPROVAL":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "PENDING_ISSUANCE":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "SUPPLIED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PARTIAL_SUPPLIED":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "REJECTED":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function getVehiclePartName(row) {
  return (
    row.itemName
    || row.level6
    || row.level5
    || row.level4
    || row.level3
    || row.level2
    || row.level1
    || "—"
  );
}

function getActionConfig(status, row) {
  if (status === "PENDING_SUPPLY_REQUEST") {
    return { action: "raise_supply_request" };
  }
  if (status === "PENDING_SUPPLY_APPROVAL") {
    return { action: "approval_request" };
  }
  if (isRequisitionIssuable(row) || status === "PENDING_ISSUANCE" || status === "PARTIAL_SUPPLIED") {
    return { action: "issue_item" };
  }
  return { action: "view_details" };
}

export default function RequisitionsList({
  embedded = false,
  tabsSlot = null,
  view = "accessories",
}) {
  const isVehicleParts = view === "vehicle_parts";
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState(() => getRequisitions());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [activeAction, setActiveAction] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchApprovalOpen, setBatchApprovalOpen] = useState(false);
  const [batchRaiseOpen, setBatchRaiseOpen] = useState(false);
  const [batchIssueOpen, setBatchIssueOpen] = useState(false);

  useEffect(() => {
    setPage(0);
    setSearchQuery("");
    setStatusFilter("ALL");
    setLocationFilter("ALL");
    setActiveAction(null);
    setSelectedIds([]);
    setBatchApprovalOpen(false);
    setBatchRaiseOpen(false);
    setBatchIssueOpen(false);
  }, [view]);

  useEffect(() => {
    const raiseRef = searchParams.get("raise");
    if (!raiseRef) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("raise");
    setSearchParams(nextParams, { replace: true });

    const navState = location.state || {};
    const sourceRequest = getRequests().find((row) =>
      row.id === navState.sourceRequestId
      || row.requestNumber === navState.approvalRequestNumber
      || row.id === raiseRef
      || row.requestNumber === raiseRef
      || row.storesDetails?.requisitionId === raiseRef
      || row.storesDetails?.requestNumber === raiseRef,
    );
    const details = {
      ...(sourceRequest?.storesDetails || {}),
      ...(navState.raiseStoresDetails || {}),
    };

    let match =
      getRequisitionByRef(raiseRef)
      || getRequisitionByRef(details.requisitionId)
      || getRequisitionByRef(details.requestNumber);

    if (!match && (details.itemCode || details.itemName || details.requisitionId)) {
      match = ensureRequisitionForStoreRequest({
        ...details,
        requestedBy: sourceRequest?.requestedBy || details.requestedBy,
      });
      setRows(getRequisitions());
    }

    if (!match) {
      toast.error("Could not find that supply request in Stores.");
      return;
    }

    setActiveAction({
      row: match,
      config:
        match.status === "PENDING_SUPPLY_REQUEST"
          ? { action: "raise_supply_request" }
          : getActionConfig(match.status, match),
    });
  }, [searchParams, setSearchParams, location.state]);

  useEffect(() => {
    setSelectedIds([]);
    setLocationFilter("ALL");
    setBatchApprovalOpen(false);
    setBatchRaiseOpen(false);
    setBatchIssueOpen(false);
  }, [statusFilter]);

  const displayRows = getRequisitionDisplayRows();

  const kindRows = useMemo(
    () => displayRows.filter((row) => row.kind === (isVehicleParts ? "vehicle_parts" : "accessories")),
    [displayRows, isVehicleParts],
  );

  const activeRequisition = useMemo(() => {
    if (!activeAction?.row?.id) return null;
    return rows.find((row) => row.id === activeAction.row.id) || activeAction.row;
  }, [rows, displayRows, activeAction]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return kindRows.filter((row) => {
      if (statusFilter !== "ALL" && row.status !== statusFilter) return false;
      if (
        (statusFilter === "PENDING_ISSUANCE" || statusFilter === "PARTIAL_SUPPLIED")
        && locationFilter !== "ALL"
        && !getStoresWithRemainingQty(row).includes(locationFilter)
      ) {
        return false;
      }
      if (!q) return true;
      return [
        row.requestNumber,
        row.itemCode,
        row.itemName,
        row.brand,
        row.description,
        row.componentPath,
        row.requestedBy,
        row.make,
        row.model,
        row.approvedBy,
        row.suppliedTo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [kindRows, searchQuery, statusFilter, locationFilter]);

  const showSuppliedMeta =
    statusFilter === "SUPPLIED" || statusFilter === "PARTIAL_SUPPLIED";

  const showPartialMeta = statusFilter === "PARTIAL_SUPPLIED";

  const showActionsColumn = true;

  const showRaiseSelection = statusFilter === "PENDING_SUPPLY_REQUEST";
  const showApprovalSelection = statusFilter === "PENDING_SUPPLY_APPROVAL";
  const showIssueSelection =
    statusFilter === "PENDING_ISSUANCE" || statusFilter === "PARTIAL_SUPPLIED";
  const showIssuanceStore =
    statusFilter === "PENDING_ISSUANCE" || statusFilter === "PARTIAL_SUPPLIED";
  const showBulkSelection = showRaiseSelection || showApprovalSelection || showIssueSelection;
  const showReceiverColumn = false;

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const selectedRows = useMemo(
    () => rows.filter((row) => {
      if (!selectedIds.includes(row.id) || row.status !== statusFilter) return false;
      if (
        showIssuanceStore
        && locationFilter !== "ALL"
        && !getStoresWithRemainingQty(row).includes(locationFilter)
      ) {
        return false;
      }
      return true;
    }),
    [rows, selectedIds, statusFilter, locationFilter, showIssuanceStore],
  );

  const issuanceStoreOptions = getStoreLocationOptions();

  const allPagedSelected =
    showBulkSelection
    && pagedRows.length > 0
    && pagedRows.every((row) => selectedIds.includes(row.id));

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  const stats = useMemo(() => {
    const pending = kindRows.filter((row) =>
      [
        "PENDING_SUPPLY_REQUEST",
        "PENDING_SUPPLY_APPROVAL",
        "PENDING_ISSUANCE",
        "PARTIAL_SUPPLIED",
      ].includes(
        row.status,
      ),
    ).length;
    const supplied = kindRows.filter((row) =>
      ["SUPPLIED", "PARTIAL_SUPPLIED"].includes(row.status),
    ).length;
    const rejected = kindRows.filter((row) => row.status === "REJECTED").length;
    return [
      {
        label: isVehicleParts ? "Vehicle part reqs" : "Accessory reqs",
        value: String(kindRows.length),
        icon: isVehicleParts ? ClipboardList : Package,
        tone: "teal",
      },
      { label: "Pending", value: String(pending), icon: Clock3, tone: "amber" },
      { label: "Supplied", value: String(supplied), icon: CheckCircle2, tone: "sky" },
      { label: "Rejected", value: String(rejected), icon: AlertTriangle, tone: "rose" },
    ];
  }, [kindRows, isVehicleParts]);

  const colSpan =
    6
    + (showBulkSelection ? 1 : 0)
    + (showApprovalSelection ? 2 : 0)
    + (showIssuanceStore ? 1 : 0)
    + (showReceiverColumn ? 1 : 0)
    + (showSuppliedMeta ? 3 : 0)
    + (showPartialMeta ? 2 : 0)
    + (showActionsColumn ? 1 : 0)
    + 1;

  const toggleRowSelected = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  };

  const toggleSelectAllPaged = () => {
    if (allPagedSelected) {
      const pageIds = new Set(pagedRows.map((row) => row.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
      return;
    }
    setSelectedIds((prev) => [
      ...new Set([...prev, ...pagedRows.map((row) => row.id)]),
    ]);
  };

  const refreshRows = () => setRows(getRequisitions());

  const closeAction = () => setActiveAction(null);

  const handleReject = (reason, type = "entire") => {
    if (!activeAction?.row) return;
    try {
      rejectRequisition(activeAction.row.id, reason, { type });
      refreshRows();
      closeAction();
      toast.success(
        type === "store_change"
          ? "Sent back for store change. Raise the supply request again."
          : activeAction.row.status === "PARTIAL_SUPPLIED"
            ? "Remaining quantity rejected. Already supplied items stay recorded."
            : "Requisition rejected.",
      );
    } catch (error) {
      toast.error(error.message ?? "Could not reject requisition.");
    }
  };

  const handleBatchConfirmIssue = ({ otp, ids = [], storeLocation, suppliedTo, quantities = {} }) => {
    try {
      const batchId = ids.length > 1 ? createIssuanceBatchId() : null;
      ids.forEach((id) => {
        const row = rows.find((item) => item.id === id);
        const quantity = Number(quantities[id]) || getStoreIssueRemaining(row, storeLocation);
        advanceRequisition(id, "issue_item", { otp, storeLocation, suppliedTo, quantity, batchId });
      });
      refreshRows();
      setSelectedIds((prev) => {
        const issued = new Set(ids);
        const remaining = prev.filter((id) => !issued.has(id));
        if (remaining.length === 0) setBatchIssueOpen(false);
        return remaining;
      });
      toast.success(
        batchId
          ? `${ids.length} items issued as batch ${batchId}.`
          : "Item issued. Continue with any remaining items or close the modal.",
      );
    } catch (error) {
      toast.error(error.message ?? "Could not issue items.");
    }
  };

  const handleBatchReject = (reason, ids = [], type = "entire") => {
    try {
      ids.forEach((id) => rejectRequisition(id, reason, { type }));
      refreshRows();
      setSelectedIds((prev) => {
        const rejected = new Set(ids);
        const remaining = prev.filter((id) => !rejected.has(id));
        if (remaining.length === 0) setBatchIssueOpen(false);
        return remaining;
      });
      toast.success(
        type === "store_change"
          ? `${ids.length} item(s) sent back for store change.`
          : `${ids.length} requisition(s) rejected.`,
      );
    } catch (error) {
      toast.error(error.message ?? "Could not reject requisitions.");
    }
  };

  const handleRaiseSubmit = (payload) => {
    if (!activeAction?.row) return;
    try {
      const raisedId = activeAction.row.id;
      advanceRequisition(raisedId, "raise_supply_request", payload);
      refreshRows();
      setSelectedIds((prev) => prev.filter((id) => id !== raisedId));
      closeAction();
      toast.success("Supply request submitted for approval.");
    } catch (error) {
      toast.error(error.message ?? "Could not submit supply request.");
    }
  };

  const handleApprovalSubmit = (payload) => {
    if (!activeAction?.row) return;
    try {
      const approvedId = activeAction.row.id;
      advanceRequisition(approvedId, "approval_request", payload);
      refreshRows();
      setSelectedIds((prev) => prev.filter((id) => id !== approvedId));
      closeAction();
      toast.success("Supply request approved. Ready for issuance.");
    } catch (error) {
      toast.error(error.message ?? "Could not approve supply request.");
    }
  };

  const handleSendIssueOtp = (payload = {}) => {
    if (!activeAction?.row) return null;
    const updated = advanceRequisition(activeAction.row.id, "send_issue_otp", payload);
    refreshRows();
    return updated;
  };

  const handleConfirmIssue = (payload) => {
    if (!activeAction?.row) return;
    try {
      const updated = advanceRequisition(activeAction.row.id, "issue_item", payload);
      refreshRows();
      closeAction();
      const remaining = getRequisitionRemainingQuantity(updated);
      toast.success(
        remaining > 0
          ? `Issued ${payload.quantity}. ${remaining} remaining until issued or rejected.`
          : "Item issued. Supply process completed.",
      );
    } catch (error) {
      toast.error(error.message ?? "Could not issue item.");
    }
  };

  const openBatchOrSingleRaise = () => {
    if (selectedRows.length === 0) {
      toast.warning("Select at least one request to raise.");
      return;
    }
    if (selectedRows.length === 1) {
      setActiveAction({
        row: selectedRows[0],
        config: getActionConfig("PENDING_SUPPLY_REQUEST"),
      });
      return;
    }
    setBatchRaiseOpen(true);
  };

  const openBatchOrSingleIssue = () => {
    if (selectedRows.length === 0) {
      toast.warning("Select at least one item to issue.");
      return;
    }
    if (selectedRows.length === 1) {
      setActiveAction({
        row: selectedRows[0],
        config: getActionConfig(selectedRows[0].status, selectedRows[0]),
      });
      return;
    }
    if (selectedRows.length > 1) {
      const issueStore = locationFilter !== "ALL"
        ? locationFilter
        : [...new Set(selectedRows.flatMap((row) => getStoresWithRemainingQty(row)))];
      const resolvedStore = Array.isArray(issueStore) ? (issueStore.length === 1 ? issueStore[0] : "") : issueStore;
      if (!resolvedStore) {
        toast.warning(
          "You selected items from more than one store. Filter to a single location to issue them together.",
        );
        return;
      }
      if (selectedRows.some((row) => getStoreIssueRemaining(row, resolvedStore) <= 0)) {
        toast.warning("Some selected items have nothing left to issue from this store.");
        return;
      }
    }
    setBatchIssueOpen(true);
  };

  const openBatchOrSingleApproval = () => {
    if (selectedRows.length === 0) {
      toast.warning("Select at least one request to approve.");
      return;
    }
    if (selectedRows.length === 1) {
      setActiveAction({
        row: selectedRows[0],
        config: getActionConfig("PENDING_SUPPLY_APPROVAL"),
      });
      return;
    }
    setBatchApprovalOpen(true);
  };

  const handleBatchRaise = ({ requests = [] }) => {
    try {
      raiseRequisitionBatch(requests);
      refreshRows();
      setSelectedIds([]);
      setBatchRaiseOpen(false);
      toast.success(`${requests.length} supply requests submitted for approval.`);
    } catch (error) {
      toast.error(error.message ?? "Could not submit selected supply requests.");
    }
  };

  const handleBatchApproval = ({ requests = [] }) => {
    try {
      approveRequisitionBatch(requests);
      refreshRows();
      setSelectedIds([]);
      setBatchApprovalOpen(false);
      toast.success(`${requests.length} supply request${requests.length === 1 ? "" : "s"} approved. Ready for issuance.`);
    } catch (error) {
      toast.error(error.message ?? "Could not approve selected supply requests.");
    }
  };

  const handleBatchSendOtp = (ids = [], payload = {}) => {
    ids.forEach((id) => advanceRequisition(id, "send_issue_otp", payload));
    refreshRows();
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
            <div className="min-w-0 flex-1">
              {tabsSlot}
            </div>
            <div className="flex flex-nowrap items-center gap-2 shrink-0 py-2 ml-auto">
              {showRaiseSelection && selectedRows.length > 0 ? (
                <Button size="sm" onClick={openBatchOrSingleRaise}>
                  <ClipboardList size={16} />
                  Raise selected ({selectedRows.length})
                </Button>
              ) : null}
              {showApprovalSelection && selectedRows.length > 0 ? (
                <Button size="sm" onClick={openBatchOrSingleApproval}>
                  <CheckCircle2 size={16} />
                  Approve selected ({selectedRows.length})
                </Button>
              ) : null}
              {showIssueSelection && selectedRows.length > 0 ? (
                <Button size="sm" onClick={openBatchOrSingleIssue}>
                  <Package size={16} />
                  Issue selected ({selectedRows.length})
                </Button>
              ) : null}
            </div>
          </div>

          <div className="p-4 bg-slate-50/30 flex flex-col xl:flex-row justify-between gap-4">
            <SearchInput
              placeholder={
                showBulkSelection
                  ? "Search by person, code, or request #…"
                  : isVehicleParts
                    ? "Search by code, component, or requester…"
                    : "Search by code, name, or requester…"
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
            />
            <div className="flex flex-wrap items-center gap-3">
              {showIssuanceStore ? (
                <div className="flex items-center gap-2">
                  <label htmlFor="requisitionLocationFilter" className={filterLabelClassName}>
                    Location :
                  </label>
                  <select
                    id="requisitionLocationFilter"
                    value={locationFilter}
                    onChange={(e) => {
                      setLocationFilter(e.target.value);
                      setPage(0);
                    }}
                    className={filterSelectClassName}
                  >
                    <option value="ALL">All locations</option>
                    {issuanceStoreOptions.map((store) => (
                      <option key={store} value={store}>
                        {store}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <label htmlFor="requisitionStatusFilter" className={filterLabelClassName}>
                  Status :
                </label>
                <select
                  id="requisitionStatusFilter"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                  className={filterSelectClassName}
                >
                  {REQUISITION_STATUS_OPTIONS.map((option) => (
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
          <table
            className={cn(
              "w-full text-left",
              showSuppliedMeta || showPartialMeta || showApprovalSelection || showIssuanceStore
                ? "min-w-[1500px]"
                : "min-w-[1200px]",
            )}
          >
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {showBulkSelection && (
                  <th className="px-4 py-2.5 w-10">
                    <input
                      type="checkbox"
                      checked={allPagedSelected}
                      onChange={toggleSelectAllPaged}
                      aria-label="Select all on page"
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                )}
                <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                  Item code
                </th>
                <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[180px]">
                  Name
                </th>
                <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[280px]">
                  Description
                </th>
                <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[90px]">
                  Quantity
                </th>
                <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[130px]">
                  Date requested
                </th>
                <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[140px]">
                  Requested by
                </th>
                {showApprovalSelection && (
                  <>
                    <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[220px]">
                      Store
                    </th>
                    <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[130px]">
                      Qty from store
                    </th>
                  </>
                )}
                {showIssuanceStore && (
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[220px]">
                    Store
                  </th>
                )}
                {showReceiverColumn && (
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[140px]">
                    Supply to
                  </th>
                )}
                {showSuppliedMeta && (
                  <>
                    <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[130px]">
                      Approved by
                    </th>
                    <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[130px]">
                      Approval date
                    </th>
                    <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[140px]">
                      Supplied to
                    </th>
                  </>
                )}
                {showPartialMeta && (
                  <>
                    <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[110px]">
                      Qty supplied
                    </th>
                    <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                      Qty remaining
                    </th>
                  </>
                )}
                <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[170px]">
                  Status
                </th>
                {showActionsColumn && (
                  <th className="px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-right min-w-[160px]">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pagedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={colSpan}
                    className="px-6 py-12 text-center text-[13px] text-slate-400"
                  >
                    No requisitions found.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => {
                  const displayName = isVehicleParts
                    ? getVehiclePartName(row)
                    : (row.itemName || "—");
                  const description = isVehicleParts
                    ? row.componentPath || row.description || "—"
                    : (row.description || "—");
                  const storeAllocations = showApprovalSelection
                    ? getRequisitionStoreAllocations(row)
                    : [];
                  const issueLines = showIssuanceStore
                    ? getRequisitionStoreIssueLines(row).filter((line) => line.remaining > 0)
                    : [];

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50 align-middle">
                      {showBulkSelection && (
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.id)}
                            onChange={() => toggleRowSelected(row.id)}
                            disabled={showIssueSelection && !isRequisitionIssuable(row)}
                            aria-label={`Select ${row.requestNumber || row.itemCode}`}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-40"
                          />
                        </td>
                      )}
                      <td className="px-6 py-3.5 text-[12px] font-bold text-slate-900 whitespace-nowrap">
                        {row.itemCode || "—"}
                      </td>
                      <td className="px-6 py-3.5 text-[12px] font-semibold text-slate-800 min-w-[180px]">
                        <span className="inline-flex items-center gap-1.5 flex-wrap">
                          {displayName}
                          {row.isOther ? (
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold border bg-violet-50 text-violet-700 border-violet-200 whitespace-nowrap">
                              Other
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-[12px] text-slate-600 min-w-[280px] max-w-[360px]">
                        <span className="line-clamp-2">{description}</span>
                      </td>
                      <td className="px-6 py-3.5 text-[12px] font-bold text-slate-800 whitespace-nowrap">
                        {row.quantity}
                      </td>
                      <td className="px-6 py-3.5 text-[12px] text-slate-600 whitespace-nowrap">
                        {formatRequisitionDate(row.createdAt)}
                      </td>
                      <td className="px-6 py-3.5 text-[12px] text-slate-700 whitespace-nowrap">
                        {row.requestedBy}
                      </td>
                      {showApprovalSelection && (
                        <>
                          <td className="px-6 py-3.5 text-[12px] text-slate-700 min-w-[220px]">
                            {storeAllocations.length ? (
                              <span className="block space-y-1">
                                {storeAllocations.map((allocation) => (
                                  <span key={allocation.location} className="block leading-snug">
                                    {allocation.location}
                                  </span>
                                ))}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-[12px] font-semibold text-slate-800 whitespace-nowrap">
                            {storeAllocations.length ? (
                              <span className="block space-y-1">
                                {storeAllocations.map((allocation) => (
                                  <span key={allocation.location} className="block leading-snug">
                                    {allocation.quantity ?? "—"}
                                  </span>
                                ))}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </>
                      )}
                      {showIssuanceStore && (
                        <td className="px-6 py-3.5 text-[12px] text-slate-700 min-w-[220px]">
                          {issueLines.length ? (
                            <span className="block space-y-1">
                              {issueLines.map((line) => (
                                <span key={line.location} className="block leading-snug">
                                  {line.location}
                                  {` · ${line.remaining} left`}
                                </span>
                              ))}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      )}
                      {showReceiverColumn && (
                        <td className="px-6 py-3.5 text-[12px] text-slate-700 whitespace-nowrap">
                          {row.suppliedTo || row.requestedBy || "—"}
                        </td>
                      )}
                      {showSuppliedMeta && (
                        <>
                          <td className="px-6 py-3.5 text-[12px] text-slate-700 whitespace-nowrap">
                            {row.approvedBy || "—"}
                          </td>
                          <td className="px-6 py-3.5 text-[12px] text-slate-600 whitespace-nowrap">
                            {formatRequisitionDate(row.approvalDate)}
                          </td>
                          <td className="px-6 py-3.5 text-[12px] text-slate-700 whitespace-nowrap">
                            {row.suppliedTo || "—"}
                          </td>
                        </>
                      )}
                      {showPartialMeta && (
                        <>
                          <td className="px-6 py-3.5 text-[12px] font-bold text-slate-800 whitespace-nowrap">
                            {row.quantitySupplied ?? "—"}
                          </td>
                          <td className="px-6 py-3.5 text-[12px] font-bold text-slate-800 whitespace-nowrap">
                            {row.quantityRemaining ?? "—"}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap",
                            statusBadgeClass(row.status),
                          )}
                        >
                          {formatRequisitionStatus(row.status)}
                        </span>
                      </td>
                      {showActionsColumn && (
                        <td className="px-6 py-3.5 text-right whitespace-nowrap">
                          <TableRowActions>
                            <TableViewAction
                              title="View supply request"
                              onClick={() =>
                                setActiveAction({
                                  row,
                                  config: getActionConfig(row.status, row),
                                })
                              }
                            />
                          </TableRowActions>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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

      <RaiseSupplyRequestModal
        isOpen={activeAction?.config.action === "raise_supply_request"}
        onClose={closeAction}
        requisition={activeRequisition}
        onSubmit={handleRaiseSubmit}
      />

      <ApprovalRequestActionModal
        isOpen={activeAction?.config.action === "approval_request"}
        onClose={closeAction}
        requisition={activeRequisition}
        onSubmit={handleApprovalSubmit}
        onReject={handleReject}
      />

      <IssueItemActionModal
        isOpen={activeAction?.config.action === "issue_item"}
        onClose={closeAction}
        requisition={activeRequisition}
        preferredStore={locationFilter !== "ALL" ? locationFilter : undefined}
        onSendOtp={handleSendIssueOtp}
        onConfirmIssue={handleConfirmIssue}
        onReject={handleReject}
      />

      <RequisitionDetailModal
        isOpen={activeAction?.config.action === "view_details"}
        onClose={closeAction}
        requisition={activeRequisition}
      />

      <BatchIssueItemActionModal
        isOpen={batchIssueOpen}
        onClose={() => setBatchIssueOpen(false)}
        requisitions={selectedRows}
        issueStore={
          locationFilter !== "ALL"
            ? locationFilter
            : [...new Set(selectedRows.flatMap((row) => getStoresWithRemainingQty(row)))][0]
        }
        onSendOtp={handleBatchSendOtp}
        onConfirmIssue={handleBatchConfirmIssue}
        onReject={handleBatchReject}
      />

      <BatchRaiseSupplyRequestModal
        isOpen={batchRaiseOpen}
        onClose={() => setBatchRaiseOpen(false)}
        requisitions={selectedRows}
        onSubmit={handleBatchRaise}
      />

      <BatchApprovalRequestActionModal
        isOpen={batchApprovalOpen}
        onClose={() => setBatchApprovalOpen(false)}
        requisitions={selectedRows}
        onApprove={handleBatchApproval}
      />
    </div>
  );
}
