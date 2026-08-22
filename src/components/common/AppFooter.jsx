import React from "react";

const AppFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="shrink-0 border-t border-border bg-surface px-4 sm:px-6 py-3">
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[10px] font-medium text-muted">
        <p>Copyright &copy; {year} Store Management. All rights reserved.</p>
        <p>Version 1.0.0</p>
      </div>
    </footer>
  );
};

export default AppFooter;
