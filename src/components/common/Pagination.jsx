import React from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Shared paginator — matches the vehicle list range + prev/next control pattern.
 * `page` is zero-indexed (Spring-style API pagination).
 */
const Pagination = ({
  page = 0,
  size = 10,
  totalElements = 0,
  onPageChange,
  className,
  showWhenEmpty = true,
}) => {
  const total = totalElements || 0;
  const start = total === 0 ? 0 : page * size + 1;
  const end = Math.min((page + 1) * size, total);
  const canPrev = page > 0;
  const canNext = (page + 1) * size < total;

  if (!showWhenEmpty && total === 0) return null;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span className="text-[12px] text-slate-500">
        {start} - {end} of {total}
      </span>
      <div className="flex border border-slate-200 rounded-md overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={!canPrev}
          className="p-2 text-slate-400 hover:bg-slate-50 disabled:opacity-50 transition-colors border-r border-slate-200"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          className="p-2 text-slate-400 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          aria-label="Next page"
        >
          <ChevronLeft size={16} className="rotate-180" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
