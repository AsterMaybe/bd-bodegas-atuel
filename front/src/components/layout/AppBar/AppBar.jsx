import { useState, useEffect, useRef } from "react";
import { clsx } from "clsx";
import { Breadcrumb } from "../../ui";
import { CircleHelp, Bell, ChevronDown, LogOut } from "lucide-react";
import { Avatar } from "../../ui";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useActividad } from "../../../hooks/useWineData";
import { useAuth } from "../../../hooks";

export function AppBar({ breadcrumbItems = [] }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { data: actividadData, isLoading: actividadLoading } = useActividad({
    page: 1,
    limit: 2,
  });

  const { nombreUsuario, rol } = useAuth();

  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // Close both menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setNotificationsOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Ensure only one menu is open at a time
  const openNotifications = () => {
    setUserMenuOpen(false);
    setNotificationsOpen(true);
  };

  const openUserMenu = () => {
    setNotificationsOpen(false);
    setUserMenuOpen(true);
  };

  const toggleNotifications = () => {
    if (notificationsOpen) {
      setNotificationsOpen(false);
    } else {
      setUserMenuOpen(false);
      setNotificationsOpen(true);
    }
  };

  const toggleUserMenu = () => {
    if (userMenuOpen) {
      setUserMenuOpen(false);
    } else {
      setNotificationsOpen(false);
      setUserMenuOpen(true);
    }
  };

  return (
    <header className="h-[76px] bg-white border-b border-border sticky top-0 z-40 flex-shrink-0">
      <div className="h-full px-10 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="flex items-center gap-6 ml-10">
          <span className="hidden md:block text-sm text-text-muted whitespace-nowrap">
            {today.charAt(0).toUpperCase() + today.slice(1)}
          </span>
          <div className="w-px h-5 bg-border" aria-hidden="true" />

          <button
            className="p-2 rounded-lg text-text-muted hover:bg-hover hover:text-text transition-colors duration-fast"
            aria-label="Ayuda"
          >
            <CircleHelp className="h-5 w-5" />
          </button>

          <div className="relative" ref={notificationsRef}>
            <button
              onClick={toggleNotifications}
              className="p-2 rounded-lg text-text-muted hover:bg-hover hover:text-text transition-colors duration-fast relative"
              aria-label="Notificaciones"
              aria-expanded={notificationsOpen}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg py-2 z-50">
                <p className="px-4 py-2 text-sm font-medium text-text border-b border-border">
                  Notificaciones
                </p>
                <div className="max-h-60 overflow-y-auto">
                  {actividadLoading ? (
                    <div className="flex flex-col gap-2 p-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-3 h-12">
                          <div className="w-8 h-8 bg-neutral-200 rounded-lg animate-pulse" />
                          <div className="flex-1">
                            <div className="h-4 bg-neutral-200 rounded animate-pulse" />
                            <div className="h-3 bg-neutral-200 rounded mt-2 w-3/4 animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : actividadData?.data?.length === 0 ? (
                    <div className="flex items-center justify-center p-8">
                      <p className="text-text-muted text-sm">Sin actividad reciente</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {actividadData.data.map((act) => (
                        <div key={act.id_auditoria} className="px-4 py-3 border-b border-border last:border-0">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg flex-center flex-shrink-0">
                              {act.operacion === "INSERT" ? (
                                <span className="w-4 h-4 bg-success/10 text-success rounded flex-center text-xs font-bold">
                                  +
                                </span>
                              ) : act.operacion === "UPDATE" ? (
                                <span className="w-4 h-4 bg-primary/10 text-primary rounded flex-center text-xs font-bold">
                                  ✎
                                </span>
                              ) : (
                                <span className="w-4 h-4 bg-error/10 text-error rounded flex-center text-xs font-bold">
                                  ✕
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-text truncate">
                                {act.descripcion}
                              </p>
                              <p className="text-xs text-text-muted">
                                {act.tabla_afectada} • {act.usuario}
                              </p>
                              <p className="text-xs text-text-light mt-1">
                                {new Date(act.fecha_hora).toLocaleString("es-AR", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {actividadData?.data?.length > 0 && (
                    <button
                      className="w-full px-4 py-2 text-sm text-primary hover:bg-hover transition-colors text-left"
                      onClick={() => navigate("/dashboard/activity")}
                    >
                      Ver toda la actividad
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={toggleUserMenu}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-hover transition-colors duration-fast"
              aria-label="Menú de usuario"
              aria-expanded={userMenuOpen}
            >
              <Avatar user={{ initials: nombreUsuario.charAt(0).toUpperCase(), nombre: nombreUsuario }} size="md" />
              <span className="hidden sm:block text-sm font-medium text-text">{nombreUsuario}</span>
              <ChevronDown className="h-4 w-4 text-text-light" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-xs font-medium text-text">{nombreUsuario}</p>
                  <p className="text-xs text-text-muted capitalize">{rol}</p>
                </div>
                <button className="w-full px-4 py-2 text-sm text-text hover:bg-hover transition-colors text-left flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  Mi perfil
                </button>
                <button className="w-full px-4 py-2 text-sm text-text hover:bg-hover transition-colors text-left flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  Configuración
                </button>
                <hr className="my-1 border-border" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-sm text-error hover:bg-error-light transition-colors text-left flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
