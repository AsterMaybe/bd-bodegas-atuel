import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui";
import { Button } from "../components/ui";
import { Download, LayoutDashboard, Database, Sprout, ClipboardCheck, ArrowUpRight, TrendingUp, Users, ShoppingCart, Wine, Truck, Package, DollarSign } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useVinos } from "../hooks/useWineData";
import { useClientes } from "../hooks/useWineData";
import { useIngresos } from "../hooks/useWineData";
import { useTransferencias } from "../hooks/useWineData";
import { useDashboardStats } from "../hooks/useWineData";
import { formatCurrency } from "../data/constants";
import { WINE_TYPE_LABELS } from "../data/constants";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: vinosData } = useVinos({ limit: 1 });
  const { data: clientesData } = useClientes({ page: 1, limit: 1 });
  const { data: ingresosData } = useIngresos({ page: 1, limit: 1 });
  const { data: transferenciasData } = useTransferencias({ page: 1, limit: 1 });

  const getTotal = (data) => {
    if (!data) return 0;
    if (data.total !== undefined) return data.total;
    if (data.metadata?.total !== undefined) return data.metadata.total;
    return 0;
  };

  const totalVinos = getTotal(vinosData);
  const totalClientes = getTotal(clientesData);
  const totalIngresos = getTotal(ingresosData);
  const totalTransferencias = getTotal(transferenciasData);

  const { data: recentVinos } = useVinos({ limit: 5, page: 1 });
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();

  if (statsError) {
    return (
      <div className="p-6 text-center text-error">
        <p>Error cargando estadísticas: {statsError.message}</p>
        <Button onClick={() => window.location.reload()} variant="secondary" className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  const statsData = stats?.data;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-text">Panel de control</h1>
          <p className="text-md text-text-muted mt-1">Resumen general de Bodegas del Atuel.</p>
        </div>
        <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
          Exportar reporte
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NavLink to="/dashboard/vinos" className="block">
          <Card variant="bordered" padding="lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <p className="text-md text-text-muted">Total vinos</p>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex-center">
                  <Wine className="w-5 h-5 text-primary" />
                </div>
              </div>
              <CardTitle className="text-5xl font-semibold text-text">{totalVinos}</CardTitle>
              <CardDescription>En catálogo</CardDescription>
            </CardHeader>
          </Card>
        </NavLink>

        <NavLink to="/dashboard/clientes" className="block">
          <Card variant="bordered" padding="lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <p className="text-md text-text-muted">Clientes</p>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </div>
              <CardTitle className="text-5xl font-semibold text-text">{totalClientes}</CardTitle>
              <CardDescription>Registrados</CardDescription>
            </CardHeader>
          </Card>
        </NavLink>

        <NavLink to="/dashboard/ingresos" className="block">
          <Card variant="bordered" padding="lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <p className="text-md text-text-muted">Ingresos</p>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex-center">
                  <LayoutDashboard className="w-5 h-5 text-primary" />
                </div>
              </div>
              <CardTitle className="text-5xl font-semibold text-text">{totalIngresos}</CardTitle>
              <CardDescription>Documentos</CardDescription>
            </CardHeader>
          </Card>
        </NavLink>

        <NavLink to="/dashboard/transferencias" className="block">
          <Card variant="bordered" padding="lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <p className="text-md text-text-muted">Transferencias</p>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex-center">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
              </div>
              <CardTitle className="text-5xl font-semibold text-text">{totalTransferencias}</CardTitle>
              <CardDescription>Movimientos</CardDescription>
            </CardHeader>
          </Card>
        </NavLink>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vinos recientes */}
        <Card variant="bordered" padding="lg">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <CardTitle>Vinos recientes</CardTitle>
              <CardDescription>Últimos agregados al catálogo</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/vinos")} rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}>
              Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentVinos?.data?.slice(0, 5).map((vino) => (
                <div key={vino.codigo_vino} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex-center">
                      <Wine className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-text">{vino.nombre}</p>
                      <p className="text-xs text-text-muted">{WINE_TYPE_LABELS[vino.tipo] || vino.tipo} · {vino.aniada}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-text">{formatCurrency(vino.precio)}</p>
                    <p className="text-xs text-text-muted">{vino.graduacion}% · {vino.volumen_ml}ml</p>
                  </div>
                </div>
              ))}
              {(!recentVinos?.data || recentVinos.data.length === 0) && (
                <p className="text-center text-text-muted py-8">No hay vinos en el catálogo</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas rápidas del backend */}
        <Card variant="bordered" padding="lg">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <CardTitle>Estadísticas rápidas</CardTitle>
              <CardDescription>Métricas clave del negocio</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/vinos")} rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}>
              Ver todos
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {statsLoading
              ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 bg-neutral-200 rounded-lg animate-pulse" />
                  ))}
                </div>
              )
              : (
                <div className="grid grid-cols-2 gap-4">
                  {/* Stock depósito */}
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-primary font-semibold uppercase tracking-wide">Stock Depósito</p>
                        <p className="text-3xl font-bold text-text">{statsData?.stock?.total_deposito?.toLocaleString() ?? "0"}</p>
                        <p className="text-xs text-text-muted">Botellas en depósito</p>
                      </div>
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </div>
                  {/* Stock salas */}
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-primary font-semibold uppercase tracking-wide">Stock Salas</p>
                        <p className="text-3xl font-bold text-text">{statsData?.stock?.total_salas?.toLocaleString() ?? "0"}</p>
                        <p className="text-xs text-text-muted">Botellas en sucursales</p>
                      </div>
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex-center">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </div>
                  {/* Stock crítico */}
                  <div className="p-4 bg-error/5 rounded-lg border border-error/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-error font-semibold uppercase tracking-wide">Stock Crítico</p>
                        <p className="text-3xl font-bold text-text">{statsData?.stock?.criticos ?? 0}</p>
                        <p className="text-xs text-text-muted">Menos de 12 botellas</p>
                      </div>
                      <div className="w-8 h-8 bg-error/10 rounded-lg flex-center">
                        <Truck className="w-5 h-5 text-error" />
                      </div>
                    </div>
                  </div>
                  {/* Sin stock en sala */}
                  <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-warning font-semibold uppercase tracking-wide">Sin Stock Sala</p>
                        <p className="text-3xl font-bold text-text">{statsData?.stock?.sin_stock_sala ?? 0}</p>
                        <p className="text-xs text-text-muted">Con stock en depósito</p>
                      </div>
                      <div className="w-8 h-8 bg-warning/10 rounded-lg flex-center">
                        <Database className="w-5 h-5 text-warning" />
                      </div>
                    </div>
                  </div>
                  {/* Ventas último mes */}
                  <div className="p-4 bg-green/5 rounded-lg border border-green/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-green font-semibold uppercase tracking-wide">Ventas Último Mes</p>
                        <p className="text-3xl font-bold text-text">{formatCurrency(statsData?.ventas?.ultimo_mes?.monto ?? 0)}</p>
                        <p className="text-xs text-text-muted">{statsData?.ventas?.ultimo_mes?.botellas ?? 0} botellas</p>
                      </div>
                      <div className="w-8 h-8 bg-green/10 rounded-lg flex-center">
                        <DollarSign className="w-5 h-5 text-green" />
                      </div>
                    </div>
                  </div>
                  {/* Valor inventario */}
                  <div className="p-4 bg-blue/5 rounded-lg border border-blue/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-blue font-semibold uppercase tracking-wide">Valor Inventario</p>
                        <p className="text-3xl font-bold text-text">{formatCurrency(statsData?.valor_inventario_total ?? 0)}</p>
                        <p className="text-xs text-text-muted">Depósito valorizado</p>
                      </div>
                      <div className="w-8 h-8 bg-blue/10 rounded-lg flex-center">
                        <ClipboardCheck className="w-5 h-5 text-blue" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between text-xs text-text-light">
        <span>Datos actualizados en tiempo real desde la API</span>
        <span>v1.0.0 · Uso interno</span>
      </div>
    </div>
  );
}