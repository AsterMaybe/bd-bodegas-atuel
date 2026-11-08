import { Outlet } from "react-router-dom";
import { Sidebar } from "../Sidebar";
import { AppBar } from "../AppBar";
import { clsx } from "clsx";

export function Layout() {
  return (
    <div className="min-h-screen bg-bg flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppBar breadcrumbItems={[]} />
        <main className="flex-1 overflow-auto p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
