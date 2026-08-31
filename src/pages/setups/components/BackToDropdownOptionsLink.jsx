import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export const DROPDOWN_OPTIONS_HUB_PATH = "/setups?tab=dropdown";

export default function BackToDropdownOptionsLink() {
  return (
    <Link
      to={DROPDOWN_OPTIONS_HUB_PATH}
      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-primary transition-colors"
    >
      <ChevronLeft size={16} />
      Back to Dropdown Options
    </Link>
  );
}
