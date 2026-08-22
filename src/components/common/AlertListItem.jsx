import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";
import { ALERT_CATEGORIES, ALERT_TYPE_STYLES } from "../../utils/fleetAlertHelpers";

const AlertListItem = ({ alert, onClick, compact = false }) => {
  const categoryMeta = ALERT_CATEGORIES[alert.category] ?? ALERT_CATEGORIES.system;
  const typeStyles = ALERT_TYPE_STYLES[alert.type] ?? ALERT_TYPE_STYLES.info;
  const CategoryIcon = categoryMeta.icon;

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border transition-all group",
        compact ? "p-2.5" : "p-3",
        typeStyles.border,
      )}
    >
      <div className={cn("mt-1 h-2 w-2 rounded-full shrink-0", typeStyles.dot)} />
      <div
        className={cn(
          "shrink-0 p-1.5 rounded-lg h-fit",
          typeStyles.iconWrap,
        )}
      >
        <CategoryIcon size={compact ? 13 : 14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-[11px] font-bold text-slate-800 leading-tight">
            {alert.title}
          </p>
          <span
            className={cn(
              "px-1.5 py-0.5 text-[9px] font-bold rounded border uppercase tracking-wide",
              categoryMeta.pill,
            )}
          >
            {categoryMeta.label}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
          {alert.message}
        </p>
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">
          {alert.time}
        </p>
      </div>
      <ChevronRight
        size={14}
        className="text-slate-300 group-hover:text-emerald-500 shrink-0 mt-1 transition-colors"
      />
    </div>
  );

  if (alert.href) {
    return (
      <Link
        to={alert.href}
        onClick={onClick}
        className="block"
      >
        {content}
      </Link>
    );
  }

  return <div>{content}</div>;
};

export default AlertListItem;
