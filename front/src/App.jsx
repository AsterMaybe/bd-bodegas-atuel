import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout/Layout";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Vinos from "./pages/Vinos";
import Vineyards from "./pages/Vineyards";
import ActivityLog from "./pages/ActivityLog";
import Clientes from "./pages/Clientes";
import Transferencias from "./pages/Transferencias";
import Ingresos from "./pages/Ingresos";
import EditWineBatch from "./pages/EditWineBatch";
import EditClient from "./pages/EditClient";
import EditFinca from "./pages/EditFinca";
import ViewFinca from "./pages/ViewFinca";
import Login from "./pages/Login";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes - only accessible when NOT authenticated */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected routes - only accessible when authenticated */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="vinos" element={<Vinos />} />
            <Route path="vinos/new" element={<EditWineBatch isNew />} />
            <Route path="vinos/:codigo_vino/edit" element={<EditWineBatch />} />
            <Route path="vineyards" element={<Vineyards />} />
            <Route path="fincas/:id_finca" element={<ViewFinca />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/new" element={<EditClient isNew />} />
            <Route path="/dashboard/fincas/new" element={<EditFinca isNew />} />
            <Route path="/dashboard/fincas/:id_finca/edit" element={<EditFinca />} />
            <Route path="clientes/:id_cliente/edit" element={<EditClient />} />
            <Route path="transferencias" element={<Transferencias />} />
            <Route path="ingresos" element={<Ingresos />} />
            <Route path="activity" element={<ActivityLog />} />
          </Route>
        </Route>

        {/* Catch-all: redirect to login if not authenticated, dashboard if authenticated */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
