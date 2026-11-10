import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui";
import { Button, Input, Select } from "../components/ui";
import { Loader2, Shield, Info, Check, ArrowRight, X } from "lucide-react";
import { useCliente, useCreateCliente, useUpdateCliente, useLocalidades } from "../hooks/useWineData";
import { formatDate } from "../data/constants";
import { useAuth } from "../hooks";

const TIPO_OPTIONS = [
  { value: "socio", label: "Socio del Club" },
  { value: "distribuidor", label: "Distribuidor" },
  { value: "exportador", label: "Exportador" },
];

const TIPO_DOC_OPTIONS = [
  { value: "DNI", label: "DNI" },
  { value: "CUIT", label: "CUIT" },
  { value: "PASAPORTE", label: "Pasaporte" },
];

const clientSchema = z.object({
  nombre_razon: z.string().min(1, "El nombre/razón social es requerido"),
  tipo_doc: z.string().min(1, "El tipo de documento es requerido"),
  nro_doc: z.string().min(1, "El número de documento es requerido"),
  direccion: z.string().max(150).optional(),
  codigo_postal: z.string().min(1, "El código postal es requerido").max(10),
  tipo: z.enum(["socio", "distribuidor", "exportador"], { required_error: "El tipo de cliente es requerido" }),
  // Campos específicos por subtipo
  zona_cobertura: z.string().optional(),
  nro_habilitacion: z.string().optional(),
  pais_destino: z.string().optional(),
}).refine((data) => {
  if (data.tipo === "distribuidor") {
    return data.zona_cobertura && data.zona_cobertura.length > 0 && data.nro_habilitacion && data.nro_habilitacion.length > 0;
  }
  if (data.tipo === "exportador") {
    return data.pais_destino && data.pais_destino.length > 0;
  }
  return true;
}, {
  message: "Complete los campos requeridos según el tipo de cliente",
  path: ["tipo"],
});

export default function EditClient({ isNew }) {
  const { id_cliente } = useParams();
  const navigate = useNavigate();
  const isEditing = !isNew && id_cliente;

  const { data: cliente, isLoading, error } = useCliente(isEditing ? Number(id_cliente) : null);
  const updateCliente = useUpdateCliente();
  const createCliente = useCreateCliente();
  const { data: localidadesData, isLoading: localidadesLoading } = useLocalidades({ limit: 100 });

  const localidadesOptions = localidadesData?.data?.map(l => ({ value: l.codigo_postal, label: `${l.codigo_postal} - ${l.nombre} (${l.provincia})` })) || [];

  const { esAdmin } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nombre_razon: "",
      tipo_doc: "DNI",
      nro_doc: "",
      direccion: "",
      codigo_postal: "",
      tipo: "socio",
      zona_cobertura: "",
      nro_habilitacion: "",
      pais_destino: "",
    },
  });

  const tipo = watch("tipo");
  const showDistribuidorFields = tipo === "distribuidor";
  const showExportadorFields = tipo === "exportador";

  useEffect(() => {
    if (isEditing && cliente && !isLoading) {
      setValue("nombre_razon", cliente.nombre_razon);
      setValue("tipo_doc", cliente.tipo_doc);
      setValue("nro_doc", cliente.nro_doc);
      setValue("direccion", cliente.direccion || "");
      setValue("codigo_postal", cliente.codigo_postal);
      setValue("tipo", cliente.tipo || "socio");
      setValue("zona_cobertura", cliente.zona_cobertura || "");
      setValue("nro_habilitacion", cliente.nro_habilitacion || "");
      setValue("pais_destino", cliente.pais_destino || "");
    }
  }, [cliente, isLoading, isEditing, setValue]);

  const onSubmit = async (data) => {
    if (!esAdmin) { alert("No tiene permisos para realizar esta acción. Solo el administrador puede crear, editar o eliminar datos."); return; }
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const payload = {
        nombre_razon: data.nombre_razon,
        tipo_doc: data.tipo_doc,
        nro_doc: data.nro_doc,
        direccion: data.direccion || null,
        codigo_postal: data.codigo_postal,
        tipo: data.tipo,
      };

      if (showDistribuidorFields) {
        payload.zona_cobertura = data.zona_cobertura;
        payload.nro_habilitacion = data.nro_habilitacion;
      }
      if (showExportadorFields) {
        payload.pais_destino = data.pais_destino;
      }

      if (isEditing) {
        await updateCliente.mutateAsync({ id: Number(id_cliente), data: payload });
      } else {
        await createCliente.mutateAsync(payload);
      }
      navigate("/clientes");
    } catch (err) {
      setErrorMessage(err.data?.detail || err.message || "Error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/clientes");
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
        <p>Error cargando cliente: {error.message}</p>
        <Button onClick={() => navigate("/clientes")} variant="secondary" className="mt-4">
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
                <a href="/clientes" className="text-text-muted hover:text-primary transition-colors">Clientes</a>
              </li>
              <li className="flex items-center gap-2">
                <X className="w-3 h-3 text-text-light flex-shrink-0 rotate-90" aria-hidden="true" />
              </li>
              <li className="flex items-center gap-2">
                <span className="font-medium text-text">{isNew ? "Nuevo cliente" : `Editar: ${cliente?.nombre_razon}`}</span>
              </li>
            </ol>
          </nav>
          <h1 className="text-4xl font-semibold text-text">{isNew ? "Nuevo Cliente" : `Editar: ${cliente?.nombre_razon}`}</h1>
          <p className="text-md text-text-muted mt-1">
            {isNew ? "Complete la información del nuevo cliente." : `Modifica los datos de ${cliente?.nombre_razon} (ID: ${cliente?.id_cliente})`}
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
              label="Nombre / Razón Social *"
              placeholder="Ej: Juan Pérez / Empresa S.A."
              error={errors.nombre_razon?.message}
              {...register("nombre_razon")}
              required
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Select
                label="Tipo de documento *"
                options={TIPO_DOC_OPTIONS}
                placeholder="Seleccionar tipo"
                error={errors.tipo_doc?.message}
                {...register("tipo_doc")}
                required
              />
              <Input
                label="Número de documento *"
                placeholder="Sin puntos ni guiones"
                error={errors.nro_doc?.message}
                {...register("nro_doc")}
                required
              />
              <Select
                label="Código postal *"
                options={localidadesOptions}
                placeholder={localidadesLoading ? "Cargando localidades..." : "Seleccionar localidad"}
                error={errors.codigo_postal?.message}
                {...register("codigo_postal")}
                required
                disabled={localidadesLoading}
              />
            </div>

            <Input
              label="Dirección"
              placeholder="Calle y número"
              error={errors.direccion?.message}
              {...register("direccion")}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Select
                label="Tipo de cliente *"
                options={TIPO_OPTIONS}
                placeholder="Seleccionar tipo"
                error={errors.tipo?.message}
                {...register("tipo")}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Campos específicos por subtipo */}
        {(showDistribuidorFields || showExportadorFields) && (
          <Card variant="bordered" padding="lg">
            <CardHeader className="flex items-center justify-between mb-6">
              <CardTitle>{showDistribuidorFields ? "Datos de Distribuidor" : "Datos de Exportador"}</CardTitle>
              <CardDescription>* Campos obligatorios para este tipo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {showDistribuidorFields && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Input
                    label="Zona de cobertura *"
                    placeholder="Ej: Zona Norte, CABA y GBA"
                    error={errors.zona_cobertura?.message}
                    {...register("zona_cobertura")}
                    required
                  />
                  <Input
                    label="N° Habilitación / RENSPA *"
                    placeholder="Ej: RENSPA-12345"
                    error={errors.nro_habilitacion?.message}
                    {...register("nro_habilitacion")}
                    required
                  />
                </div>
              )}
              {showExportadorFields && (
                <Input
                  label="País de destino *"
                  placeholder="Ej: Estados Unidos, Brasil, China"
                  error={errors.pais_destino?.message}
                  {...register("pais_destino")}
                  required
                />
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
          <div className="flex items-center gap-2 text-sm text-text-muted flex-1">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              {showDistribuidorFields && "Distribuidor requiere zona de cobertura y n° habilitación. "}
              {showExportadorFields && "Exportador requiere país de destino. "}
              Los cambios se aplican inmediatamente.
            </span>
          </div>
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={isSubmitting || updateCliente.isPending || createCliente.isPending}
            leftIcon={!isSubmitting && !updateCliente.isPending && !createCliente.isPending ? <Check className="w-4 h-4" /> : undefined}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isSubmitting || updateCliente.isPending || createCliente.isPending ? "Guardando..." : isNew ? "Crear cliente" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}