import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../ui";
import { Button, Input, Select, Badge } from "../../ui";
import { ChevronDown, Lock, Shield, ArrowUpRight, Info, Check } from "lucide-react";
import { BATCH_STATUS_LABELS, BATCH_STATUS_VARIANTS } from "../../data/constants";

const VINTAGE_OPTIONS = [
  { value: "", label: "Select vintage" },
  { value: "2024", label: "2024" },
  { value: "2025", label: "2025" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
];

const GRAPE_OPTIONS = [
  { value: "", label: "Select grape variety" },
  { value: "malbec", label: "Malbec" },
  { value: "cabernet", label: "Cabernet Sauvignon" },
  { value: "chardonnay", label: "Chardonnay" },
  { value: "bonarda", label: "Bonarda" },
  { value: "syrah", label: "Syrah" },
  { value: "pinot", label: "Pinot Noir" },
];

const VINEYARD_OPTIONS = [
  { value: "", label: "Select vineyard" },
  { value: "finca-los-alamos", label: "Finca Los Álamos" },
  { value: "finca-el-mirador", label: "Finca El Mirador" },
  { value: "finca-los-olivos", label: "Finca Los Olivos" },
  { value: "finca-san-martin", label: "Finca San Martín" },
];

const ZONE_OPTIONS = [
  { value: "", label: "Select estate zone" },
  { value: "san-rafael-block-03", label: "San Rafael ? Block 03" },
  { value: "san-rafael-block-07", label: "San Rafael ? Block 07" },
  { value: "san-rafael-block-02", label: "San Rafael ? Block 02" },
  { value: "lujan-block-01", label: "Luján de Cuyo · Block 01" },
];

const LOCATION_OPTIONS = [
  { value: "", label: "Select cellar location" },
  { value: "fr-08", label: "FR-08 ? French oak barrels" },
  { value: "ss-12", label: "SS-12 ? Stainless steel tanks" },
  { value: "ss-04", label: "SS-04 ? Stainless steel tanks" },
  { value: "fr-06", label: "FR-06 ? French oak barrels" },
  { value: "ss-09", label: "SS-09 ? Stainless steel tanks" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Select production status" },
  { value: "aging", label: "Aging" },
  { value: "fermenting", label: "Fermenting" },
  { value: "ready", label: "Ready" },
  { value: "pending_review", label: "Pending review" },
];

const WINEMAKER_OPTIONS = [
  { value: "", label: "Select winemaker" },
  { value: "diego-torres", label: "Diego Torres" },
  { value: "sofia-ruiz", label: "Sofía Ruiz" },
  { value: "lucia-martinez", label: "Lucía Martínez" },
];

export function WineDetailsSection({ formData, handleChange }) {
  return (
    <Card variant="bordered" padding="lg">
      <CardHeader className="flex items-center justify-between mb-6">
        <CardTitle>Wine details</CardTitle>
        <CardDescription>* Required fields</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Input
              label="Wine name *"
              value={formData.wineName}
              onChange={(e) => handleChange("wineName", e.target.value)}
              required
            />
          </div>
          <div className="lg:col-span-4">
            <label className="block text-md font-semibold text-text mb-2">
              Batch ID
            </label>
            <div className="relative">
              <Input
                value={formData.batchId}
                readOnly
                className="bg-input-readonly"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-light" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Select
            label="Vintage *"
            options={VINTAGE_OPTIONS}
            value={formData.vintage}
            onChange={(e) => handleChange("vintage", e.target.value)}
            required
          />
          <Select
            label="Grape variety *"
            options={GRAPE_OPTIONS}
            value={formData.grapeVariety}
            onChange={(e) => handleChange("grapeVariety", e.target.value)}
            required
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function OriginCellarSection({ formData, handleChange }) {
  return (
    <Card variant="bordered" padding="lg">
      <CardHeader className="flex items-center justify-between mb-6">
        <CardTitle>Origin & cellar</CardTitle>
        <CardDescription>Track provenance and storage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Select
            label="Vineyard *"
            options={VINEYARD_OPTIONS}
            value={formData.vineyard}
            onChange={(e) => handleChange("vineyard", e.target.value)}
            required
          />
          <Select
            label="Estate zone"
            options={ZONE_OPTIONS}
            value={formData.estateZone}
            onChange={(e) => handleChange("estateZone", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Input
            label="Volume (litres) *"
            type="number"
            value={formData.volume}
            onChange={(e) => handleChange("volume", e.target.value)}
            required
            placeholder="e.g. 12400"
          />
          <Select
            label="Cellar location *"
            options={LOCATION_OPTIONS}
            value={formData.cellarLocation}
            onChange={(e) => handleChange("cellarLocation", e.target.value)}
            required
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function StatusNotesSection({ formData, handleChange }) {
  return (
    <Card variant="bordered" padding="lg">
      <CardHeader className="flex items-center justify-between mb-6">
        <CardTitle>Status & notes</CardTitle>
        <CardDescription>Keep the team informed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Select
            label="Production status *"
            options={STATUS_OPTIONS}
            value={formData.status}
            onChange={(e) => handleChange("status", e.target.value)}
            required
          />
          <Select
            label="Responsible winemaker"
            options={WINEMAKER_OPTIONS}
            value={formData.winemaker}
            onChange={(e) => handleChange("winemaker", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-md font-semibold text-text mb-2">
            Cellar notes
          </label>
          <textarea
            value={formData.tastingNotes}
            onChange={(e) => handleChange("tastingNotes", e.target.value)}
            rows={4}
            className="w-full h-28 px-3 rounded-lg border border-border bg-white text-text placeholder:text-text-light focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 resize-none"
            placeholder="Dark plum and violet aromas. Aging in French oak; next tasting scheduled for 15 November 2026."
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function BatchSummaryCard({ batch }) {
  return (
    <Card variant="bordered" padding="none" className="overflow-hidden">
      <div className="bg-primary-light p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 bg-primary rounded-lg flex-center">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <Badge variant="primary" className="text-xs uppercase tracking-wide">
            GRAN RESERVA
          </Badge>
        </div>
        <div>
          <p className="text-2xl font-semibold text-primary leading-tight">{batch.wineName}</p>
          <p className="text-xl font-semibold text-primary">{batch.vintage}</p>
        </div>
        <p className="text-sm text-primary">{batch.batchId} ? Red wine</p>
      </div>

      <CardContent className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Current volume</span>
            <span className="font-medium text-text">{batch.volume.toLocaleString()} L</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Cellar location</span>
            <span className="font-medium text-text">{batch.cellarLocation}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Created</span>
            <span className="font-medium text-text">18 Mar 2024</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Last updated</span>
            <span className="font-medium text-text">{batch.updatedAt}</span>
          </div>
        </div>
        <hr className="border-border" />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neutral-100 rounded-full flex-center">
            <span className="text-xs font-medium text-text-muted">LM</span>
          </div>
          <div>
            <p className="text-xs text-text-muted">Last updated by</p>
            <p className="text-sm font-medium text-text">Lucía Martínez</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TraceabilityCard() {
  return (
    <Card variant="bordered" padding="lg">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex-center flex-shrink-0">
          <Shield className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg">A complete history, preserved</CardTitle>
          <CardDescription className="mt-1">
            Changes are saved to the activity log with your name and a timestamp. The batch ID cannot be changed.
          </CardDescription>
        </div>
      </div>
      <CardFooter className="pt-4">
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View batch history
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </CardFooter>
    </Card>
  );
}

export function FormActions({ onCancel, onSubmit }) {
  return (
    <div className="border-t border-border pt-5 flex items-center justify-end gap-3">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Info className="h-4 w-4 flex-shrink-0" />
        <span>Changes apply to this batch only.</span>
      </div>
      <Button type="button" variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" form="edit-form" leftIcon={<Check className="h-4 w-4" />}>
        Save Changes
      </Button>
    </div>
  );
}

export function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      <ol className="flex items-center gap-2">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronDown className="h-3 w-3 text-text-light flex-shrink-0 rotate-90" aria-hidden="true" />
            )}
            {item.href && !item.current ? (
              <a
                href={item.href}
                className="text-text-muted hover:text-primary transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span className="font-medium text-text">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
