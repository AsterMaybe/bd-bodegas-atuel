import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f3f0]">
        <div className="w-12 h-12 border-4 border-[#742d40] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function PublicRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f3f0]">
        <div className="w-12 h-12 border-4 border-[#742d40] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}