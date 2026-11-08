import { Card, CardContent } from "../../ui";
import { Button, Input, Select, Badge, Table } from "../../ui";
import { Plus, Download, Search, Columns, Filter, X } from "lucide-react";
import { MOCK_WINE_BATCHES, BATCH_STATUS_LABELS, BATCH_STATUS_VARIANTS } from "../../data/constants";

const TABS = [
  { id: "all", label: "All batches", count: 128 },
  { id: "production", label: "In production", count: 96 },
  { id: "ready", label: "Ready", count: 24 },
  { id: "pending", label: "Pending review", count: 8 },
];

const FILTER_OPTIONS = {
  vintage: [
    { value: "", label: "All" },
    { value: "2024", label: "2024" },
    { value: "2025", label: "2025" },
    { value: "2023", label: "2023" },
  ],
  grape: [
    { value: "", label: "All" },
    { value: "malbec", label: "Malbec" },
    { value: "cabernet", label: "Cabernet Sauvignon" },
    { value: "chardonnay", label: "Chardonnay" },
    { value: "bonarda", label: "Bonarda" },
  ],
  status: [
    { value: "", label: "All" },
    { value: "aging", label: "Aging" },
    { value: "fermenting", label: "Fermenting" },
    { value: "ready", label: "Ready" },
    { value: "pending_review", label: "Pending review" },
  ],
  vineyard: [
    { value: "", label: "All" },
    { value: "finca-los-alamos", label: "Finca Los Álamos" },
    { value: "finca-el-mirador", label: "Finca El Mirador" },
    { value: "finca-los-olivos", label: "Finca Los Olivos" },
  ],
};

export function WineTable({ data, selectedKeys, onSelectionChange, sortConfig, onSort, page, setPage }) {
  const pageSize = 10;

  const renderWineName = (row) => (
    <div>
      <p className="font-medium text-primary">{row.wineName}</p>
      <p className="text-xs text-text-muted">{row.batchId}</p>
    </div>
  );

  const renderStatus = (row) => (
    <Badge variant={BATCH_STATUS_VARIANTS[row.status]} dot>
      {BATCH_STATUS_LABELS[row.status]}
    </Badge>
  );

  const renderVolume = (row) => (
    <span className="font-medium text-text">{row.volume.toLocaleString()} L</span>
  );

  const renderActions = (row) => (
    <button className="p-1.5 rounded-lg hover:bg-hover transition-colors" aria-label={`Editar ${row.wineName}`}>
      <svg className="h-4 w-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
    </button>
  );

  const tableColumns = [
    { key: "wineName", header: "Wine / Batch ID", width: "300px", render: renderWineName },
    { key: "vintage", header: "Vintage", width: "80px", align: "center" },
    { key: "grapeVariety", header: "Grape variety", width: "140px" },
    { key: "volume", header: "Volume", width: "110px", align: "right", render: renderVolume },
    { key: "cellarLocation", header: "Location", width: "110px", align: "center" },
    { key: "status", header: "Status", width: "140px", render: renderStatus },
    { key: "updatedAt", header: "Updated", width: "110px", align: "center" },
    { key: "actions", header: "", width: "50px", align: "center", render: renderActions },
  ];

  const paginatedData = data.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Table
      columns={tableColumns}
      data={paginatedData}
      keyExtractor={(row) => row.id}
      selectable
      selectedKeys={selectedKeys}
      onSelectionChange={onSelectionChange}
      sortKey={sortConfig.key}
      sortDirection={sortConfig.direction}
      onSort={onSort}
      pagination={{
        page,
        pageSize,
        total: data.length,
        onPageChange: setPage,
        onPageSizeChange: (size) => { setPage(1); },
      }}
    />
  );
}

export function RecordTabs({ activeTab, setActiveTab }) {
  return (
    <div className="border-b border-border px-6 py-4">
      <div className="flex items-center gap-1 border-b border-border pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors duration-fast ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text hover:border-border"
            }`}
          >
            {tab.label} <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">{tab.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SearchToolbar({ search, setSearch, filteredCount }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
      <div className="relative w-full lg:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-light" />
        <input
          type="text"
          placeholder="Search by wine name, batch ID, or grape variety?"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-white text-text placeholder:text-text-light focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-muted">{filteredCount} records</span>
        <Button variant="secondary" leftIcon={<Columns className="h-4 w-4" />}>
          Columns
        </Button>
      </div>
    </div>
  );
}

export function AdvancedFilters({ filters, setFilters, hasActiveFilters }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Filter className="h-4 w-4" />
        Filter by
      </div>
      <Select
        options={FILTER_OPTIONS.vintage}
        placeholder="Vintage: All"
        value={filters.vintage}
        onChange={(e) => setFilters({ ...filters, vintage: e.target.value })}
      />
      <Select
        options={FILTER_OPTIONS.grape}
        placeholder="Grape variety: All"
        value={filters.grape}
        onChange={(e) => setFilters({ ...filters, grape: e.target.value })}
      />
      <Select
        options={FILTER_OPTIONS.status}
        placeholder="Status: All"
        value={filters.status}
        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
      />
      <Select
        options={FILTER_OPTIONS.vineyard}
        placeholder="Vineyard: All"
        value={filters.vineyard}
        onChange={(e) => setFilters({ ...filters, vineyard: e.target.value })}
      />
      {hasActiveFilters && (
        <button
          onClick={() => setFilters({ vintage: "", grape: "", status: "", vineyard: "" })}
          className="ml-auto text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-1"
        >
          <X className="h-3.5 w-3.5" />
          Clear filters
        </button>
      )}
    </div>
  );
}

export function DatabaseHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-semibold text-text">Database</h1>
        <p className="text-md text-text-muted mt-1">Manage wine batches, cellar inventory, and vintage records.</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />}>
          Export
        </Button>
        <Button leftIcon={<Plus className="h-4 w-4" />}>
          Add New
        </Button>
      </div>
    </div>
  );
}

export function DatabaseFooter() {
  return (
    <div className="flex items-center justify-between text-sm text-text-muted">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        Complete history preserved for every batch
      </div>
      <span>v2.1.0 ? Internal use only</span>
    </div>
  );
}
