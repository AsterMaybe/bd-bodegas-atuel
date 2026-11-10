import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, Loader2, Check, ArrowRight, X } from "lucide-react";
import { CrudForm } from "../components/CrudComponents";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui";
import { Button, Input, Select, Badge } from "../components/ui";

export function createCrudPage({
  entityName,
  entityNamePlural,
  entityNameLower,
  listHook,
  detailHook,
  createHook,
  updateHook,
  deleteHook,
  fields,
  createFields,
  editFields,
  listFields,
  searchFields = ["nombre"],
  filterFields = [],
  tabs = [],
  formatListItem,
  getId = (item) => item.id,
  listEndpoint,
  detailEndpoint,
  createEndpoint,
  editEndpoint,
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "all");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const pageSize = 20;

  const apiParams = {
    page,
    limit: pageSize,
    tipo: activeTab !== "all" ? activeTab : (filters.tipo || undefined),
  };

  const { data, isLoading, error } = listHook(apiParams);
  const items = data?.data || [];
  const total = data?.total || 0;

  const createMutation = createHook();
  const updateMutation = updateHook();
  const deleteMutation = deleteHook();

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredItems = [...(items || [])].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedData = filteredItems;

  const handleSearch = (value) => {
    setSearch(value);
    // Could implement client-side search or server-side
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleView = (item) => {
    navigate(`/${entityNameLower}/${getId(item)}`);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`¿Eliminar ${formatListItem(item)}?`)) return;
    try {
      await deleteMutation.mutateAsync(getId(item));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (data) => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: getId(editingItem), data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setShowForm(false);
      setEditingItem(null);
    } catch (err) {
      // Error handled by mutation
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const isFormLoading = createMutation.isPending || updateMutation.isPending;

  const formFields = editingItem ? (editFields || fields) : (createFields || fields);

  const formItem = editingItem || {};

  const formFieldValues = fields.reduce((acc, field) => {
    acc[field.name] = formItem[field.name] || field.defaultValue || "";
    return acc;
  }, {});

  const schema = z.object(
    Object.fromEntries(fields.map((f) => [f.name, z.string().optional()]))
  );
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: formFieldValues,
    mode: "onChange",
  });
  const { register, handleSubmit, formState: { errors } } = form;

  const onSubmit = (data) => {
    try {
      if (editingItem) {
        updateMutation.mutateAsync({ id: getId(editingItem), data });
      } else {
        createMutation.mutateAsync(data);
      }
      setShowForm(false);
      setEditingItem(null);
    } catch (err) {
      // Error handled by mutation
    }
  };

  if (showForm) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-text">{editingItem ? `Editar ${entityName}` : `Nuevo ${entityName}`}</h1>
            <p className="text-md text-text-muted mt-1">
              {editingItem ? `Modifica los datos de ${formatListItem(formItem)}` : `Completa la información del nuevo ${entityName.toLowerCase()}.`}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card variant="bordered" padding="lg">
            <CardHeader className="flex items-center justify-between mb-6">
              <CardTitle>Información</CardTitle>
              <CardDescription>* Campos obligatorios</CardDescription>
            </CardHeader>
            <div className="space-y-5">
              {fields.map((field) => (
                <div key={field.name}>
                  {field.type === "select" ? (
                    <Select
                      label={field.label}
                      options={field.options}
                      placeholder={field.placeholder}
                      {...register(field.name)}
                      required={field.required}
                      error={errors[field.name]?.message}
                    />
                  ) : (
                    <Input
                      label={field.label}
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      {...register(field.name)}
                      required={field.required}
                      error={errors[field.name]?.message}
                    />
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingItem(null); }}>
              Cancelar
            </Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending} rightIcon={<ArrowRight className="w-4 h-4" />}>
              {createMutation.isPending || updateMutation.isPending ? "Guardando..." : editingItem ? "Guardar cambios" : `Crear ${entityName}`}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-text">{entityNamePlural}</h1>
          <p className="text-md text-text-muted mt-1">Gestiona {entityNamePlural.toLowerCase()}.</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
          Nuevo {entityName}
        </Button>
      </div>

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
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-white text-text placeholder:text-text-light focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-border">
              <tr>
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
              {paginatedData.map((item, rowIndex) => (
                <tr
                  key={getId(item)}
                  className="transition-colors duration-fast hover:bg-hover"
                >
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
                        aria-label={`Ver ${formatListItem(item)}`}
                      >
                        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-hover transition-colors"
                        onClick={() => handleEdit(item)}
                        aria-label={`Editar ${item.nombre || getId(item)}`}
                      >
                        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-hover transition-colors"
                        onClick={() => handleDelete(item)}
                        aria-label={`Eliminar ${item.nombre || getId(item)}`}
                      >
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