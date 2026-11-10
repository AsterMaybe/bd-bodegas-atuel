import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  catalogoApi,
  salasApi,
  bodegasApi,
  transportistasApi,
  fincasApi,
  vinosApi,
  clientesApi,
  ingresosApi,
  transferenciasApi,
  reportesApi,
  saludApi,
  activityApi,
} from "../api/api";

// ==================== CATÁLOGO ====================
export function useDepartamentos(params = {}) {
  return useQuery({
    queryKey: ["departamentos", params],
    queryFn: () => catalogoApi.departamentos.list(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useDepartamento(id_depto) {
  return useQuery({
    queryKey: ["departamento", id_depto],
    queryFn: () => catalogoApi.departamentos.get(id_depto),
    enabled: !!id_depto,
  });
}

export function useCreateDepartamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => catalogoApi.departamentos.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departamentos"] }),
  });
}

export function useUpdateDepartamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => catalogoApi.departamentos.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departamentos"] }),
  });
}

export function useDeleteDepartamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => catalogoApi.departamentos.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departamentos"] }),
  });
}

export function useLocalidades(params = {}) {
  return useQuery({
    queryKey: ["localidades", params],
    queryFn: () => catalogoApi.localidades.list(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useLocalidad(codigo_postal) {
  return useQuery({
    queryKey: ["localidad", codigo_postal],
    queryFn: () => catalogoApi.localidades.get(codigo_postal),
    enabled: !!codigo_postal,
  });
}

export function useCreateLocalidad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => catalogoApi.localidades.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["localidades"] }),
  });
}

export function useUpdateLocalidad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => catalogoApi.localidades.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["localidades"] }),
  });
}

export function useDeleteLocalidad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => catalogoApi.localidades.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["localidades"] }),
  });
}

export function useCepas(params = {}) {
  return useQuery({
    queryKey: ["cepas", params],
    queryFn: () => catalogoApi.cepas.list(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCepa(id_cepa) {
  return useQuery({
    queryKey: ["cepa", id_cepa],
    queryFn: () => catalogoApi.cepas.get(id_cepa),
    enabled: !!id_cepa,
  });
}

export function useCreateCepa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => catalogoApi.cepas.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cepas"] }),
  });
}

export function useMaridajes(params = {}) {
  return useQuery({
    queryKey: ["maridajes", params],
    queryFn: () => catalogoApi.maridajes.list(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useMaridaje(id_maridaje) {
  return useQuery({
    queryKey: ["maridaje", id_maridaje],
    queryFn: () => catalogoApi.maridajes.get(id_maridaje),
    enabled: !!id_maridaje,
  });
}

export function useCreateMaridaje() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => catalogoApi.maridajes.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["maridajes"] }),
  });
}

// ==================== SALAS ====================
export function useSalas(params = {}) {
  return useQuery({
    queryKey: ["salas", params],
    queryFn: () => salasApi.list(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSala(id_sala) {
  return useQuery({
    queryKey: ["sala", id_sala],
    queryFn: () => salasApi.get(id_sala),
    enabled: !!id_sala,
  });
}

export function useCreateSala() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => salasApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["salas"] }),
  });
}

export function useUpdateSala() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => salasApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["salas"] }),
  });
}

export function useDeleteSala() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => salasApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["salas"] }),
  });
}

// ==================== BODEGAS ====================
export function useBodegas(params = {}) {
  return useQuery({
    queryKey: ["bodegas", params],
    queryFn: () => bodegasApi.list(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useBodega(cuit) {
  return useQuery({
    queryKey: ["bodega", cuit],
    queryFn: () => bodegasApi.get(cuit),
    enabled: !!cuit,
  });
}

export function useCreateBodega() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => bodegasApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bodegas"] }),
  });
}

export function useUpdateBodega() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => bodegasApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bodegas"] }),
  });
}

export function useDeleteBodega() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => bodegasApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bodegas"] }),
  });
}

// ==================== TRANSPORTISTAS ====================
export function useTransportistas(params = {}) {
  return useQuery({
    queryKey: ["transportistas", params],
    queryFn: () => transportistasApi.list(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useTransportista(codigo) {
  return useQuery({
    queryKey: ["transportista", codigo],
    queryFn: () => transportistasApi.get(codigo),
    enabled: !!codigo,
  });
}

export function useCreateTransportista() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => transportistasApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transportistas"] }),
  });
}

export function useUpdateTransportista() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => transportistasApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transportistas"] }),
  });
}

export function useDeleteTransportista() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => transportistasApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transportistas"] }),
  });
}

// ==================== FINCAS ====================
export function useFincas(params = {}) {
  return useQuery({
    queryKey: ["fincas", params],
    queryFn: () => fincasApi.list(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFinca(id_finca) {
  return useQuery({
    queryKey: ["finca", id_finca],
    queryFn: () => fincasApi.get(id_finca),
    enabled: !!id_finca,
  });
}

export function useCreateFinca() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => fincasApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fincas"] }),
  });
}

export function useUpdateFinca() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => fincasApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fincas"] }),
  });
}

export function useDeleteFinca() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => fincasApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fincas"] }),
  });
}

// ==================== VINOS ====================
export function useVinos(params = {}) {
  return useQuery({
    queryKey: ["vinos", params],
    queryFn: () => vinosApi.list(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useVino(codigo_vino) {
  return useQuery({
    queryKey: ["vino", codigo_vino],
    queryFn: () => vinosApi.get(codigo_vino),
    enabled: !!codigo_vino,
  });
}

export function useCreateVino() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => vinosApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vinos"] }),
  });
}

export function useUpdateVino() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => vinosApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vinos"] }),
  });
}

export function useDeleteVino() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => vinosApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vinos"] }),
  });
}

// ==================== CLIENTES ====================
export function useClientes(params = {}) {
  return useQuery({
    queryKey: ["clientes", params],
    queryFn: () => clientesApi.list(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCliente(id_cliente) {
  return useQuery({
    queryKey: ["cliente", id_cliente],
    queryFn: () => clientesApi.get(id_cliente),
    enabled: !!id_cliente,
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => clientesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientes"] }),
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => clientesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientes"] }),
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => clientesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientes"] }),
  });
}

// ==================== INGRESOS ====================
export function useIngresos(params = {}) {
  return useQuery({
    queryKey: ["ingresos", params],
    queryFn: () => ingresosApi.list(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useIngreso(cod) {
  return useQuery({
    queryKey: ["ingreso", cod],
    queryFn: () => ingresosApi.get(cod),
    enabled: !!cod,
  });
}

export function useCreateIngreso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => ingresosApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ingresos"] }),
  });
}

export function useAddRenglonesIngreso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cod, renglones }) => ingresosApi.addRenglones(cod, renglones),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ingresos"] }),
  });
}

export function useTerminarIngreso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cod) => ingresosApi.terminar(cod),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ingresos"] }),
  });
}

export function useProcesarIngreso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cod) => ingresosApi.procesar(cod),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ingresos"] }),
  });
}

// ==================== TRANSFERENCIAS ====================
export function useTransferencias(params = {}) {
  return useQuery({
    queryKey: ["transferencias", params],
    queryFn: () => transferenciasApi.list(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useTransferencia(cod) {
  return useQuery({
    queryKey: ["transferencia", cod],
    queryFn: () => transferenciasApi.get(cod),
    enabled: !!cod,
  });
}

export function useCreateTransferencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => transferenciasApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transferencias"] }),
  });
}

export function useAddRenglonesTransferencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nro, renglones }) => transferenciasApi.addRenglones(nro, renglones),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transferencias"] }),
  });
}

export function useTerminarTransferencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nro) => transferenciasApi.terminar(nro),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transferencias"] }),
  });
}

export function useProcesarTransferencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nro) => transferenciasApi.procesar(nro),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transferencias"] }),
  });
}

// ==================== REPORTES ====================
export function useReportes() {
  return {
    topVinos: (limit = 10) =>
      useQuery({
        queryKey: ["reportes", "topVinos", limit],
        queryFn: () => reportesApi.topVinos(limit),
      }),
    ventasPorSala: (desde, hasta) =>
      useQuery({
        queryKey: ["reportes", "ventasPorSala", desde, hasta],
        queryFn: () => reportesApi.ventasPorSala(desde, hasta),
      }),
    vinosSinStock: (id_sala) =>
      useQuery({
        queryKey: ["reportes", "vinosSinStock", id_sala],
        queryFn: () => reportesApi.vinosSinStock(id_sala),
        enabled: !!id_sala,
      }),
    transportistaActivo: (desde, hasta) =>
      useQuery({
        queryKey: ["reportes", "transportistaActivo", desde, hasta],
        queryFn: () => reportesApi.transportistaActivo(desde, hasta),
      }),
    trazabilidad: (codigo_vino) =>
      useQuery({
        queryKey: ["reportes", "trazabilidad", codigo_vino],
        queryFn: () => reportesApi.trazabilidad(codigo_vino),
        enabled: !!codigo_vino,
      }),
  };
}

// ==================== SALUD ====================
export function useSalud() {
  return useQuery({
    queryKey: ["salud"],
    queryFn: () => saludApi.check(),
    refetchInterval: 30000,
  });
}

// ==================== ACTIVIDAD ====================
export function useActividad(params = {}) {
  return useQuery({
    queryKey: ["actividad", params],
    queryFn: () => activityApi.list(params),
    staleTime: 1000 * 60 * 2, // 2 min
  });
}

export function useActividadDetail(id_auditoria) {
  return useQuery({
    queryKey: ["actividad", id_auditoria],
    queryFn: () => activityApi.get(id_auditoria),
    enabled: !!id_auditoria,
  });
}

// ==================== DASHBOARD STATS ====================
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => reportesApi.dashboardStats(),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

// Force Vite to keep this module (prevent tree-shaking of hooks)
export const __useWineDataSideEffect = true;