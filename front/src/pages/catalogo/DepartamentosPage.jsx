import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CrudList } from "../components/CrudComponents";
import { useDepartamentos, useCreateDepartamento, useUpdateDepartamento, useDeleteDepartamento } from "../hooks/useWineData";
import { formatDate } from "../data/constants";

const TABS = [
  { id: "all", label: "Todos" },
];

const COLUMNS = [
  { key: "id_depto", header: "ID", width: "80px", align: "center" },
  { key: "nombre_depto", header: "Nombre", width: "250px" },
  { key: "provincia", header: "Provincia", width: "150px" },
];

const FILTER_OPTIONS = {
  provincia: [
    { value: "", label: "Todas" },
    { value: "Mendoza", label: "Mendoza" },
    { value: "San Juan", label: "San Juan" },
    { value: "San Luis", label: "San Luis" },
  ],
};

export default function DepartamentosPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ provincia: "" });
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const apiParams = {
    page,
    limit: pageSize,
  };

  const { data, isLoading, error } = useDepartamentos(apiParams);

  const departamentos = data?.data || [];
  const total = data?.total || 0;

  const createMutation = useCreateDepartamento();
  const updateMutation = useUpdateDepartamento();
  const deleteMutation = useDeleteDepartamento();

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredData = [...(departamentos || [])].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedData = filteredData;

  const handleOpenCreate = () => {
    navigate("/catalogo/departamentos/new");
  };

  const handleEdit = (item) => {
    navigate(`/catalogo/departamentos/${item.id_depto}/edit`);
  };

  const handleView = (item) => {
    navigate(`/catalogo/departamentos/${item.id_depto}`);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`¿Eliminar departamento ${item.nombre_depto}?`)) return;
    try {
      await deleteMutation.mutateAsync(item.id_depto);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-text">Departamentos</h1>
          <p className="text-md text-text-muted mt-1">Gestiona los departamentos geográficos.</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate("/catalogo/departamentos/new")}>
          Nuevo Departamento
        </Button>
      </div>

      <CrudList
        title="Departamentos"
        description="Gestiona los departamentos geográficos."
        columns={COLUMNS}
        data={paginatedData}
        total={total}
        isLoading={isLoading}
        error={error}
        onCreate={handleOpenCreate}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          { key: "provincia", label: "Provincia", options: FILTER_OPTIONS.provincia, placeholder: "Provincia: Todas" },
        ]}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={TABS}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        sortConfig={sortConfig}
        onSort={handleSort}
        renderActions={(item) => (
          <div className="flex items-center gap-2">
            <button
              className="p-1.5 rounded-lg hover:bg-hover transition-colors"
              onClick={() => handleView(item)}
              aria-label={`Ver ${item.nombre_depto}`}
            >
              <Eye className="w-4 h-4 text-text-muted" />
            </button>
            <button
              className="p-1.5 rounded-lg hover:bg-hover transition-colors"
              onClick={() => handleEdit(item)}
              aria-label={`Editar ${item.nombre_depto}`}
            >
              <Edit className="w-4 h-4 text-text-muted" />
            </button>
            <button
              className="p-1.5 rounded-lg hover:bg-hover transition-colors"
              onClick={() => handleDelete(item)}
              aria-label={`Eliminar ${item.nombre_depto}`}
            >
              <Trash2 className="w-4 h-4 text-error" />
            </button>
          </div>
        )}
      />
    </div>
  );
}