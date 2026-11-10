import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CrudList } from "../../components/CrudComponents";
import { useLocalidades, useCreateLocalidad, useUpdateLocalidad, useDeleteLocalidad } from "../../hooks/useWineData";
import { formatDate } from "../../data/constants";

const TABS = [
  { id: "all", label: "Todas" },
];

const COLUMNS = [
  { key: "codigo_postal", header: "Código Postal", width: "150px", align: "center" },
  { key: "nombre", header: "Nombre", width: "250px" },
  { key: "provincia", header: "Provincia", width: "150px" },
  { key: "cuit_encargado", header: "CUIT Encargado", width: "180px" },
];

const FILTER_OPTIONS = {
  provincia: [
    { value: "", label: "Todas" },
    { value: "Mendoza", label: "Mendoza" },
    { value: "San Juan", label: "San Juan" },
    { value: "San Luis", label: "San Luis" },
  ],
};

export default function LocalidadesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ provincia: "" });
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const apiParams = { page, limit: 20 };

  const { data, isLoading, error } = useLocalidades(apiParams);

  const localidades = data?.data || [];
  const total = data?.total || 0;

  const createMutation = useCreateLocalidad();
  const updateMutation = useUpdateLocalidad();
  const deleteMutation = useDeleteLocalidad();

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredData = [...(localidades || [])].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedData = filteredData;

  const handleOpenCreate = () => {
    navigate("/catalogo/localidades/new");
  };

  const handleEdit = (item) => {
    navigate(`/catalogo/localidades/${item.codigo_postal}/edit`);
  };

  const handleView = (item) => {
    navigate(`/catalogo/localidades/${item.codigo_postal}`);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`¿Eliminar localidad ${item.nombre}?`)) return;
    try {
      await deleteMutation.mutateAsync(item.codigo_postal);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const TABS = [
    { id: "all", label: "Todas" },
  ];

  const FILTER_OPTIONS = {
    provincia: [
      { value: "", label: "Todas" },
      { value: "Mendoza", label: "Mendoza" },
      { value: "San Juan", label: "San Juan" },
      { value: "San Luis", label: "San Luis" },
    ],
  };

  const COLUMNS = [
    { key: "codigo_postal", header: "Código Postal", width: "150px", align: "center" },
    { key: "nombre", header: "Nombre", width: "250px" },
    { key: "provincia", header: "Provincia", width: "150px" },
    { key: "cuit_encargado", header: "CUIT Encargado", width: "180px" },
  ];

  const FILTER_OPTIONS_LOCAL = {
    provincia: [
      { value: "", label: "Todas" },
      { value: "Mendoza", label: "Mendoza" },
      { value: "San Juan", label: "San Juan" },
      { value: "San Luis", label: "San Luis" },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-text">Localidades</h1>
          <p className="text-md text-text-muted mt-1">Gestiona las localidades.</p>
        </div>
        <button onClick={() => navigate("/catalogo/localidades/new")} className="px-5 py-2.5 bg-primary text-white rounded-lg font-semibold text-md hover:bg-primary/90 active:bg-primary/80 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
          Nueva Localidad
        </button>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
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

        <div className="p-5 border-b border-border">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div className="relative w-full lg:w-96">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input
                type="text"
                placeholder="Buscar por nombre, código postal..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-white text-text placeholder:text-text-light focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-muted">{total} registros</span>
              <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-text hover:bg-hover transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                Columnas
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17a1 1 0 01-1 1H6a1 1 0 01-1-1V9.586a1 1 0 00-.293-.707L3 8.414V4z"/></svg>
              Filtrar por
            </div>
            <select
              value={filters.provincia || ""}
              onChange={(e) => setFilters({ ...filters, provincia: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg bg-white text-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {FILTER_OPTIONS_LOCAL.provincia.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {(filters.provincia) && (
              <button
                onClick={() => setFilters({ provincia: "" })}
                className="ml-auto text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-border">
              <tr>
                <th className="w-10 px-3 py-3 text-left">
                  <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                </th>
                <th className="px-3 py-3 text-left font-medium text-text-muted text-sm whitespace-nowrap">Código Postal</th>
                <th className="px-3 py-3 text-left font-medium text-text-muted text-sm whitespace-nowrap">Nombre</th>
                <th className="px-3 py-3 text-left font-medium text-text-muted text-sm whitespace-nowrap">Provincia</th>
                <th className="px-3 py-3 text-left font-medium text-text-muted text-sm whitespace-nowrap">CUIT Encargado</th>
                <th className="px-3 py-3 text-left font-medium text-text-muted text-sm whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.map((item) => (
                <tr key={item.codigo_postal} className="transition-colors duration-fast hover:bg-hover">
                  <td className="px-3 py-3">
                    <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                  </td>
                  <td className="px-3 py-3 text-sm text-text">{item.codigo_postal}</td>
                  <td className="px-3 py-3 text-sm text-text">{item.nombre}</td>
                  <td className="px-3 py-3 text-sm text-text">{item.provincia}</td>
                  <td className="px-3 py-3 text-sm text-text-muted">{item.cuit_encargado}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-hover transition-colors" onClick={() => navigate(`/catalogo/localidades/${item.codigo_postal}`)} aria-label={`Ver ${item.nombre}`}>
                        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-hover transition-colors" onClick={() => navigate(`/catalogo/localidades/${item.codigo_postal}/edit`)} aria-label={`Editar ${item.nombre}`}>
                        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-hover transition-colors" onClick={() => { if (window.confirm(`¿Eliminar localidad ${item.nombre}?`)) { /* delete */ }} aria-label={`Eliminar ${item.nombre}`}>
                        <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-text-muted">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          Datos desde la API
        </div>
        <span>v1.0.0 · Uso interno</span>
      </div>
    </div>
  );
}