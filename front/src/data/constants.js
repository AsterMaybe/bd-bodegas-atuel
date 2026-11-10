// Tipos y constantes para la aplicación
// WineType: "tinto" | "blanco" | "rosado" | "espumante"
// GrapeType: "tinta" | "blanca"
// BatchStatus: "aging" | "fermenting" | "ready" | "pending_review"
// DocumentStatus: "en_confeccion" | "terminado" | "procesado"

export const WINE_TYPES = ["tinto", "blanco", "rosado", "espumante"];
export const GRAPE_TYPES = ["tinta", "blanca"];
export const BATCH_STATUSES = ["en_confeccion", "terminado", "procesado"];

export const WINE_TYPE_LABELS = {
  tinto: "Tinto",
  blanco: "Blanco",
  rosado: "Rosado",
  espumante: "Espumante",
};

export const WINE_TYPE_VARIANTS = {
  tinto: "primary",
  blanco: "success",
  rosado: "warning",
  espumante: "default",
};

export const DOCUMENT_STATUS_LABELS = {
  en_confeccion: "En confección",
  terminado: "Terminado",
  procesado: "Procesado",
};

export const DOCUMENT_STATUS_VARIANTS = {
  en_confeccion: "warning",
  terminado: "success",
  procesado: "primary",
};

export const CLIENTE_TIPOS = ["socio", "distribuidor", "exportador"];

export const TIPO_DOC_LABELS = {
  DNI: "DNI",
  CUIT: "CUIT",
};

export const TIPO_DOC_OPTIONS = [
  { value: "DNI", label: "DNI" },
  { value: "CUIT", label: "CUIT" },
];

// Mapeo de estados para badges (legacy - para compatibilidad)
export const BATCH_STATUS_LABELS = {
  aging: "Aging",
  fermenting: "Fermenting",
  ready: "Ready",
  pending_review: "Pending review",
};

export const BATCH_STATUS_VARIANTS = {
  aging: "primary",
  fermenting: "warning",
  ready: "success",
  pending_review: "default",
};

// Formateo de números
export function formatNumber(num) {
  if (num === null || num === undefined) return "-";
  return new Intl.NumberFormat("es-AR").format(num);
}

// Formateo de dinero
export function formatCurrency(amount, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// Formateo de fechas
export function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  // La base de datos almacena las fechas en UTC. Convertimos a hora argentina
  // (UTC-3) restando 3 horas a la hora recibida.
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return dateStr;
  let [, year, month, day, hour, minute] = match;
  year = parseInt(year, 10);
  month = parseInt(month, 10);
  day = parseInt(day, 10);
  hour = parseInt(hour, 10) - 3; // UTC -> Argentina (UTC-3)
  minute = parseInt(minute, 10);

  // Ajuste si la hora quedó negativa (pasamos al día anterior)
  if (hour < 0) {
    hour += 24;
    day -= 1;
    if (day < 1) {
      month -= 1;
      if (month < 1) {
        month = 12;
        year -= 1;
      }
      const daysInMonth = new Date(year, month, 0).getDate();
      day = daysInMonth;
    }
  }

  const monthStr = String(month).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");
  const hourStr = String(hour).padStart(2, "0");
  const minuteStr = String(minute).padStart(2, "0");
  return `${dayStr}/${monthStr}/${year} ${hourStr}:${minuteStr}`;
}
