export function formatVolume(liters) {
  if (liters >= 1000000) return `${(liters / 1000000).toFixed(1)}M L`;
  if (liters >= 1000) return `${(liters / 1000).toFixed(1)}k L`;
  return `${liters.toLocaleString()} L`;
}

export function formatNumber(num) {
  return num.toLocaleString("es-ES");
}

export function formatCurrency(amount, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(amount);
}

export function formatDate(date, options = {}) {
  const defaultOptions = { day: "2-digit", month: "short", year: "numeric" };
  return new Date(date).toLocaleDateString("es-ES", { ...defaultOptions, ...options });
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Justo ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} d`;
  return formatDate(date);
}

export function truncate(str, length = 50) {
  if (str.length <= length) return str;
  return str.slice(0, length).trim() + "?";
}

export function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function generateId() {
  return Math.random().toString(36).slice(2, 11);
}
