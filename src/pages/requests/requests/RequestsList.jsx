import React, { useEffect, useMemo, useState } from "react";
import { Plus, Clock3, Ban, CheckCircle2 } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import Button from "../../../components/common/base/Button";
import SummaryStatCard from "../../../components/common/SummaryStatCard";
import { TableRowActions, TableViewAction } from "../../../components/common/tableActions";
import { toast } from "../../../components/common/ToastNotification";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import { formatApiDateTime, formatStatusLabel, sortNewestFirst } from "../../../utils/apiResponseHelpers";
import { SupplyStatusBadge } from "../../stores/supplies/utils/SupplyStatusBadge";
import { listUsers } from "../../../services/usersService";
import {
  listGeneralRequests,
  getGeneralRequest,
  deleteGeneralRequest,
} from "../../../services/generalRequestsService";
import { listIssuancesByGeneralRequest } from "../../../services/issuancesService";
import {
  isOpenRequest,
  isRejectedRequest,
  isSuppliedRequest,
  requestStatusKey,
  summarizeItems,
  buildStatusChangeChain,
} from "./utils/requestHelpers";
import NewRequestModal from "./components/NewRequestModal";
import RequestDetailModal from "./components/RequestDetailModal";

const QUICK_TIPS = [
  "Use Request from Stores when you need accessories issued from inventory.",
  "Submitted requests appear in Stores → Supplies so they can be raised or rejected.",
  "Raised supply requests then wait in Approvals until they are decided.",
];

const filterSelectClass =
  "w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-700 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25";

function StatusChangeChain({ history, currentStatus }) {
  const chain = buildStatusChangeChain(history, currentStatus);
  if (!chain.length) return <SupplyStatusBadge status={currentStatus} />;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chain.map((status, index) => (
        <React.Fragment key={`${requestStatusKey(status)}-${index}`}>
          {index > 0 ? (
            <span className="text-[11px] text-slate-400" aria-hidden="true">
              →
            </span>
          ) : null}
          <SupplyStatusBadge status={status} />
        </React.Fragment>
      ))}
    </div>
  );
}

export default function RequestsList() {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [viewIssuances, setViewIssuances] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const requesterName = (request) =>
    request?.requesterName
    || users.find((user) => user.id === request?.requestedBy)?.name
    || "—";

  const reload = async () => {
    setTableLoading(true);
    try {
      setRequests(sortNewestFirst(await listGeneralRequests()));
    } catch (err) {
      toast.error(err.message || "Unable to load requests.");
    } finally {
      setTableLoading(false);
    }
    try {
      setUsers(await listUsers());
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const statusFilters = useMemo(() => {
    const seen = new Map();
    requests.forEach((row) => {
      const key = requestStatusKey(row.status) || "UNKNOWN";
      if (!seen.has(key)) seen.set(key, formatStatusLabel(row.status));
    });
    return [{ value: "ALL", label: "All status" }, ...[...seen.entries()].map(([value, label]) => ({ value, label }))];
  }, [requests]);

  const filtered = useMemo(() => {
    return requests.filter((request) => {
      if (status !== "ALL" && requestStatusKey(request.status) !== status) return false;
      if (!dateFrom && !dateTo) return true;
      const created = new Date(request.createdAt);
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
    });
  }, [requests, dateFrom, dateTo, status]);

  const summary = useMemo(() => {
    const open = requests.filter((row) => isOpenRequest(row.status)).length;
    const rejected = requests.filter((row) => isRejectedRequest(row.status)).length;
    const supplied = requests.filter((row) => isSuppliedRequest(row.status)).length;
    const byStatus = [];
    const counts = new Map();
    requests.forEach((row) => {
      const key = requestStatusKey(row.status) || "UNKNOWN";
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    counts.forEach((count, key) => {
      byStatus.push({ key, label: formatStatusLabel(key), count });
    });
    return { open, rejected, supplied, total: requests.length, byStatus };
  }, [requests]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openView = async (row) => {
    setViewing(row);
    setViewIssuances([]);
    setViewLoading(true);
    try {
      const [request, issuances] = await Promise.all([
        getGeneralRequest(row.id),
        listIssuancesByGeneralRequest(row.id).catch(() => []),
      ]);
      setViewing(request);
      setViewIssuances(issuances);
    } catch (err) {
      toast.error(err.message || "Unable to load request.");
      setViewing(null);
      setViewIssuances([]);
    } finally {
      setViewLoading(false);
    }
  };

  const refreshViewing = (saved) => {
    if (saved?.id && viewing?.id === saved.id) setViewing(saved);
  };

  const runDelete = async (row) => {
    setConfirmLoading(true);
    try {
      await deleteGeneralRequest(row.id);
      toast.success("Request deleted.");
      setViewing(null);
      setViewIssuances([]);
      setConfirm(null);
      reload();
    } catch (err) {
      toast.error(err.message || "Unable to delete request.");
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader
        title="Requests"
        description="Create and manage general item requests."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryStatCard title="Open" value={summary.open} icon={Clock3} tone="sky" />
        <SummaryStatCard title="Rejected" value={summary.rejected} icon={Ban} tone="rose" />
        <SummaryStatCard title="Supplied" value={summary.supplied} icon={CheckCircle2} tone="teal" />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
            Date Range
          </label>
          <div className="flex w-[280px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full min-w-0 bg-transparent text-[12px] text-slate-700 outline-none"
              aria-label="From date"
            />
            <span className="text-[11px] text-slate-300">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full min-w-0 bg-transparent text-[12px] text-slate-700 outline-none"
              aria-label="To date"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={filterSelectClass}
          >
            {statusFilters.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2 relative min-h-[200px]">
          {tableLoading ? <LoadingSpinner variant="overlay" size="sm" /> : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-black text-slate-900">My Requests</h2>
              <p className="text-[11px] font-medium text-slate-500">
                {filtered.length} request{filtered.length === 1 ? "" : "s"} found
              </p>
            </div>
            <Button onClick={openAdd}>
              <Plus size={16} />
              New Request
            </Button>
          </div>

          <div className="space-y-3">
            {filtered.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-bold text-slate-900">
                        {request.requestNumber}
                      </span>
                      <StatusChangeChain
                        history={request.statusHistory}
                        currentStatus={request.status}
                      />
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-600">
                      <span>
                        Requested by{" "}
                        <span className="font-semibold text-slate-800">
                          {requesterName(request)}
                        </span>
                      </span>
                      <span>{summarizeItems(request.items)}</span>
                      <span>{formatApiDateTime(request.createdAt)}</span>
                    </div>
                    {request.reason ? (
                      <p className="text-[11px] text-slate-500">{request.reason}</p>
                    ) : null}
                  </div>
                  <TableRowActions className="mt-0.5">
                    <TableViewAction title="View request details" onClick={() => openView(request)} />
                  </TableRowActions>
                </div>
              </div>
            ))}

            {!tableLoading && filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-[12px] text-slate-400">
                No requests found for the selected filters.
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-[13px] font-black text-slate-900">Quick Stats</h3>
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-slate-500">Total Requests</span>
                <span className="font-bold text-slate-900">{summary.total}</span>
              </div>
              {summary.byStatus.map((item) => (
                <div key={item.key} className="flex items-center justify-between text-[12px]">
                  <span className="font-medium text-slate-500">{item.label}</span>
                  <span className="font-bold text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-[13px] font-black text-slate-900">Quick Tips</h3>
            <ul className="mt-3 space-y-2.5">
              {QUICK_TIPS.map((tip) => (
                <li key={tip} className="flex gap-2 text-[11px] leading-relaxed text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <NewRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        onSaved={(saved) => {
          reload();
          refreshViewing(saved);
        }}
      />

      <RequestDetailModal
        isOpen={Boolean(viewing) && !modalOpen && !confirm}
        onClose={() => {
          setViewing(null);
          setViewIssuances([]);
        }}
        request={viewing}
        issuances={viewIssuances}
        users={users}
        requesterName={requesterName(viewing)}
        loading={viewLoading}
        onDelete={() =>
          setConfirm({
            title: "Delete request?",
            message: `${viewing?.requestNumber} will be deleted.`,
            confirmText: "Delete",
            isDanger: true,
            run: () => runDelete(viewing),
          })
        }
      />

      <ConfirmationModal
        isOpen={Boolean(confirm)}
        onClose={() => {
          if (confirmLoading) return;
          setConfirm(null);
        }}
        onConfirm={() => confirm?.run?.()}
        closeOnConfirm={false}
        confirmLoading={confirmLoading}
        title={confirm?.title}
        message={confirm?.message}
        confirmText={confirmLoading ? "Deleting…" : confirm?.confirmText}
        isDanger={confirm?.isDanger}
      />
    </div>
  );
}
