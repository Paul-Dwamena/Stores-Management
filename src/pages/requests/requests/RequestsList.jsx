import React, { useMemo, useState } from "react";
import {
  Plus,
  FileText,
  Clock3,
  CheckCircle2,
  Eye,
  Calendar,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import PageHeader from "../../../components/common/PageHeader";
import Button from "../../../components/common/base/Button";
import SummaryStatCard from "../../../components/common/SummaryStatCard";
import { toast } from "../../../components/common/ToastNotification";
import { getRequests, saveRequest } from "../../../mockdata/requests";
import {
  REQUEST_STATUS_FILTERS,
  REQUEST_TYPE_OPTIONS,
  formatRequestAmount,
  getRequestTypeLabel,
} from "./utils/requestHelpers";
import NewRequestModal from "./components/NewRequestModal";
import RequestDetailModal from "./components/RequestDetailModal";

const QUICK_TIPS = [
  "Use Request from Stores when you need accessories issued from inventory.",
  "Pending requests appear in Approvals until they are decided.",
  "Approved store requests can then be raised and issued from Supplies.",
];

function TypeBadge({ type }) {
  const styles = {
    leave_request: "bg-slate-100 text-slate-700 border-slate-200",
    vehicle_request: "bg-amber-50 text-amber-700 border-amber-200",
    maintenance_request: "bg-orange-50 text-orange-700 border-orange-200",
    work_service_request: "bg-pink-50 text-pink-700 border-pink-200",
    request_from_stores: "bg-teal-50 text-teal-700 border-teal-200",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold",
        styles[type] ?? "bg-slate-50 text-slate-600 border-slate-200",
      )}
    >
      {getRequestTypeLabel(type)}
    </span>
  );
}

function ApprovalBadge({ label, status }) {
  const normalized = (status ?? "").toString().toUpperCase();
  const styles =
    normalized === "APPROVED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : normalized === "DRAFT"
        ? "bg-slate-100 text-slate-600 border-slate-200"
        : normalized === "REJECTED"
          ? "bg-rose-50 text-rose-700 border-rose-200"
          : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold", styles)}>
      {label || normalized || "—"}
    </span>
  );
}

const filterSelectClass =
  "w-full min-w-[150px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-700 outline-none focus:border-emerald-500";

export default function RequestsList() {
  const [requests, setRequests] = useState(getRequests());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const filtered = useMemo(() => {
    return requests.filter((request) => {
      if (status !== "ALL" && (request.status ?? "").toUpperCase() !== status) return false;
      if (type !== "ALL" && request.requestType !== type) return false;

      if (dateFrom || dateTo) {
        const submitted = new Date(request.submittedDate);
        if (Number.isNaN(submitted.getTime())) return false;
        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (submitted < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (submitted > to) return false;
        }
      }

      return true;
    });
  }, [requests, dateFrom, dateTo, status, type]);

  const summary = useMemo(() => {
    const draft = requests.filter((r) => (r.status ?? "").toUpperCase() === "DRAFT").length;
    const pending = requests.filter((r) => (r.status ?? "").toUpperCase() === "PENDING").length;
    const approved = requests.filter((r) => (r.status ?? "").toUpperCase() === "APPROVED").length;
    const byType = REQUEST_TYPE_OPTIONS.map((option) => ({
      ...option,
      count: requests.filter((r) => r.requestType === option.value).length,
    }));

    return {
      draft,
      pending,
      approved,
      total: requests.length,
      byType,
    };
  }, [requests]);

  const handleSaveRequest = (payload) => {
    try {
      const payloads = Array.isArray(payload) ? payload : [payload];
      payloads.forEach((row) => saveRequest(row));
      setRequests(getRequests());
      toast.success(
        payloads.length === 1
          ? "Request submitted."
          : `${payloads.length} requests submitted.`,
      );
    } catch (error) {
      toast.error(error.message ?? "Could not submit request.");
    }
  };

  return (
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader
        title="Requests"
        description="View and manage your requests."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryStatCard title="Draft Requests" value={summary.draft} icon={FileText} tone="orange" />
        <SummaryStatCard title="Pending Approval" value={summary.pending} icon={Clock3} tone="sky" />
        <SummaryStatCard title="Approved" value={summary.approved} icon={CheckCircle2} tone="teal" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Date Range
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
            <Calendar size={14} className="shrink-0 text-slate-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-transparent text-[12px] text-slate-700 outline-none"
              aria-label="From date"
            />
            <span className="text-[11px] text-slate-300">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-transparent text-[12px] text-slate-700 outline-none"
              aria-label="To date"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={filterSelectClass}
          >
            {REQUEST_STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={filterSelectClass}
          >
            <option value="ALL">All Types</option>
            {REQUEST_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-black text-slate-900">My Requests</h2>
              <p className="text-[11px] font-medium text-slate-500">
                {filtered.length} request{filtered.length === 1 ? "" : "s"} found
              </p>
            </div>
            <Button onClick={() => setModalOpen(true)}>
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
                      <TypeBadge type={request.requestType} />
                      <ApprovalBadge
                        label={request.approvalStatus}
                        status={request.status}
                      />
                      {request.paymentStatus && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                          Payment Status: {request.paymentStatus}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-600">
                      <span>
                        <span className="font-bold text-slate-800">
                          {formatRequestAmount(request.amount)}
                        </span>
                      </span>
                      <span>
                        Cost Center:{" "}
                        <span className="font-semibold text-slate-800">{request.costCenter}</span>
                      </span>
                      <span>
                        Budget Line:{" "}
                        <span className="font-semibold text-slate-800">{request.budgetLine}</span>
                      </span>
                      <span>
                        Class:{" "}
                        <span className="font-semibold text-slate-800">{request.requestClass}</span>
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Expense Category:{" "}
                      <span className="font-medium text-slate-700">{request.expenseCategory}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    title="View request details"
                    onClick={() => setSelectedRequest(request)}
                    className="mt-0.5 rounded-md p-2 text-sky-600 transition-colors hover:bg-sky-50"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-[12px] text-slate-400">
                No requests found for the selected filters.
              </div>
            )}
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
              {summary.byType.map((item) => (
                <div key={item.value} className="flex items-center justify-between text-[12px]">
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
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
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
        onSave={handleSaveRequest}
      />

      <RequestDetailModal
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
      />
    </div>
  );
}
