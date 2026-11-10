import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useTransferencias,
  useTransferencia,
  useCreateTransferencia,
  useAddRenglonesTransferencia,
  useTerminarTransferencia,
  useProcesarTransferencia,
} from "../hooks/useWineData";
import { useVinos } from "../hooks/useWineData";
import { useSalas } from "../hooks/useWineData";
import { formatDate, formatCurrency } from "../data/constants";
import { useAuth } from "../hooks";
import {
  Plus, Search, ChevronLeft, ChevronRight, Eye, Edit, Trash2, PlusCircle,
  X, CheckCircle, AlertCircle, Loader2, Package, Warehouse, ArrowRightLeft,
} from "lucide-react";
import { Button } from "../components/ui";
import { Input } from "../components/ui";
import { Select } from "../components/ui";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui";
import { Badge } from "../components/ui";

const ESTADO_COLORS = {
  en_confeccion: "bg-warning-light text-warning",
  terminado: "bg-primary-light text-primary",
  procesado: "bg-success-light text-success",
};

const ESTADO_LABELS = {
  en_confeccion: "En confección",
  terminado: "Terminado",
  procesado: "Procesado",
};

const ESTADO_ICONS = {
  en_confeccion: <AlertCircle className="w-3.5 h-3.5" />,
  terminado: <CheckCircle className="w-3.5 h-3.5" />,
  procesado: <Package className="w-3.5 h-3.5" />,
};

export default function Transferencias() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showRenglonesModal, setShowRenglonesModal] = useState(null);
  const [newRenglones, setNewRenglones] = useState([{ codigo_vino: "", cantidad: "" }]);

  const apiParams = useMemo(() => ({
    page,
    limit: pageSize,
    estado: activeTab !== "all" ? activeTab : undefined,
    search: search || undefined,
  }), [activeTab, search, page]);

  const { data, isLoading, error, refetch } = useTransferencias(apiParams);
  const { data: vinosData } = useVinos({ limit: 100 });
  const { data: salasData } = useSalas({ limit: 100 });
  const { esAdmin } = useAuth();

  const transferencias = data?.data || [];
  const metadata = data?.metadata || { total: 0, total_pages: 1, has_next: false, has_prev: false };
  const total = metadata.total;
  const totalPages = metadata.total_pages;

  const createMutation = useCreateTransferencia();
  const addRenglonesMutation = useAddRenglonesTransferencia();
  const terminarMutation = useTerminarTransferencia();
  const procesarMutation = useProcesarTransferencia();

  // State para modal crear (Select controlado)
  const [createForm, setCreateForm] = useState({ id_sala: "" });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!esAdmin) { alert("No tiene permisos para realizar esta acción. Solo el administrador puede crear, editar o eliminar datos."); return; }
    const id_sala = parseInt(createForm.id_sala, 10);
    if (!id_sala) return alert("Seleccione una sala");
    try {
      await createMutation.mutateAsync({ id_sala });
      setShowCreateModal(false);
      setCreateForm({ id_sala: "" });
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddRenglones = async (e) => {
    e.preventDefault();
    if (!esAdmin) { alert("No tiene permisos para realizar esta acción. Solo el administrador puede crear, editar o eliminar datos."); return; }
    if (!showRenglonesModal) return;
    const renglones = newRenglones
      .filter(r => r.codigo_vino && r.cantidad)
      .map(r => ({ codigo_vino: parseInt(r.codigo_vino), cantidad: parseInt(r.cantidad) }));
    if (renglones.length === 0) return alert("Agregue al menos un renglón válido");
    try {
      await addRenglonesMutation.mutateAsync({ nro: showRenglonesModal, renglones });
      setShowRenglonesModal(null);
      setNewRenglones([{ codigo_vino: "", cantidad: "" }]);
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTerminar = async (nro) => {
    if (!esAdmin) { alert("No tiene permisos para realizar esta acción. Solo el administrador puede crear, editar o eliminar datos."); return; }
    if (!window.confirm("¿Cambiar estado a 'Terminado'? No se podrán agregar más renglones.")) return;
    try {
      await terminarMutation.mutateAsync(nro);
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleProcesar = async (nro) => {
    if (!esAdmin) { alert("No tiene permisos para realizar esta acción. Solo el administrador puede crear, editar o eliminar datos."); return; }
    if (!window.confirm("¿Procesar transferencia? Se ejecutará el procedimiento almacenado y afectará stock.")) return;
    try {
      await procesarMutation.mutateAsync(nro);
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (nro) => {
    if (!esAdmin) { alert("No tiene permisos para realizar esta acción. Solo el administrador puede crear, editar o eliminar datos."); return; }
    if (!window.confirm("¿Eliminar transferencia? Solo si está en confección.")) return;
    // No hay endpoint delete en la API actual, pero se podría agregar
    alert("Eliminar no implementado en API actual");
  };

  const isLoadingAction = createMutation.isPending || addRenglonesMutation.isPending ||
    terminarMutation.isPending || procesarMutation.isPending;

  const renderEstado = (estado) => (
    <Badge variant="outline" className={ESTADO_COLORS[estado] || "bg-border text-text-muted"}>
      {ESTADO_ICONS[estado] || null}
      {ESTADO_LABELS[estado] || estado}
    </Badge>
  );

  const renderActions = (row) => {
    const canEdit = row.estado === "en_confeccion";
    const canTerminar = row.estado === "en_confeccion";
    const canProcesar = row.estado === "terminado";

    return (
      <div className="flex items-center gap-1.5 justify-center">
        <Button variant="ghost" size="sm" onClick={() => setShowDetailModal(row.id_documento)} aria-label="Ver">
          <Eye className="w-4 h-4" />
        </Button>
        {canEdit && (
          <>
            <Button variant="ghost" size="sm" onClick={() => { setShowRenglonesModal(row.id_documento); setNewRenglones([{ codigo_vino: "", cantidad: "" }]); }} aria-label="Agregar renglones">
              <PlusCircle className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleTerminar(row.id_documento)} aria-label="Terminar" disabled={terminarMutation.isPending}>
              <CheckCircle className="w-4 h-4" />
            </Button>
          </>
        )}
        {canProcesar && (
          <Button variant="ghost" size="sm" onClick={() => handleProcesar(row.id_documento)} aria-label="Procesar" disabled={procesarMutation.isPending} className="text-primary">
            <ArrowRightLeft className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id_documento)} aria-label="Eliminar" className="text-error">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  const tableColumns = [
    { key: "id_documento", header: "Nº", width: "70px", align: "center" },
    { key: "fecha", header: "Fecha", width: "120px", align: "center", render: (row) => <span>{formatDate(row.fecha)}</span> },
    { key: "estado", header: "Estado", width: "140px", align: "center", render: (row) => renderEstado(row.estado) },
    { key: "id_sala", header: "Sala", width: "100px", align: "center", render: (row) => <span>Sala {row.id_sala}</span> },
    { key: "actions", header: "", width: "200px", align: "center", render: renderActions },
  ];

  const vinosOptions = vinosData?.data?.map(v => ({ value: String(v.codigo_vino), label: `${v.nombre} (${v.codigo_vino}) - ${formatCurrency(v.precio)}` })) || [];
  const salasOptions = salasData?.data?.map(s => ({ value: String(s.id_sala), label: `Sala ${s.id_sala} - ${s.calle}` })) || [];

  if (error) {
    return (
      <div className="p-6 text-center text-error">
        <p>Error cargando transferencias: {error.message}</p>
        <Button onClick={() => refetch()} className="mt-4">Reintentar</Button>
      </div>
    );
  }

  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= metadata.total_pages) setPage(newPage);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-text">Transferencias</h1>
          <p className="text-md text-text-muted mt-1">Gestiona movimientos de stock entre depósito y salas de venta.</p>
        </div>
        <Button onClick={() => { if (!esAdmin) { alert("No tiene permisos para realizar esta acción. Solo el administrador puede crear, editar o eliminar datos."); return; } setShowCreateModal(true); }} leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Transferencia
        </Button>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        {/* Tabs de estado */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-1 border-b border-border pb-4">
            {[
              { id: "all", label: "Todas" },
              { id: "en_confeccion", label: "En confección" },
              { id: "terminado", label: "Terminadas" },
              { id: "procesado", label: "Procesadas" },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => { setActiveTab(tab.id); setPage(1); }}
                className="px-4 py-2 text-sm"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Buscador */}
        <div className="p-5 border-b border-border">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
            <Input
              type="text"
              placeholder="Buscar por Nº transferencia o sala..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-text-muted flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Cargando transferencias...
            </div>
          ) : transferencias.length === 0 ? (
            <div className="p-12 text-center text-text-muted">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron transferencias</p>
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
                {transferencias.map((item) => (
                  <tr key={item.id_documento} className="transition-colors duration-fast hover:bg-hover">
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

        {/* Paginación */}
        {metadata.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <div className="text-sm text-text-muted">
              Mostrando {transferencias.length} de {metadata.total} transferencias - Página {metadata.page} de {metadata.total_pages}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => goToPage(metadata.page - 1)} disabled={!metadata.has_prev || isLoading} leftIcon={<ChevronLeft className="w-4 h-4" />}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => goToPage(metadata.page + 1)} disabled={!metadata.has_next || isLoading} rightIcon={<ChevronRight className="w-4 h-4" />}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear Transferencia */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle>Nueva Transferencia</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setShowCreateModal(false); setCreateForm({ id_sala: "" }); }}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Sala de destino *</label>
                {salasOptions.length === 0 ? (
                  <div className="h-11 px-3 rounded-lg border border-border bg-input-readonly text-text-muted flex items-center">
                    Cargando salas...
                  </div>
                ) : (
                  <Select
                    name="id_sala"
                    value={createForm.id_sala}
                    onChange={(e) => setCreateForm({ id_sala: e.target.value })}
                    required
                    options={salasOptions}
                    placeholder="Seleccione una sala"
                  />
                )}
                {salasOptions.length === 0 && <p className="mt-1 text-xs text-text-light">Espere a que carguen las salas</p>}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => { setShowCreateModal(false); setCreateForm({ id_sala: "" }); }}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || !createForm.id_sala || salasOptions.length === 0}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle Transferencia */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle>Transferencia #{showDetailModal}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowDetailModal(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <TransferenciaDetail
                id={showDetailModal}
                onClose={() => setShowDetailModal(null)}
                onTerminar={handleTerminar}
                onProcesar={handleProcesar}
                vinosData={vinosData}
                isTerminando={terminarMutation.isPending}
                isProcesando={procesarMutation.isPending}
              />
          </div>
        </div>
      )}

      {/* Modal Agregar Renglones */}
      {showRenglonesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle>Agregar Renglones a Transferencia #{showRenglonesModal}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setShowRenglonesModal(null); setNewRenglones([{ codigo_vino: "", cantidad: "" }]); }}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <form onSubmit={handleAddRenglones} className="p-6 space-y-4">
              <div className="space-y-3">
                {vinosOptions.length === 0 ? (
                  <div className="h-11 px-3 rounded-lg border border-border bg-input-readonly text-text-muted flex items-center">
                    Cargando vinos...
                  </div>
                ) : (
                  newRenglones.map((reng, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Select
                        name={`codigo_vino_${idx}`}
                        value={reng.codigo_vino}
                        onChange={(e) => {
                          const arr = [...newRenglones];
                          arr[idx] = { ...arr[idx], codigo_vino: e.target.value };
                          setNewRenglones(arr);
                        }}
                        options={vinosOptions}
                        placeholder="Seleccionar vino"
                        className="flex-1"
                        required
                      />
                      <Input
                        name={`cantidad_${idx}`}
                        type="number"
                        min="1"
                        value={reng.cantidad}
                        onChange={(e) => {
                          const arr = [...newRenglones];
                          arr[idx] = { ...arr[idx], cantidad: e.target.value };
                          setNewRenglones(arr);
                        }}
                        placeholder="Cantidad"
                        className="w-32"
                        required
                      />
                      {newRenglones.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" className="text-error" onClick={() => {
                          const arr = newRenglones.filter((_, i) => i !== idx);
                          setNewRenglones(arr);
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
                {vinosOptions.length === 0 && <p className="text-xs text-text-light">Espere a que carguen los vinos</p>}
              </div>
              <Button type="button" variant="outline" onClick={() => setNewRenglones([...newRenglones, { codigo_vino: "", cantidad: "" }])} leftIcon={<Plus className="w-4 h-4" />} disabled={vinosOptions.length === 0}>
                Agregar otro renglón
              </Button>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => { setShowRenglonesModal(null); setNewRenglones([{ codigo_vino: "", cantidad: "" }]); }}>Cancelar</Button>
                <Button type="submit" disabled={addRenglonesMutation.isPending || vinosOptions.length === 0}>
                  {addRenglonesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar renglones"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-text-muted">
        <div className="flex items-center gap-2">
          <Warehouse className="w-4 h-4" />
          Flujo: En confeccion \u2192 Terminado \u2192 Procesado (stock actualizado)
        </div>
        <span>v1.0.0 - Uso interno</span>
      </div>
    </div>
  );
}

// Componente de detalle separado para mantener limpio
function TransferenciaDetail({ id, onClose, onTerminar, onProcesar, vinosData, isTerminando, isProcesando }) {
  const { data, isLoading, error } = useTransferencia(id);

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Cargando...</div>;
  if (error) return <div className="p-12 text-center text-error">Error: {error.message}</div>;
  if (!data) return <div className="p-12 text-center text-text-muted">No encontrada</div>;

  const getVinoName = (codigo) => {
    const vino = vinosData?.data?.find(v => v.codigo_vino === codigo);
    return vino ? `${vino.nombre} (${vino.tipo}, ${vino.aniada})` : `Vino #${codigo}`;
  };

  const canTerminar = data.estado === "en_confeccion";
  const canProcesar = data.estado === "terminado";

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-text-muted">Nº Transferencia</p>
          <p className="font-semibold text-2xl text-text">{data.id_documento}</p>
        </div>
        <div>
          <p className="text-sm text-text-muted">Fecha</p>
          <p className="font-semibold text-text">{data.fecha}</p>
        </div>
        <div>
          <p className="text-sm text-text-muted">Estado</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={ESTADO_COLORS[data.estado] || "bg-border text-text-muted"}>
              {ESTADO_ICONS[data.estado] || null}
              {ESTADO_LABELS[data.estado] || data.estado}
            </Badge>
          </div>
        </div>
        <div>
          <p className="text-sm text-text-muted">Sala</p>
          <p className="font-semibold text-text">Sala {data.id_sala}</p>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Renglones ({data.renglones?.length || 0})
        </h3>
        {data.renglones?.length === 0 ? (
          <p className="text-center text-text-muted py-8">Sin renglones cargados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-border">
                <tr>
                  <th className="px-3 py-3 text-left font-medium text-text-muted text-sm">Vino</th>
                  <th className="px-3 py-3 text-center font-medium text-text-muted text-sm">Tipo</th>
                  <th className="px-3 py-3 text-center font-medium text-text-muted text-sm">Añada</th>
                  <th className="px-3 py-3 text-right font-medium text-text-muted text-sm">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.renglones.map((r, idx) => {
                  const vino = vinosData?.data?.find(v => v.codigo_vino === r.codigo_vino);
                  return (
                    <tr key={idx} className="hover:bg-hover">
                      <td className="px-3 py-3 text-sm text-text">{vino ? vino.nombre : `Vino #${r.codigo_vino}`}</td>
                      <td className="px-3 py-3 text-center text-sm text-text-muted">{vino ? vino.tipo : "-"}</td>
                      <td className="px-3 py-3 text-center text-sm text-text-muted">{vino ? vino.aniada : "-"}</td>
                      <td className="px-3 py-3 text-right text-sm font-medium text-text">{r.cantidad}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Acciones de cambio de estado en el detail modal */}
      {(canTerminar || canProcesar) && (
        <div className="border-t border-border pt-4 flex items-center justify-end gap-3">
          {canTerminar && (
            <Button
              variant="outline"
              onClick={() => { onTerminar(data.id_documento); onClose(); }}
              disabled={isTerminando}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Terminar
            </Button>
          )}
          {canProcesar && (
            <Button
              variant="default"
              onClick={() => { onProcesar(data.id_documento); onClose(); }}
              disabled={isProcesando}
              leftIcon={<ArrowRightLeft className="w-4 h-4" />}
            >
              Procesar
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        </div>
      )}
      {!canTerminar && !canProcesar && (
        <div className="flex justify-end border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      )}
    </div>
  );
}