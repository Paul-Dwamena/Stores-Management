import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import AppFooter from "../components/common/AppFooter";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-app">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1 w-full min-w-0 overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 p-4 sm:p-6">
          <div className="max-w-[1400px] mx-auto w-full min-w-0">
            <Outlet />
          </div>
        </main>
        <AppFooter />
      </div>
    </div>
  );
};

export default Layout;
