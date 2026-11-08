import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui";
import { Button, Input, Select, Badge, Table } from "../components/ui";
import { Plus, Download, Search, Columns, Filter, X, ChevronRight, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import { useVinos } from "../hooks/useWineData";
import { WINE_TYPE_LABELS, WINE_TYPE_VARIANTS, formatCurrency, formatDate } from "../data/constants";
import { useAuth } from "../hooks";

const TABS = [
  { id: "all", label: "Todos", count: null },
  { id: "tinto", label: "Tintos", count: null },
  { id: "blanco", label: "Blancos", count: null },
  { id: "rosado", label: "Rosados", count: null },
  { id: "espumante", label: "Espumantes", count: null },
];

const SORT_OPTIONS = [
  { value: "precio", label: "Precio" },
  { value: "aniada", label: "Añada" },
  { value: "graduacion", label: "Graduación" },
];

const SORT_DIRECTION_OPTIONS = [
  { value: "asc", label: "Ascendente", icon: <ChevronUp className="w-4 h-4" /> },
  { value: "desc", label: "Descendente", icon: <ChevronDown className="w-4 h-4" /> },
];

export default function Vinos() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    tipo: "",
  });
  const [sortConfig, setSortConfig] = useState({ key: "precio", direction: "desc" });
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const pageSize = 20;

  // Build API params from filters
  const apiParams = {
    page,
    limit: pageSize,
    tipo: activeTab !== "all" ? activeTab : (filters.tipo || undefined),
    search: search || undefined,
  };

  const { data, isLoading, error } = useVinos(apiParams);
  const { esAdmin } = useAuth();

  const vinos = data?.data || [];
  const total = data?.total || 0;

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedVinos = [...vinos].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const hasActiveFilters = filters.tipo;

  const renderWineName = (row) => (
    <div>
      <p className="font-medium text-primary">{row.nombre}</p>
      <p className="text-xs text-text-muted">Código: {row.codigo_vino}</p>
    </div>
  );

  const renderTipo = (row) => (
    <Badge variant={WINE_TYPE_VARIANTS[row.tipo] || "default"} dot>
      {WINE_TYPE_LABELS[row.tipo] || row.tipo}
    </Badge>
  );

  const renderPrecio = (row) => (
    <span className="font-medium text-text">{formatCurrency(row.precio)}</span>
  );

  const renderGraduacion = (row) => (
    <span className="text-text">{row.graduacion}%</span>
  );

  const renderVolume = (row) => (
    <span className="text-text">{row.volumen_ml} ml</span>
  );

  const renderStock = (row) => (
    <span className="text-text">{row.stock_global ?? row.stock_deposito ?? "-"}</span>
  );

  const renderActions = (row) => (
    <div className="flex items-center gap-2">
      <button
        className="p-1.5 rounded-lg hover:bg-hover transition-colors"
        onClick={() => { if (!esAdmin) { alert("No tiene permisos para realizar esta acción. Solo el administrador puede crear, editar o eliminar datos."); return; } navigate(`/dashboard/vinos/${row.codigo_vino}/edit`); }}
        aria-label={"Editar " + row.nombre}
      >
        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
      </button>
      <button
        className="p-1.5 rounded-lg hover:bg-hover transition-colors"
        onClick={() => navigate("/dashboard/vinos/" + row.codigo_vino)}
        aria-label={"Ver detalle " + row.nombre}
      >
        <ChevronRight className="w-4 h-4 text-text-muted" />
      </button>
    </div>
  );

  const tableColumns = [
    { key: "nombre", header: "Vino / Código", width: "300px", render: renderWineName },
    { key: "tipo", header: "Tipo", width: "100px", align: "center", render: renderTipo },
    { key: "aniada", header: "Añada", width: "80px", align: "center" },
    { key: "precio", header: "Precio", width: "120px", align: "right", render: renderPrecio },
    { key: "graduacion", header: "Grad.", width: "70px", align: "center", render: renderGraduacion },
    { key: "volumen_ml", header: "Volumen", width: "90px", align: "right", render: renderVolume },
    { key: "stock_global", header: "Stock", width: "80px", align: "center", render: renderStock },
    { key: "actions", header: "", width: "80px", align: "center", render: renderActions },
  ];

  if (error) {
    return (
      <div className="p-6 text-center text-error">
        <p>Error cargando vinos: {error.message}</p>
        <Button onClick={() => window.location.reload()} variant="secondary" className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-text">Catálogo de Vinos</h1>
          <p className="text-md text-text-muted mt-1">Gestiona tu catálogo de vinos, stock y precios.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => { if (!esAdmin) { alert("No tiene permisos para realizar esta acción. Solo el administrador puede crear, editar o eliminar datos."); return; } navigate("/dashboard/vinos/new"); }}>
            Nuevo Vino
          </Button>
        </div>
      </div>

      <Card variant="bordered" padding="none" className="overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-1 border-b border-border pb-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setPage(1); }}
                className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors duration-fast ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted hover:text-text hover:border-border"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <CardContent className="p-0">
          <div className="p-5 border-b border-border">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, código, cepa..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-white text-text placeholder:text-text-light focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-muted">{total} vinos</span>
                <Button variant="secondary" leftIcon={<Columns className="w-4 h-4" />}>
                  Columnas
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <ArrowUpDown className="w-4 h-4" />
                Ordenar por
              </div>
              <div className="flex items-center gap-2">
                <Select
                  options={SORT_OPTIONS}
                  placeholder="Campo: Precio"
                  value={sortConfig.key}
                  onChange={(e) => setSortConfig((prev) => ({ ...prev, key: e.target.value, direction: "desc" }))}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortConfig((prev) => ({ ...prev, direction: prev.direction === "asc" ? "desc" : "asc" }))}
                  className="flex items-center gap-1.5"
                >
                  {sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <span>{sortConfig.direction === "asc" ? "Asc" : "Desc"}</span>
                </Button>
              </div>
              {filters.tipo && (
                <button
                  onClick={() => { setFilters({ tipo: "" }); setPage(1); }}
                  className="ml-auto text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpiar tipo
                </button>
              )}
            </div>
          </div>

          <Table
            columns={tableColumns}
            data={sortedVinos}
            keyExtractor={(row) => String(row.codigo_vino)}
            selectable
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            sortKey={sortConfig.key}
            sortDirection={sortConfig.direction}
            onSort={handleSort}
            loading={isLoading}
            emptyMessage="No se encontraron vinos"
            pagination={{
              page,
              pageSize,
              total,
              onPageChange: setPage,
              onPageSizeChange: (size) => { setPage(1); },
            }}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-text-muted">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          Información actualizada desde la API
        </div>
        <span>v1.0.0 · Uso interno</span>
      </div>
    </div>
  );
}