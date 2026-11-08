import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui";
import { Button, Input, Select } from "../components/ui";
import { Loader2, Shield, Info, Check, ArrowRight, X } from "lucide-react";
import { useFinca, useCreateFinca, useUpdateFinca } from "../hooks/useWineData";
import { formatDate } from "../data/constants";
import { useDepartamentos } from "../hooks/useWineData";
import { useAuth } from "../hooks";

const fincaSchema = z.object({
  nombre: z.string().min(1, "El nombre de la finca es requerido"),
  superficie_ha: z.string().min(1, "La superficie es requerida").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Superficie debe ser mayor a 0"),
  id_depto: z.string().min(1, "El departamento es requerido"),
});

export default function EditFinca({ isNew }) {
  const { id_finca } = useParams();
  const navigate = useNavigate();
  const isEditing = !isNew && id_finca;

  const { data: finca, isLoading, error } = useFinca(isEditing ? id_finca : null);
  const updateFinca = useUpdateFinca();
  const createFinca = useCreateFinca();
  const { data: departamentosData } = useDepartamentos({ limit: 100 });

  const { esAdmin } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(fincaSchema),
    defaultValues: {
      nombre: "",
      superficie_ha: "",
      id_depto: "",
    },
  });

  const departamentosOptions = departamentosData?.data?.map(d => ({ value: String(d.id_depto), label: `${d.nombre_depto} (${d.provincia})` })) || [];

  useEffect(() => {
    if (isEditing && finca && !isLoading) {
      setValue("nombre", finca.nombre);
      setValue("superficie_ha", String(finca.superficie_ha));
      setValue("id_depto", String(finca.id_depto));
    }
  }, [finca, isLoading, isEditing, setValue]);

  const onSubmit = async (data) => {
    if (!esAdmin) { alert("No tiene permisos para realizar esta acción. Solo el administrador puede crear, editar o eliminar datos."); return; }
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const payload = {
        nombre: data.nombre,
        superficie_ha: Number(data.superficie_ha),
        id_depto: Number(data.id_depto),
      };

      if (isEditing) {
        await updateFinca.mutateAsync({ id: Number(id_finca), data: payload });
      } else {
        await createFinca.mutateAsync(payload);
      }
      navigate("/vineyards");
    } catch (err) {
      setErrorMessage(err.data?.detail || err.message || "Error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/vineyards");
  };

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
        <p>Error cargando finca: {error.message}</p>
        <Button onClick={() => navigate("/vineyards")} variant="secondary" className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm mb-2">
            <ol className="flex items-center gap-2">
              <li className="flex items-center gap-2">
                <a href="/dashboard" className="text-text-muted hover:text-primary transition-colors">Dashboard</a>
              </li>
              <li className="flex items-center gap-2">
                <X className="w-3 h-3 text-text-light flex-shrink-0 rotate-90" aria-hidden="true" />
              </li>
              <li className="flex items-center gap-2">
                <a href="/vineyards" className="text-text-muted hover:text-primary transition-colors">Viñedos</a>
              </li>
              <li className="flex items-center gap-2">
                <X className="w-3 h-3 text-text-light flex-shrink-0 rotate-90" aria-hidden="true" />
              </li>
              <li className="flex items-center gap-2">
                <span className="font-medium text-text">{isNew ? "Nueva finca" : `Editar: ${finca?.nombre}`}</span>
              </li>
            </ol>
          </nav>
          <h1 className="text-4xl font-semibold text-text">{isNew ? "Nueva Finca" : `Editar: ${finca?.nombre}`}</h1>
          <p className="text-md text-text-muted mt-1">
            {isNew ? "Complete la información de la nueva finca." : `Modifica los datos de ${finca?.nombre}`}
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

        <Card variant="bordered" padding="lg">
          <CardHeader className="flex items-center justify-between mb-6">
            <CardTitle>Información básica</CardTitle>
            <CardDescription>* Campos obligatorios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Input
              label="Nombre de la finca *"
              placeholder="Ej: Finca El Mirador"
              error={errors.nombre?.message}
              {...register("nombre")}
              required
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Input
                label="Superficie (ha) *"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 45.5"
                error={errors.superficie_ha?.message}
                {...register("superficie_ha")}
                required
              />
              <Select
                label="Departamento *"
                options={departamentosOptions}
                placeholder="Seleccionar departamento"
                error={errors.id_depto?.message}
                {...register("id_depto")}
                required
              />
            </div>
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
            loading={isSubmitting || updateFinca.isPending || createFinca.isPending}
            leftIcon={!isSubmitting && !updateFinca.isPending && !createFinca.isPending ? <Check className="w-4 h-4" /> : undefined}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isSubmitting || updateFinca.isPending || createFinca.isPending ? "Guardando..." : isNew ? "Crear finca" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}