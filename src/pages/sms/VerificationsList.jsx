import React, { useEffect, useMemo, useState } from "react";
import SearchInput from "../../components/common/fields/SearchInput";
import Pagination from "../../components/common/Pagination";
import SectionLoadState from "../../components/common/SectionLoadState";
import { TableRowActions, TableViewAction } from "../../components/common/tableActions";
import { toast } from "../../components/common/ToastNotification";
import { EMPTY_DISPLAY, sortNewestFirst } from "../../utils/apiResponseHelpers";
import {
  SMS_PAGE_SIZE,
  formatSmsWhen,
  listSmsVerifications,
} from "../../services/smsAuditService";
import SmsRecordDetailModal from "./components/SmsRecordDetailModal";

export default function VerificationsList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);

  const reload = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setRows(sortNewestFirst(await listSmsVerifications(), "createdAt"));
    } catch (err) {
      const message = err.message || "Unable to load OTP verification SMS audit.";
      setRows([]);
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.phone, row.otp, row.otpTypeLabel, row.status]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [rows, search]);

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / SMS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedRows = filtered.slice(
    safePage * SMS_PAGE_SIZE,
    safePage * SMS_PAGE_SIZE + SMS_PAGE_SIZE,
  );

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  return (
    <>
      <div className="card overflow-hidden">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/30 p-4 lg:flex-row lg:items-center">
          <SearchInput
            placeholder="Search phone, OTP, type, status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="whitespace-nowrap px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500">
                  Created
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500">
                  Phone
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500">
                  OTP
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500">
                  Type
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500">
                  Expires
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500">
                  Verified at
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 text-right text-[10px] font-bold uppercase text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading || loadError ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4">
                    <SectionLoadState
                      loading={loading}
                      error={loadError}
                      onRetry={reload}
                      loadingLabel="Loading OTP verifications…"
                      errorTitle="Couldn’t load OTP verifications"
                    />
                  </td>
                </tr>
              ) : pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[13px] text-slate-400">
                    {rows.length === 0
                      ? "No OTP verification SMS records yet."
                      : "No records match your search."}
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <tr
                    key={row.id}
                    className="align-top transition-colors hover:bg-slate-50/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] font-medium text-slate-600">
                      {formatSmsWhen(row.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-slate-900">
                      {row.phone || EMPTY_DISPLAY}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] font-semibold tracking-wider text-slate-900">
                      {row.otp || EMPTY_DISPLAY}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-slate-700">
                      {row.otpTypeLabel}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          row.isVerified
                            ? "inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                            : "inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-slate-600">
                      {formatSmsWhen(row.expiresAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-slate-600">
                      {formatSmsWhen(row.verifiedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <TableRowActions>
                        <TableViewAction
                          title="View SMS record"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(row);
                          }}
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
          <div className="flex justify-start border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <Pagination
              page={safePage}
              size={SMS_PAGE_SIZE}
              totalElements={totalElements}
              onPageChange={setPage}
              showWhenEmpty={false}
            />
          </div>
        ) : null}
      </div>

      <SmsRecordDetailModal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        record={selected}
        kind="verification"
      />
    </>
  );
}
