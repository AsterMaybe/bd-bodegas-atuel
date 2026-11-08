import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui";
import { Button, Input, Select, Badge } from "../components/ui";
import { ChevronDown, Lock, Shield, ArrowUpRight, Info, Check, ArrowRight, Loader2, Plus, X, Trash2 } from "lucide-react";
import { useVino, useUpdateVino, useCreateVino, useBodegas, useCepas } from "../hooks/useWineData";
import { WINE_TYPES, WINE_TYPE_LABELS, WINE_TYPE_VARIANTS, formatCurrency, formatDate } from "../data/constants";
import { useAuth } from "../hooks";

const VINTAGE_OPTIONS = [
  { value: "", label: "Seleccionar añada" },
  ...Array.from({ length: 10 }, (_, i) => 2025 - i).map((y) => ({ value: String(y), label: String(y) })),
];

const VOLUME_OPTIONS = [
  { value: "375", label: "375 ml" },
  { value: "750", label: "750 ml" },
  { value: "1000", label: "1 L" },
  { value: "1500", label: "1.5 L" },
];

const composicionSchema = z.object({
  id_cepa: z.number(),
  porcentaje: z.number(),
});

const wineBatchSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  tipo: z.string().min(1, "El tipo es requerido"),
  aniada: z.string().min(1, "La añada es requerida"),
  volumen_ml: z.string().min(1, "El volumen es requerido"),
  graduacion: z.string().min(1, "La graduación es requerida"),
  precio: z.string().min(1, "El precio es requerido"),
  cuit_bodega: z.string().regex(/^[0-9]{11}$/, "CUIT inválido (11 dígitos)"),
  // composicion se valida manualmente en onSubmit (estado separado)
});

export default function EditWineBatch({ isNew }) {
  const { codigo_vino } = useParams();
  const navigate = useNavigate();
  const isEditing = !isNew && codigo_vino;

  const { data: vino, isLoading, error } = useVino(isEditing ? Number(codigo_vino) : null);
  const updateVino = useUpdateVino();
  const createVino = useCreateVino();
  const { data: bodegasData, isLoading: bodegasLoading } = useBodegas({ limit: 100 });
  const { data: cepasData, isLoading: cepasLoading } = useCepas({ limit: 100 });

  const bodegasOptions = bodegasData?.data?.map(b => ({ value: b.cuit, label: `${b.razon_social} (${b.cuit})` })) || [];
  const cepasOptions = cepasData?.data?.map(c => ({ value: String(c.id_cepa), label: `${c.nombre} (${c.tipo})` })) || [];
  
  const dataLoading = bodegasLoading || cepasLoading;

  const { esAdmin } = useAuth();
  const [composicion, setComposicion] = useState([]);
  const [showCepaModal, setShowCepaModal] = useState(false);
  const [newCepa, setNewCepa] = useState({ id_cepa: "", porcentaje: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm({
    resolver: zodResolver(wineBatchSchema),
    defaultValues: {
      nombre: "",
      tipo: "",
      aniada: "",
      volumen_ml: "750",
      graduacion: "",
      precio: "",
      cuit_bodega: "",
    },
  });

  useEffect(() => {
    if (isEditing && vino && !isLoading) {
      setValue("nombre", vino.nombre);
      setValue("tipo", vino.tipo);
      setValue("aniada", String(vino.aniada));
      setValue("volumen_ml", String(vino.volumen_ml));
      setValue("graduacion", String(vino.graduacion));
      setValue("precio", String(vino.precio));
      setValue("cuit_bodega", vino.cuit_bodega);
      if (vino.composicion) {
        setComposicion(vino.composicion);
      }
    }
  }, [vino, isLoading, isEditing, setValue]);

  const handleAddCepa = () => {
    if (newCepa.id_cepa && newCepa.porcentaje) {
      const existing = composicion.find((c) => c.id_cepa === Number(newCepa.id_cepa));
      if (existing) {
        setErrorMessage("Esta cepa ya est? agregada");
        return;
      }
      const totalPorcentaje = composicion.reduce((sum, c) => sum + c.porcentaje, 0) + Number(newCepa.porcentaje);
      if (totalPorcentaje > 100) {
        setErrorMessage("El total de porcentaje no puede superar 100%");
        return;
      }
      setComposicion([...composicion, { id_cepa: Number(newCepa.id_cepa), porcentaje: Number(newCepa.porcentaje) }]);
      setNewCepa({ id_cepa: "", porcentaje: "" });
      setShowCepaModal(false);
      setErrorMessage("");
    }
  };

  const handleRemoveCepa = (id_cepa) => {
    setComposicion(composicion.filter((c) => c.id_cepa !== id_cepa));
  };

  const onSubmit = async (data) => {
    if (!esAdmin) { alert("No tiene permisos para realizar esta acción. Solo el administrador puede crear, editar o eliminar datos."); return; }
    setErrorMessage("");
    setIsSubmitting(true);

    // Validación ANTES de enviar - la composición no está en el formulario
    if (composicion.length === 0) {
      setErrorMessage("Debe agregar al menos una cepa a la composición (use el botón 'Agregar cepa')");
      setIsSubmitting(false);
      return;
    }
    const totalPorcentaje = composicion.reduce((sum, c) => sum + c.porcentaje, 0);
    if (totalPorcentaje !== 100) {
      setErrorMessage(`La composición debe sumar exactamente 100% (actual: ${totalPorcentaje}%)`);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...data,
        aniada: Number(data.aniada),
        volumen_ml: Number(data.volumen_ml),
        graduacion: Number(data.graduacion),
        precio: Number(data.precio),
        composicion,
      };

      if (isEditing) {
        await updateVino.mutateAsync({ codigo_vino: Number(codigo_vino), data: payload });
      } else {
        await createVino.mutateAsync(payload);
      }
      navigate("/dashboard/vinos");
    } catch (err) {
      setErrorMessage(err.data?.detail || err.message || "Error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard/vinos");
  };

  const totalPorcentaje = composicion.reduce((sum, c) => sum + c.porcentaje, 0);

  if (isLoading && isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && isEditing) {
    return (
      <div className="p-6 text-center text-error">
        <p>Error cargando vino: {error.message}</p>
        <Button onClick={() => navigate("/database")} variant="secondary" className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Workspace", href: "/dashboard" },
    { label: "Vinos", href: "/dashboard/vinos" },
    { label: isNew ? "Nuevo vino" : `Editar ${vino?.nombre}`, current: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm mb-2">
            <ol className="flex items-center gap-2">
              {breadcrumbItems.map((item, index) => (
                <li key={item.label} className="flex items-center gap-2">
                  {index > 0 && (
                    <ChevronDown className="w-3 h-3 text-text-light flex-shrink-0 rotate-90" aria-hidden="true" />
                  )}
                  {item.href && !item.current ? (
                    <a href={item.href} className="text-text-muted hover:text-primary transition-colors">
                      {item.label}
                    </a>
                  ) : (
                    <span className="font-medium text-text">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <h1 className="text-4xl font-semibold text-text">{isNew ? "Nuevo vino" : `Editar: ${vino?.nombre}`}</h1>
          <p className="text-md text-text-muted mt-1">
            {isNew ? "Completa la información del nuevo vino." : `Modifica los datos de ${vino?.nombre} (Código: ${vino?.codigo_vino})`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {errorMessage && (
          <div className="p-3 bg-error-light border border-error rounded-lg text-sm text-error flex items-center gap-2">
            <Shield className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {isSubmitted && Object.keys(errors).length > 0 && !errorMessage && (
          <div className="p-3 bg-error-light border border-error rounded-lg text-sm text-error flex items-center gap-2">
            <Shield className="w-4 h-4 shrink-0" />
            <span>
              {Object.entries(errors).map(([key, err]) => (
                <div key={key} className="text-xs">
                  <strong>{key}:</strong> {err.message}
                </div>
              ))}
            </span>
          </div>
        )}

        <Card variant="bordered" padding="lg">
          <CardHeader className="flex items-center justify-between mb-6">
            <CardTitle>Información básica</CardTitle>
            <CardDescription>* Campos obligatorios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Input
              label="Nombre *"
              placeholder="Ej: Gran Reserva Malbec"
              error={errors.nombre?.message}
              {...register("nombre")}
              required
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Select
                label="Tipo *"
                options={WINE_TYPES.map((t) => ({ value: t, label: WINE_TYPE_LABELS[t] }))}
                placeholder="Seleccionar tipo"
                error={errors.tipo?.message}
                {...register("tipo")}
                required
              />
              <Select
                label="Añada *"
                options={VINTAGE_OPTIONS}
                placeholder="Seleccionar añada"
                error={errors.aniada?.message}
                {...register("aniada")}
                required
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Select
                label="Volumen (ml) *"
                options={VOLUME_OPTIONS}
                placeholder="Seleccionar volumen"
                error={errors.volumen_ml?.message}
                {...register("volumen_ml")}
                required
              />
              <Input
                label="Graduación (%) *"
                type="number"
                step="0.1"
                placeholder="Ej: 14.5"
                error={errors.graduacion?.message}
                {...register("graduacion")}
                required
              />
              <Input
                label="Precio *"
                type="number"
                step="0.01"
                placeholder="Ej: 12500.00"
                error={errors.precio?.message}
                {...register("precio")}
                required
              />
            </div>

            <Select
              label="Bodega *"
              options={bodegasOptions}
              placeholder={bodegasLoading ? "Cargando bodegas..." : "Seleccionar bodega"}
              error={errors.cuit_bodega?.message}
              {...register("cuit_bodega")}
              required
              disabled={bodegasLoading}
            />
          </CardContent>
        </Card>

        <Card variant="bordered" padding="lg">
          <CardHeader className="flex items-center justify-between mb-6">
            <CardTitle>Composición de cepas</CardTitle>
            <CardDescription>El total debe sumar 100%. Mínimo una cepa requerida.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className={`font-medium ${totalPorcentaje === 100 ? "text-success" : totalPorcentaje > 100 ? "text-error" : "text-text"}`}>
                Total: {totalPorcentaje}%
              </span>
              <Button variant="secondary" size="sm" onClick={() => setShowCepaModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
                Agregar cepa
              </Button>
            </div>

            {composicion.length === 0 ? (
              <div className="text-center py-8 text-text-muted border-2 border-dashed border-border rounded-lg">
                <p>No hay cepas agregadas. Haz clic en "Agregar cepa" para comenzar.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {composicion.map((c, index) => (
                  <div key={c.id_cepa} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-text">
                        {cepasOptions.find((g) => g.value === String(c.id_cepa))?.label || `Cepa ${c.id_cepa}`}
                      </span>
                      <Badge variant="primary">{c.porcentaje}%</Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCepa(c.id_cepa)}
                    >
                      <Trash2 className="w-4 h-4 text-error" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {showCepaModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                  <h3 className="text-lg font-semibold mb-4">Agregar cepa</h3>
                  {errorMessage && (
                    <div className="mb-4 p-2 bg-error-light text-error text-sm rounded">{errorMessage}</div>
                  )}
                  <div className="space-y-4">
                    <Select
                      label="Cepa"
                      options={cepasOptions.filter((g) => g.value && !composicion.find((c) => String(c.id_cepa) === g.value))}
                      placeholder={cepasLoading ? "Cargando cepas..." : "Seleccionar cepa"}
                      value={newCepa.id_cepa}
                      onChange={(e) => setNewCepa({ ...newCepa, id_cepa: e.target.value })}
                      disabled={cepasLoading}
                    />
                    <Input
                      label="Porcentaje (%)"
                      type="number"
                      min="1"
                      max={100 - totalPorcentaje}
                      placeholder={`Máx: ${100 - totalPorcentaje}%`}
                      value={newCepa.porcentaje}
                      onChange={(e) => setNewCepa({ ...newCepa, porcentaje: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="secondary" onClick={() => { setShowCepaModal(false); setErrorMessage(""); }}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddCepa} disabled={!newCepa.id_cepa || !newCepa.porcentaje}>
                      Agregar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
          <div className="flex items-center gap-2 text-sm text-text-muted flex-1">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>Los cambios se aplican inmediatamente.</span>
          </div>
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={isSubmitting || updateVino.isPending || createVino.isPending || dataLoading}
            leftIcon={!isSubmitting && !updateVino.isPending && !createVino.isPending && !dataLoading ? <Check className="w-4 h-4" /> : undefined}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            disabled={dataLoading}
          >
            {dataLoading ? "Cargando datos..." : isSubmitting || updateVino.isPending || createVino.isPending ? "Guardando..." : isNew ? "Crear vino" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}
