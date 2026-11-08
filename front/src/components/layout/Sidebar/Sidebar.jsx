import { useLocation } from "react-router-dom";
import { clsx } from "clsx";
import { LayoutDashboard, Sprout, History, Settings, ChevronsUpDown, Circle, Wine } from "lucide-react";
import { Avatar } from "../../ui";
import { useAuth } from "../../../hooks";

const NAV_ITEMS = [
  { label: "Overview", icon: <LayoutDashboard className="h-4 w-4" />, path: "/dashboard" },
  { label: "Wines", icon: <Wine className="h-4 w-4" />, path: "/dashboard/vinos" },
  { label: "Vineyards", icon: <Sprout className="h-4 w-4" />, path: "/dashboard/vineyards" },
  { label: "Activity log", icon: <History className="h-4 w-4" />, path: "/dashboard/activity" },
];

export function Sidebar() {
  const location = useLocation();
  const { nombreUsuario, rol } = useAuth();

  return (
    <aside className="w-[232px] flex-shrink-0 bg-sidebar border-r border-border h-screen sticky top-0 flex flex-col">
      <div className="p-5 space-y-10 flex-1 overflow-y-auto">
        <nav aria-label="Workspace navigation" className="space-y-9">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-10 bg-primary rounded-md flex-center relative">
              <Circle className="h-5.5 w-5.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-normal text-text truncate">Bodegas del Atuel</p>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">MENDOZA · ARGENTINA</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">WORKSPACE</p>
            <ul className="space-y-1.5" role="list">
              {NAV_ITEMS.map((item) => (
                <li key={item.path}>
                  <a
                    href={item.path}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-base transition-colors duration-fast",
                      location.pathname === item.path
                        ? "bg-primary-light text-primary font-semibold"
                        : "text-text-muted hover:bg-hover hover:text-text"
                    )}
                    aria-current={location.pathname === item.path ? "page" : undefined}
                  >
                    <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <div className="p-5 space-y-5 border-t border-border">
        <div className="bg-neutral-50 border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-text">Atuel estate</p>
          <p className="text-xs text-text-muted">San Rafael, Mendoza</p>
          <div className="flex items-center gap-2 text-xs text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true"></span>
            Database connected
          </div>
        </div>

        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-base text-text-muted hover:bg-hover hover:text-text transition-colors duration-fast">
          <Settings className="h-4.5 w-4.5 flex-shrink-0" aria-hidden="true" />
          <span>Settings</span>
        </button>

        <div className="pt-2 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              user={{
                initials: nombreUsuario ? nombreUsuario.charAt(0).toUpperCase() : "U",
                nombre: nombreUsuario,
              }}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text truncate">{nombreUsuario}</p>
              <p className="text-xs text-text-muted truncate capitalize">{rol}</p>
            </div>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-text-light" aria-hidden="true" />
        </div>
      </div>
    </aside>
  );
}
