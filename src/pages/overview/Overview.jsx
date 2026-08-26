import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle, ClipboardList, Package } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../../components/common/PageHeader";
import SummaryStatCard from "../../components/common/SummaryStatCard";
import { cn } from "../../utils/cn";
import { getRequisitions } from "../../mockdata/stores";
import { getRequests } from "../../mockdata/requests";
import { listSupplyRequests } from "../../services/supplyRequestsService";
import { listInventoryItems } from "../../services/inventoryService";

const STORE_BAR_COLORS = ["#0a0a0a", "#404040", "#737373", "#b91c1c", "#991b1b"];

const STATUS_COLORS = {
  "Pending Supply Request": "#d97706",
  "Pending Supply Approval": "#b45309",
  "Pending Issuance": "#525252",
  Supplied: "#205848",
  "Partial Supplied": "#16d595",
  Rejected: "#b91c1c",
};

function storeShortName(location) {
  return (location || "Unassigned").split("—")[0].trim();
}

function formatStatusLabel(status) {
  return (status || "Unknown").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatShortDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const CHART_TOOLTIP_STYLE = {
  borderRadius: "6px",
  border: "1px solid #e2e8f0",
  fontSize: "11px",
  backgroundColor: "#fff",
};

function ChartCard({ title, to, linkLabel, children }) {
  return (
    <div className="card flex flex-col min-h-[280px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h2 className="section-header">{title}</h2>
        <Link
          to={to}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-danger hover:text-[#991b1b]"
        >
          {linkLabel}
          <ArrowRight size={12} className="shrink-0" strokeWidth={2.5} />
        </Link>
      </div>
      <div className="p-4 flex-1">{children}</div>
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <div className="h-full min-h-[180px] flex items-center justify-center">
      <p className="body-text text-center">{children}</p>
    </div>
  );
}

function ColumnChart({ items, emptyLabel }) {
  if (!items.length) return <EmptyState>{emptyLabel}</EmptyState>;

  const data = items.map((item, index) => ({
    name: item.label.replace(" Store", "").split(" ")[0],
    store: item.label,
    units: item.value,
    skuCount: item.skuCount,
    color: STORE_BAR_COLORS[index % STORE_BAR_COLORS.length],
  }));

  return (
    <div className="h-[210px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
            <Tooltip
            cursor={{ fill: "#f8fafc" }}
            contentStyle={CHART_TOOLTIP_STYLE}
            wrapperStyle={{ zIndex: 30 }}
            formatter={(value, _name, props) => [
              `${value} units · ${props.payload.skuCount} SKU${props.payload.skuCount === 1 ? "" : "s"}`,
              props.payload.store,
            ]}
          />
          <Bar dataKey="units" radius={[4, 4, 0, 0]} barSize={36}>
            {data.map((entry) => (
              <Cell key={entry.store} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DonutChart({ items, emptyLabel }) {
  if (!items.length) return <EmptyState>{emptyLabel}</EmptyState>;

  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const data = items.map((item) => ({
    name: item.label,
    value: item.value,
    color: item.color,
  }));

  return (
    <div className="h-[210px] flex items-center">
      <div className="relative h-full min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              wrapperStyle={{ zIndex: 30 }}
              formatter={(value, name) => [
                `${value} (${Math.round((value / total) * 100)}%)`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[18px] font-extrabold text-text leading-none">{total}</span>
          <span className="text-[10px] font-semibold text-muted mt-1">requests</span>
        </div>
      </div>
      <ul className="flex flex-col ml-2 shrink-0 min-w-0 max-w-[52%] divide-y divide-slate-100">
        {data.map((item) => (
          <li key={item.name} className="flex items-center gap-2 text-[12px] py-1.5">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="flex-1 truncate text-slate-600">{item.name}</span>
            <span className="font-bold text-text tabular-nums">{item.value}</span>
            <span className="text-[10px] text-muted w-8 text-right tabular-nums">
              {Math.round((item.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusBadge({ status, tone = "warning" }) {
  const tones = {
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    brand: "bg-success-muted text-success border-[#b7d4c8]",
  };
  return (
    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap", tones[tone])}>
      {status}
    </span>
  );
}

function MiniMeter({ value, max }) {
  const cap = Math.max(Number(max) || 1, 1);
  const pct = Math.min(100, Math.round((Number(value) / cap) * 100));
  return (
    <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full rounded-full bg-warning" style={{ width: `${Math.max(pct, value ? 8 : 0)}%` }} />
    </div>
  );
}

export default function Overview() {
  const requisitions = useMemo(() => getRequisitions(), []);
  const [accessories, setAccessories] = useState([]);
  const lowStock = useMemo(
    () => accessories.filter((item) => item.status === "OUT_OF_STOCK"),
    [accessories],
  );
  const openSupplies = useMemo(
    () => requisitions.filter((row) => {
      const status = (row.status ?? "").toString().toUpperCase();
      return status !== "SUPPLIED" && status !== "REJECTED";
    }),
    [requisitions],
  );
  const pendingRequests = useMemo(
    () => getRequests().filter((row) => (row.status ?? "").toUpperCase() === "PENDING"),
    [],
  );
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listSupplyRequests()
      .then((rows) => {
        if (!cancelled) {
          setPendingApprovalsCount(rows.filter((row) => row.queue === "pending").length);
        }
      })
      .catch(() => {
        if (!cancelled) setPendingApprovalsCount(0);
      });
    listInventoryItems()
      .then((rows) => {
        if (!cancelled) setAccessories(rows);
      })
      .catch(() => {
        if (!cancelled) setAccessories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stockByStore = useMemo(() => {
    const totals = {};
    accessories.forEach((item) => {
      (item.stores || []).forEach((store) => {
        const name = storeShortName(store.name);
        if (!totals[name]) totals[name] = { label: name, value: 0, skuCount: 0 };
        totals[name].value += Number(store.quantity || 0);
        if (Number(store.quantity || 0) > 0) totals[name].skuCount += 1;
      });
    });
    return Object.values(totals).sort((a, b) => b.value - a.value);
  }, [accessories]);

  const suppliesByStatus = useMemo(() => {
    const totals = {};
    requisitions.forEach((row) => {
      const label = formatStatusLabel(row.status);
      totals[label] = (totals[label] || 0) + 1;
    });
    return Object.entries(totals)
      .map(([label, value]) => ({
        label,
        value,
        color: STATUS_COLORS[label] || "#64748b",
      }))
      .sort((a, b) => b.value - a.value);
  }, [requisitions]);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Overview"
        description="Accessory inventory, open supplies, and pending store approvals."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryStatCard title="Accessory SKUs" value={accessories.length} icon={Package} tone="teal" />
        <SummaryStatCard title="Low / out of stock" value={lowStock.length} icon={AlertTriangle} tone="amber" />
        <SummaryStatCard title="Open supplies" value={openSupplies.length} icon={ClipboardList} tone="sky" />
        <SummaryStatCard title="Pending approvals" value={pendingApprovalsCount} icon={CheckCircle} tone="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Stock by store" to="/stores?sub=inventory" linkLabel="View inventory">
          <ColumnChart items={stockByStore} emptyLabel="No store stock to chart yet." />
        </ChartCard>

        <ChartCard title="Supplies by status" to="/stores?sub=supplies" linkLabel="View supplies">
          <DonutChart items={suppliesByStatus} emptyLabel="No supply requests to chart yet." />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Low stock accessories" to="/stores?sub=inventory" linkLabel="View inventory">
          {lowStock.length === 0 ? (
            <EmptyState>All accessories are at healthy stock levels.</EmptyState>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-left min-w-[420px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-2 pr-3 text-[10px] font-bold text-slate-500 uppercase">Item</th>
                    <th className="pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase text-right">On hand</th>
                    <th className="pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase text-right">Min</th>
                    <th className="pb-2 pl-3 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {lowStock.slice(0, 8).map((item) => {
                    const out = item.status === "OUT_OF_STOCK";
                    return (
                      <tr key={item.id}>
                        <td className="py-2.5 pr-3">
                          <p className="text-[12px] font-semibold text-text truncate max-w-[180px]">{item.name}</p>
                          <p className="text-[10px] text-muted font-mono">{item.itemCode}</p>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex flex-col items-end gap-1">
                            <span className="text-[12px] font-bold text-text tabular-nums">{item.quantity ?? 0}</span>
                            <MiniMeter value={item.quantity ?? 0} max={item.minStock || 1} />
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-[12px] text-muted text-right tabular-nums">
                          {item.minStock ?? "—"}
                        </td>
                        <td className="py-2.5 pl-3">
                          <StatusBadge
                            status={out ? "Out of stock" : "Low stock"}
                            tone={out ? "danger" : "warning"}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Pending store requests" to="/approvals" linkLabel="Open approvals">
          {pendingRequests.length === 0 ? (
            <EmptyState>No store requests waiting for approval.</EmptyState>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-left min-w-[420px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-2 pr-3 text-[10px] font-bold text-slate-500 uppercase">Request</th>
                    <th className="pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase">Item</th>
                    <th className="pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase text-right">Qty</th>
                    <th className="pb-2 pl-3 text-[10px] font-bold text-slate-500 uppercase">Store</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pendingRequests.slice(0, 8).map((request) => (
                    <tr key={request.id}>
                      <td className="py-2.5 pr-3">
                        <p className="text-[12px] font-bold text-text whitespace-nowrap">{request.requestNumber}</p>
                        <p className="text-[10px] text-muted">{formatShortDate(request.submittedDate || request.createdAt)}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="text-[12px] font-semibold text-text truncate max-w-[140px]">
                          {request.storesDetails?.itemName || request.expenseCategory}
                        </p>
                        <p className="text-[10px] text-muted font-mono">{request.storesDetails?.itemCode || "—"}</p>
                      </td>
                      <td className="py-2.5 px-3 text-[12px] font-bold text-text text-right tabular-nums">
                        {request.storesDetails?.quantity ?? "—"}
                      </td>
                      <td className="py-2.5 pl-3">
                        <p className="text-[12px] text-slate-600 truncate max-w-[120px]">
                          {storeShortName(request.costCenter)}
                        </p>
                        <StatusBadge status="Pending" tone="warning" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
