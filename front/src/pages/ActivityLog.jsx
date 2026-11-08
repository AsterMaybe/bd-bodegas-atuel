import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useActividad } from "../hooks/useWineData";
import { formatDateTime } from "../data/constants";
import { Plus, Download, Search, Columns, Filter, X, ChevronLeft, ChevronRight, Clock, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Button } from "../components/ui";
import { Input } from "../components/ui";
import { Select } from "../components/ui";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui";
import { Badge } from "../components/ui";

const TABS = [
  { id: "all", label: "Todas" },
  { id: "INSERT", label: "Creaciones" },
  { id: "UPDATE", label: "Actualizaciones" },
  { id: "DELETE", label: "Eliminaciones" },
];

const OPERACION_COLORS = {
  INSERT: "bg-success-light text-success",
  UPDATE: "bg-primary-light text-primary",
  DELETE: "bg-error-light text-error",
};

const OPERACION_LABELS = {
  INSERT: "Creado",
  UPDATE: "Actualizado",
  DELETE: "Eliminado",
};

const OPERACION_ICONS = {
  INSERT: <CheckCircle className="w-3.5 h-3.5" />,
  UPDATE: <Clock className="w-3.5 h-3.5" />,
  DELETE: <AlertCircle className="w-3.5 h-3.5" />,
};

export default function ActivityLog() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTabla, setSelectedTabla] = useState("");
  const pageSize = 20;

  // Parámetros para la API (SOLO server-side pagination)
  const apiParams = useMemo(() => ({
    page,
    limit: pageSize,
    operacion: activeTab !== "all" ? activeTab : undefined,
    tabla: selectedTabla || undefined,
    search: search || undefined,
  }), [activeTab, search, selectedTabla, page]);

  const { data, isLoading, error, refetch } = useActividad(apiParams);

  const actividades = data?.data || [];
  const metadata = data?.metadata || { total: 0, total_pages: 1, has_next: false, has_prev: false };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPage(1);
  };

  const handleTablaChange = (value) => {
    setSelectedTabla(value);
    setPage(1);
  };

  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= metadata.total_pages) {
      setPage(newPage);
    }
  };

  const nextPage = () => goToPage(page + 1);
  const prevPage = () => goToPage(page - 1);

  if (error) {
    return (
      <div className="p-6 text-center text-error">
        <p>Error cargando actividad: {error.message}</p>
        <Button onClick={() => refetch()} variant="secondary" className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  const renderOperacion = (row) => (
    <Badge variant="outline" className={OPERACION_COLORS[row.operacion] || "bg-border text-text-muted"}>
      {OPERACION_ICONS[row.operacion] || null}
      {OPERACION_LABELS[row.operacion] || row.operacion}
    </Badge>
  );

  const renderTabla = (row) => (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-light text-primary">
      {row.tabla_afectada}
    </span>
  );

  const renderAutor = (row) => (
    <span className="flex items-center gap-1 text-sm text-text">
      <span className="w-5 h-5 bg-primary-light text-primary rounded-full flex-center text-xs font-medium">
        {row.usuario?.charAt(0) || "?"}
      </span>
      {row.usuario}
    </span>
  );

  const tableColumns = [
    { key: "id_auditoria", header: "ID", width: "70px", align: "center" },
    { key: "operacion", header: "Tipo", width: "120px", align: "center", render: renderOperacion },
    { key: "tabla_afectada", header: "Tabla", width: "120px", align: "center", render: renderTabla },
    { key: "descripcion", header: "Descripción", width: "400px", render: (row) => <span className="text-text">{row.descripcion}</span> },
    { key: "usuario", header: "Usuario", width: "150px", render: renderAutor },
    { key: "fecha_hora", header: "Fecha/Hora", width: "180px", align: "center", render: (row) => <span className="text-text-muted">{formatDateTime(row.fecha_hora)}</span> },
  ];

  const getUniqueTablas = () => {
    const tablas = new Set(actividades.map(a => a.tabla_afectada));
    return Array.from(tablas).sort();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-text">Registro de actividad</h1>
          <p className="text-md text-text-muted mt-1">Historial de cambios y eventos del sistema.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
        </div>
      </div>

      <Card variant="bordered" padding="none" className="overflow-hidden">
        {/* Tabs de operación */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-1 border-b border-border pb-4">
            {TABS.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => handleTabChange(tab.id)}
                className="px-4 py-2 text-sm"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Buscador y filtros */}
        <CardContent className="p-5 border-b border-border">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
              <Input
                type="text"
                placeholder="Buscar en descripción, tabla, usuario..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-muted">{metadata.total} registros</span>
              <Button variant="secondary" leftIcon={<Columns className="w-4 h-4" />}>
                Columnas
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Filter className="w-4 h-4" />
              Filtrar tabla
            </div>
            <Select
              value={selectedTabla}
              onChange={(e) => handleTablaChange(e.target.value)}
              options={[{ value: "", label: "Todas las tablas" }, ...getUniqueTablas().map(t => ({ value: t, label: t }))]}
              placeholder="Todas las tablas"
              className="w-48"
            />
            {selectedTabla && (
              <button
                onClick={() => handleTablaChange("")}
                className="ml-auto text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Limpiar tabla
              </button>
            )}
          </div>
        </CardContent>

        {/* Tabla */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-text-muted flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
              Cargando actividad...
            </div>
          ) : actividades.length === 0 ? (
            <div className="p-12 text-center text-text-muted">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron registros de actividad</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-border">
                <tr>
                  {tableColumns.map((col) => (
                    <th key={col.key} className={`px-3 py-3 text-left font-medium text-text-muted text-sm whitespace-nowrap ${col.align ? `text-${col.align}` : ""}`} style={{ width: col.width }}>
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {actividades.map((item) => (
                  <tr key={item.id_auditoria} className="transition-colors duration-fast hover:bg-hover">
                    {tableColumns.map((col) => (
                      <td key={col.key} className={`px-3 py-3 text-sm text-text ${col.align ? `text-${col.align}` : ""}`}>
                        {col.render ? col.render(item) : item[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación - Server-side */}
        {metadata.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <div className="text-sm text-text-muted">
              Mostrando {actividades.length} de {metadata.total} registros · Página {metadata.page} de {metadata.total_pages}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={prevPage} disabled={!metadata.has_prev || isLoading} leftIcon={<ChevronLeft className="w-4 h-4" />}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={nextPage} disabled={!metadata.has_next || isLoading} rightIcon={<ChevronRight className="w-4 h-4" />}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between text-sm text-text-muted">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Datos desde la API (auditoría real de base de datos)
        </div>
        <span>v1.0.0 · Uso interno</span>
      </div>
    </div>
  );
}