// API Configuration - Always use relative URLs through nginx proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function ApiError(status, message, data) {
  this.status = status;
  this.message = message;
  this.data = data;
  this.name = "ApiError";
}

async function fetchApi(endpoint, options = {}) {
  const baseUrl = API_BASE_URL || '';
  const url = baseUrl + endpoint;
  const token = localStorage.getItem("auth_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.detail || errorData.message || "Error " + response.status,
      errorData
    );
  }

  if (response.status === 204) {
    return undefined;
  }

  return response.json();
}

// Generic CRUD helper
function createCrud(basePath) {
  return {
    list: (params = {}) => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set("page", String(params.page));
      if (params.limit) searchParams.set("limit", String(params.limit));
      Object.entries(params).forEach(([k, v]) => {
        if (!['page', 'limit'].includes(k) && v !== undefined && v !== '') {
          searchParams.set(k, String(v));
        }
      });
      return fetchApi(basePath + "?" + searchParams.toString());
    },
    get: (id) => fetchApi(basePath + "/" + id),
    getComposite: (id1, id2) => fetchApi(basePath + "/" + id1 + "/" + id2),
    create: (data) => fetchApi(basePath, { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => fetchApi(basePath + "/" + id, { method: "PUT", body: JSON.stringify(data) }),
    updateComposite: (id1, id2, data) => fetchApi(basePath + "/" + id1 + "/" + id2, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) => fetchApi(basePath + "/" + id, { method: "DELETE" }),
    deleteComposite: (id1, id2) => fetchApi(basePath + "/" + id1 + "/" + id2, { method: "DELETE" }),
  };
}

// ==================== CATÁLOGO ====================
export const catalogoApi = {
  departamentos: createCrud("/api/catalogo/departamentos"),
  localidades: createCrud("/api/catalogo/localidades"),
  cepas: createCrud("/api/catalogo/cepas"),
  maridajes: createCrud("/api/catalogo/maridajes"),
};

// ==================== SALAS ====================
export const salasApi = createCrud("/api/salas");

// ==================== BODEGAS ====================
export const bodegasApi = createCrud("/api/bodegas");

// ==================== TRANSPORTISTAS ====================
export const transportistasApi = {
  ...createCrud("/api/transportistas"),
  localidades: (codigo) => createCrud("/api/transportistas/" + codigo + "/localidades"),
};

// ==================== FINCAS ====================
export const fincasApi = createCrud("/api/fincas/fincas");

// ==================== VINOS ====================
export const vinosApi = createCrud("/api/vinos");

// ==================== CLIENTES ====================
export const clientesApi = createCrud("/api/clientes");

// ==================== COMPROBANTES ====================
export const comprobantesApi = createCrud("/api/comprobantes");

// ==================== INGRESOS ====================
export const ingresosApi = {
  ...createCrud("/api/ingresos"),
  addRenglones: (cod, renglones) => fetchApi(`/api/ingresos/${cod}/renglones`, {
    method: "POST",
    body: JSON.stringify(renglones),
  }),
  terminar: (cod) => fetchApi(`/api/ingresos/${cod}/terminar`, { method: "POST" }),
  procesar: (cod) => fetchApi(`/api/ingresos/${cod}/procesar`, { method: "POST" }),
};

// ==================== TRANSFERENCIAS ====================
export const transferenciasApi = {
  ...createCrud("/api/transferencias"),
  addRenglones: (nro, renglones) => fetchApi(`/api/transferencias/${nro}/renglones`, {
    method: "POST",
    body: JSON.stringify(renglones),
  }),
  terminar: (nro) => fetchApi(`/api/transferencias/${nro}/terminar`, { method: "POST" }),
  procesar: (nro) => fetchApi(`/api/transferencias/${nro}/procesar`, { method: "POST" }),
};

// ==================== REPORTES ====================
export const reportesApi = {
  topVinos: (limit = 10) => fetchApi("/api/reportes/top-vinos?limit=" + limit),
  ventasPorSala: (desde, hasta) => {
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    return fetchApi("/api/reportes/ventas-por-sala?" + params.toString());
  },
  vinosSinStock: (id_sala) => fetchApi("/api/reportes/vinos-sin-stock?id_sala=" + id_sala),
  transportistaActivo: (desde, hasta) => {
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    return fetchApi("/api/reportes/transportista-activo?" + params.toString());
  },
  trazabilidad: (codigo_vino) => fetchApi("/api/reportes/trazabilidad/" + codigo_vino),
  dashboardStats: () => fetchApi("/api/reportes/dashboard-stats"),
};

// ==================== AUTENTICACIÓN ====================
export const authApi = {
  login: (data) => fetchApi("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  me: () => fetchApi("/auth/me"),
};

export const saludApi = {
  check: () => fetchApi("/api/salud/salud"),
};

// ==================== ACTIVIDAD ====================
export const activityApi = {
  list: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.tabla) searchParams.set("tabla", params.tabla);
    if (params.operacion) searchParams.set("operacion", params.operacion);
    if (params.usuario) searchParams.set("usuario", params.usuario);
    if (params.desde) searchParams.set("desde", params.desde);
    if (params.hasta) searchParams.set("hasta", params.hasta);
    if (params.search) searchParams.set("search", params.search);
    return fetchApi("/api/activity?" + searchParams.toString());
  },
  get: (id) => fetchApi("/api/activity/" + id),
};

export { ApiError };