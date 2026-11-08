import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useClientes, useCreateCliente, useUpdateCliente, useDeleteCliente } from "../hooks/useWineData";
import { formatDate } from "../data/constants";
import { useAuth } from "../hooks";
import { Plus, Search, ChevronLeft, ChevronRight, User, Trash2, Edit } from "lucide-react";

const TABS = [
  { id: "all", label: "Todos" },
  { id: "socio", label: "Socios" },
  { id: "distribuidor", label: "Distribuidores" },
  { id: "exportador", label: "Exportadores" },
];

export default function Clientes() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Parámetros para la API (SOLO server-side pagination)
  const apiParams = useMemo(() => ({
    page,
    limit: pageSize,
    tipo: activeTab !== "all" ? activeTab : undefined,
    search: search || undefined,
  }), [activeTab, search, page]);

  const { data, isLoading, error, refetch } = useClientes(apiParams);
  const { esAdmin } = useAuth();

  const clientes = data?.data || [];
  const metadata = data?.metadata || { total: 0, total_pages: 1, has_next: false, has_prev: false };

  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente();
  const deleteMutation = useDeleteCliente();

  const handleDelete = async (item) => {
    if (!window.confirm(`¿Eliminar cliente ${item.nombre_razon}?`)) return;
    try {
      await deleteMutation.mutateAsync(item.id_cliente);
      refetch(); // Refresh server data
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1); // Reset a página 1 al buscar
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
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
        <p>Error cargando clientes: {error.message}</p>
        <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">
          Reintentar
        </button>
      </div>
    );
  }

  const renderClientName = (row) => (
    <div>
      <p className="font-medium text-primary">{row.nombre_razon}</p>
      <p className="text-xs text-text-muted">{row.tipo_doc} {row.nro_doc}</p>
    </div>
  );

  const renderTipo = (row) => {
    const colors = { 
      socio: "bg-primary-light text-primary", 
      distribuidor: "bg-warning-light text-warning", 
      exportador: "bg-success-light text-success" 
    };
    const labels = { socio: "Socio", distribuidor: "Distribuidor", exportador: "Exportador" };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors[row.tipo] || "bg-border text-text-muted"}`}>
        {labels[row.tipo] || row.tipo}
      </span>
    );
  };

  const renderActions = (row) => (
    <div className="flex items-center gap-1.5 justify-center">
      <button
        className="p-1.5 rounded-lg hover:bg-hover transition-colors"
        onClick={() => { if (!esAdmin) { alert("No tiene permisos para realizar esta acción. Solo el administrador puede crear, editar o eliminar datos."); return; } navigate(`/dashboard/clientes/${row.id_cliente}/edit`); }}
        aria-label={`Ver/Editar ${row.nombre_razon}`}
      >
        <User className="w-4 h-4 text-text-muted" />
      </button>
      <button
        className="p-1.5 rounded-lg hover:bg-hover transition-colors"
        onClick={() => { if (!esAdmin) { alert("No tiene permisos para realizar esta acción. Solo el administrador puede crear, editar o eliminar datos."); return; } navigate(`/dashboard/clientes/${row.id_cliente}/edit`); }}
        aria-label={`Editar ${row.nombre_razon}`}
      >
        <Edit className="w-4 h-4 text-text-muted" />
      </button>
      <button
        className="p-1.5 rounded-lg hover:bg-hover transition-colors"
        onClick={() => { if (!esAdmin) { alert("No tiene permisos para realizar esta acción. Solo el administrador puede crear, editar o eliminar datos."); return; } handleDelete(row); }}
        aria-label={`Eliminar ${row.nombre_razon}`}
      >
        <Trash2 className="w-4 h-4 text-error" />
      </button>
    </div>
  );

  const tableColumns = [
    { key: "nombre_razon", header: "Cliente / Doc", width: "300px", render: renderClientName },
    { key: "tipo", header: "Tipo", width: "120px", align: "center", render: renderTipo },
    { key: "direccion", header: "Dirección", width: "200px", render: (row) => <span className="text-text-muted">{row.direccion || "-"}</span> },
    { key: "codigo_postal", header: "Cód. Postal", width: "110px", align: "center" },
    { key: "fecha_alta", header: "Alta", width: "120px", align: "center", render: (row) => <span className="text-text-muted">{formatDate(row.fecha_alta)}</span> },
    { key: "actions", header: "", width: "110px", align: "center", render: renderActions },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-text">Clientes</h1>
          <p className="text-md text-text-muted mt-1">Gestiona socios, distribuidores y exportadores.</p>
        </div>
        <button onClick={() => { if (!esAdmin) { alert("No tiene permisos para realizar esta acción. Solo el administrador puede crear, editar o eliminar datos."); return; } navigate("/dashboard/clientes/new"); }} className="px-5 py-2.5 bg-primary text-white rounded-lg font-semibold text-md hover:bg-primary/90 active:bg-primary/80 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        {/* Tabs de tipo */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-1 border-b border-border pb-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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

        {/* Buscador */}
        <div className="p-5 border-b border-border">
          <div className="relative w-full max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              type="text"
              placeholder="Buscar por nombre, documento..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-white text-text placeholder:text-text-light focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-text-muted">Cargando clientes...</div>
          ) : clientes.length === 0 ? (
            <div className="p-12 text-center text-text-muted">No se encontraron clientes</div>
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
                {clientes.map((item) => (
                  <tr key={item.id_cliente} className="transition-colors duration-fast hover:bg-hover">
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
              Mostrando {clientes.length} de {metadata.total} clientes · Página {metadata.page} de {metadata.total_pages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={prevPage}
                disabled={!metadata.has_prev || isLoading}
                className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium text-text hover:bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <button
                onClick={nextPage}
                disabled={!metadata.has_next || isLoading}
                className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium text-text hover:bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                aria-label="Página siguiente"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-text-muted">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          Datos desde la API (paginación servidor)
        </div>
        <span>v1.0.0 · Uso interno</span>
      </div>
    </div>
  );
}