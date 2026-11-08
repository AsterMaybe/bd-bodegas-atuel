import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui";
import { Button, Input, Select, Badge } from "../ui";
import { ChevronDown, Loader2, Check, ArrowRight, X, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

export function EditPage({
  entityName,
  entityNamePlural,
  getHook,
  createHook,
  updateHook,
  fields,
  getId = (item) => item.id || item.codigo_vino || item.id_cliente || item.id_finca || item.id_documento,
  listEndpoint,
  detailEndpoint,
  createEndpoint,
  editEndpoint,
}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;

  const { data: item, isLoading, error } = isNew ? { data: null, isLoading: false, error: null } : getHook(id);

  const createMutation = createHook();
  const updateMutation = updateHook();

  const [formData, setFormData] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(z.object(
      fields.reduce((acc, field) => {
        let validator = z.string();
        if (field.required) validator = validator.min(1, `${field.label} es requerido`);
        if (field.type === "number") validator = z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Debe ser un número válido");
        if (field.type === "email") validator = z.string().email("Email inválido");
        if (field.pattern) validator = z.string().regex(field.pattern, field.patternMessage || "Formato inválido");
        acc[field.name] = validator;
        return acc;
      }, {})
    )),
    defaultValues: {},
  });

  useEffect(() => {
    if (!isNew && id && item) {
      setFormData(item);
      Object.keys(item).forEach((key) => {
        setValue(key, item[key]);
      });
    }
  }, [id, item, setValue]);

  const onSubmit = async (data) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (isNew) {
        await createMutation.mutateAsync(data);
      } else {
        await updateMutation.mutateAsync({ id, data });
      }
      navigate(`/${entityNamePlural}`);
    } catch (err) {
      setErrorMessage(err.data?.detail || err.message || "Error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/${entityNamePlural}`);
  };

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !isNew) {
    return (
      <div className="p-6 text-center text-error">
        <p>Error cargando ${entityName.toLowerCase()}: {error.message}</p>
        <Button onClick={() => navigate(`/${entityNamePlural}`)} variant="secondary" className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-text">{isNew ? `Nuevo ${entityName}` : `Editar ${entityName}`}</h1>
          <p className="text-md text-text-muted mt-1">
            {isNew ? `Completa la información del nuevo ${entityName.toLowerCase()}.` : `Modifica los datos de ${formData?.nombre || formData?.nombre_razon || entityName}.`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {errorMessage && (
          <div className="p-3 bg-error-light border border-error rounded-lg text-sm text-error flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="bg-white border border-border rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between mb-6">
            <CardTitle>Información del ${entityName.toLowerCase()}</CardTitle>
            <CardDescription>* Campos obligatorios</CardDescription>
          </div>
          
          {fields.map((field) => (
            <div key={field.name} className={clsx(field.className, field.grid ? `grid grid-cols-1 ${field.grid}` : "")}>
              {field.type === "select" ? (
                <Select
                  label={field.label}
                  options={field.options}
                  placeholder={field.placeholder}
                  error={errors[field.name]?.message}
                  required={field.required}
                  value={formData[field.name] || ""}
                  onChange={(e) => { setFormData(prev => ({ ...prev, [field.name]: e.target.value })); register(field.name).onChange(e); }}
                  required={field.required}
                />
              ) : field.type === "textarea" ? (
                <div className="w-full">
                  <label className="block text-md font-semibold text-text mb-2">
                    {field.label}
                    {field.required && <span className="text-primary ml-1">*</span>}
                  </label>
                  <textarea
                    value={formData[field.name] || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                    rows={field.rows || 4}
                    className="w-full px-3 rounded-lg border border-border bg-white text-text placeholder:text-text-light focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 resize-none"
                    placeholder={field.placeholder}
                  />
                </div>
              ) : field.type === "checkbox" ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[field.name] || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.checked }))}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-normal text-text">{field.label}</span>
                </label>
              ) : (
                <Input
                  label={field.label}
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  error={errors[field.name]?.message}
                  required={field.required}
                  value={formData[field.name] || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                  leftIcon={field.leftIcon}
                  rightIcon={field.rightIcon}
                  readOnly={field.readOnly}
                />
              )}
            </div>
          ))}

          <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
            <Button type="button" variant="secondary" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isSubmitting || createMutation.isPending || updateMutation.isPending ? "Guardando..." : isNew ? `Crear ${entityName}` : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function EntityListPage({
  entityName,
  entityNamePlural,
  listHook,
  createHook,
  updateHook,
  deleteHook,
  fields,
  listFields,
  searchFields = ["nombre"],
  filterFields = [],
  tabs = [],
  formatListItem,
  getId = (item) => item.id || item.codigo_vino || item.id_cliente || item.id_finca || item.id_documento,
  listEndpoint,
  detailEndpoint,
  createEndpoint,
  editEndpoint,
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const apiParams = {
    page,
    limit: pageSize,
    tipo: activeTab !== "all" ? activeTab : (filters.tipo || undefined),
    search: search || undefined,
  };

  const { data, isLoading, error } = listHook(apiParams);

  const items = data?.data || [];
  const total = data?.total || 0;

  const createMutation = createHook();
  const updateMutation = updateHook();
  const deleteMutation = deleteHook();

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

  const sortedData = [...(items || [])].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);

  const handleOpenCreate = () => {
    navigate(`/${entityNamePlural}/new`);
  };

  const handleEdit = (item) => {
    navigate(`/${entityNamePlural}/${getId(item)}/edit`);
  };

  const handleView = (item) => {
    navigate(`/${entityNamePlural}/${getId(item)}`);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`¿Eliminar ${entityName} ${item.nombre || item.nombre_razon || getId(item)}?`)) return;
    try {
      await deleteMutation.mutateAsync(getId(item));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-text">{entityNamePlural}</h1>
          <p className="text-md text-text-muted mt-1">Gestiona ${entityNamePlural.toLowerCase()}.</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
          Nuevo ${entityName}
        </Button>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-1 border-b border-border pb-4">
            {tabs.map((tab) => (
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-white text-text placeholder:text-text-light focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-muted">{total} registros</span>
              <Button variant="secondary" leftIcon={<Columns className="w-4 w-4" />}>
                Columnas
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Filter className="w-4 h-4" />
              Filtrar por
            </div>
            <Select
              options={[
    { value: "", label: "Todos" },
    { value: "tinto", label: "Tinto" },
    { value: "blanco", label: "Blanco" },
    { value: "rosado", label: "Rosado" },
    { value: "espumante", label: "Espumante" },
  ]}
              placeholder="Tipo: Todos"
              value={filters.tipo}
              onChange={(e) => handleFilterChange("tipo", e.target.value)}
            />
            {hasActiveFilters && (
              <button
                onClick={() => { setFilters({ tipo: "" }); setPage(1); }}
                className="ml-auto text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
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
                {listFields.map((field) => (
                  <th
                    key={field.key}
                    className="px-3 py-3 text-left font-medium text-text-muted text-sm whitespace-nowrap"
                  >
                    {field.label}
                  </th>
                ))}
                <th className="px-3 py-3 text-left font-medium text-text-muted text-sm whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.map((item) => (
                <tr key={getId(item)} className="transition-colors duration-fast hover:bg-hover">
                  <td className="px-3 py-3">
                    <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                  </td>
                  {listFields.map((field) => (
                    <td key={field.key} className="px-3 py-3 text-sm text-text">
                      {field.render ? field.render(item) : String(item[field.key] ?? "")}
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1.5 rounded-lg hover:bg-hover transition-colors"
                        onClick={() => handleView(item)}
                        aria-label={`Ver ${item.nombre || item.nombre_razon || getId(item)}`}
                      >
                        <Eye className="w-4 h-4 text-text-muted" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-hover transition-colors"
                        onClick={() => handleEdit(item)}
                        aria-label={`Editar ${item.nombre || item.nombre_razon || getId(item)}`}
                      >
                        <Edit className="w-4 h-4 text-text-muted" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-hover transition-colors"
                        onClick={() => handleDelete(item)}
                        aria-label={`Eliminar ${item.nombre || item.nombre_razon || getId(item)}`}
                      >
                        <Trash2 className="w-4 h-4 text-error" />
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