import { useState, useEffect } from "react";
import { authApi } from "../api/api";

/**
 * Hook para obtener el usuario autenticado validando el token contra el backend.
 * El objeto usuario tiene: id_usuario, nombre, email, rol, fecha_creacion, activo.
 * El rol puede ser "administrador" o "empleado".
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const stored = localStorage.getItem("user");
    
    if (token && stored) {
      // Validar token contra el backend
      authApi.me()
        .then((backendUser) => {
          // Token válido, usar datos frescos del backend
          setUser(backendUser);
          localStorage.setItem("user", JSON.stringify(backendUser));
        })
        .catch(() => {
          // Token inválido o expirado, limpiar sesión
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (stored) {
      // Sin token pero hay datos en localStorage (caso legacy), intentar parsear
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        setUser(null);
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const esAdmin = user ? user.rol === "administrador" : false;
  const esEmpleado = user ? user.rol === "empleado" : false;

  // Nombre de usuario: todo lo que venga antes del @ del email
  const nombreUsuario = user && user.email ? user.email.split("@")[0] : "Usuario";

  return {
    user,
    rol: user ? user.rol : null,
    esAdmin,
    esEmpleado,
    nombreUsuario,
    email: user ? user.email : null,
    loading,
  };
}

/**
 * Verifica que el usuario sea administrador. Si es empleado, muestra una alerta
 * y devuelve false. Devuelve true si puede proceder.
 */
export function requireAdmin() {
  const stored = localStorage.getItem("user");
  if (!stored) {
    alert("No hay una sesión activa.");
    return false;
  }
  try {
    const user = JSON.parse(stored);
    if (user.rol !== "administrador") {
      alert("No tiene permisos para realizar esta acción. Solo el administrador puede crear, editar o eliminar datos.");
      return false;
    }
    return true;
  } catch (e) {
    alert("Error al leer la sesión de usuario.");
    return false;
  }
}
