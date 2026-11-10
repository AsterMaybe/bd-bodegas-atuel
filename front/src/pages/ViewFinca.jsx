import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Shield, Info, ArrowLeft, MapPin, TreePine, Sun, Droplet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui";
import { Button } from "../components/ui";
import { Badge } from "../components/ui";
import { useFinca } from "../hooks/useWineData";
import { formatNumber } from "../data/constants";

export default function ViewFinca() {
  const { id_finca } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data: finca, isLoading: fincaLoading, error: fincaError } = useFinca(id_finca ? Number(id_finca) : null);

  useEffect(() => {
    setIsLoading(fincaLoading);
    setError(fincaError ? fincaError.message : null);
  }, [fincaLoading, fincaError]);

  if (isLoading && !error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !finca) {
    return (
      <div className="p-6 text-center text-error">
        <p>Error cargando finca: {error || "Finca no encontrada"}</p>
        <Button onClick={() => navigate("/dashboard/vineyards")} variant="secondary" className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  const handleBack = () => {
    navigate("/dashboard/vineyards");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={handleBack}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Volver a Viñedos
        </Button>
        <h1 className="text-4xl font-semibold text-text">Detalle de Finca</h1>
      </div>

      <Card variant="bordered" padding="lg">
        <CardHeader>
          <CardTitle>{finca.nombre}</CardTitle>
          <CardDescription>Información de la finca {finca.nombre}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-neutral-50 rounded-lg border border-border">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">ID</p>
              <p className="text-lg font-semibold text-text">{finca.id_finca}</p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-lg border border-border">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Superficie</p>
              <p className="text-lg font-semibold text-text">{formatNumber(finca.superficie_ha)} ha</p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-lg border border-border">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Departamento</p>
              <p className="text-lg font-semibold text-text">#{finca.id_depto}</p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-lg border border-border">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Tipo</p>
              <Badge variant="primary">Finca</Badge>
            </div>
          </div>

          <div className="p-4 bg-neutral-50 rounded-lg border border-border">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Ubicación</p>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-text-muted" />
              <span className="text-text">Departamento #{finca.id_depto}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-text-muted">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          Información actualizada desde la API
        </div>
        <span>v1.0.0 · Uso interno</span>
      </div>
    </div>
  );
}
