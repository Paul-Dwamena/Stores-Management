import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, LogOut } from "lucide-react";
import { useAuth } from "../context/useAuth";
import SearchInput from "./common/fields/SearchInput";
import ConfirmationModal from "./common/ConfirmationModal";

const Header = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <header className="bg-surface border-b border-border h-14 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 sticky top-0 min-w-0 gap-3">
      <div className="flex items-center flex-1 min-w-0 gap-3">
        <button
          className="lg:hidden p-2 text-muted hover:text-text hover:bg-slate-100 rounded-md transition-colors shrink-0"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={18} />
        </button>

        <SearchInput
          placeholder="Search stores..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          containerClassName="max-w-xs hidden md:block min-w-0"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-2 mr-1 sm:mr-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand" />
          <span className="text-[10px] font-medium text-muted">System Live</span>
        </div>

        <Link
          to="/settings"
          className="hidden sm:flex items-center gap-2 pl-3 h-8 rounded-md hover:bg-slate-50 transition-colors pr-2 border-r border-slate-100"
        >
          <div className="flex flex-col items-end leading-none">
            <span className="text-[10px] font-bold text-text">
              {user?.name ?? "Store Admin"}
            </span>
            <span className="text-[9px] text-subtle">{user?.role ?? "Staff"}</span>
          </div>
          <div className="h-7 w-7 rounded bg-slate-100 border border-border flex items-center justify-center text-muted text-[9px] font-bold">
            {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className="p-2 text-subtle hover:text-danger hover:bg-danger-muted rounded-md transition-all shrink-0"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>

      <ConfirmationModal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={logout}
        title="Sign out?"
        message="You will need to sign in again to access the store dashboard."
        confirmText="Sign out"
        cancelText="Stay signed in"
        isDanger
      />
    </header>
  );
};

export default Header;
