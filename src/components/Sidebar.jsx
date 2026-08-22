import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FiGrid, FiBox, FiX, FiSettings } from "react-icons/fi";
import { CheckCircle, Inbox, ScrollText, SlidersHorizontal } from "lucide-react";
import { cn } from "../utils/cn";
import StoreLogo from "./common/StoreLogo";

const mainNavItems = [
  { name: "Overview", icon: FiGrid, path: "/", exact: true },
  { name: "Stores", icon: FiBox, path: "/stores" },
  { name: "Requests", icon: Inbox, path: "/requests" },
  { name: "Approvals", icon: CheckCircle, path: "/approvals" },
  { name: "Setups", icon: SlidersHorizontal, path: "/setups" },
  { name: "Audit Trail", icon: ScrollText, path: "/audit-trail" },
  { name: "Settings", icon: FiSettings, path: "/settings" },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  const closeMobile = () => setSidebarOpen(false);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/30 z-20 lg:hidden transition-opacity duration-200",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={closeMobile}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-[210px] bg-brand-foreground flex flex-col h-full shrink-0 border-r border-black/20 transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "lg:static lg:translate-x-0",
        )}
      >
        <div className="px-4 h-14 flex items-center gap-2.5 border-b border-white/10 shrink-0">
          <StoreLogo size="sm" className="shrink-0 ring-1 ring-white/25" />
          <span className="text-white font-extrabold text-[14px] tracking-tight leading-tight">
            Store Management
          </span>
        </div>

        <button
          type="button"
          className="lg:hidden absolute top-3 right-3 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-colors z-10"
          onClick={closeMobile}
        >
          <FiX size={18} />
        </button>

        <nav className="flex-1 py-4 px-2 overflow-y-auto no-scrollbar">
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.exact}
                onClick={closeMobile}
                className={({ isActive: navActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all duration-150",
                    navActive || (!item.exact && location.pathname.startsWith(item.path))
                      ? "bg-brand-accent text-brand-foreground"
                      : "text-white/70 hover:bg-[#16d595]/25 hover:text-white",
                  )
                }
              >
                <item.icon size={16} className="shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
