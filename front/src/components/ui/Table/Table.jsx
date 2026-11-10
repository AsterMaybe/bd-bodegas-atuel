import { forwardRef } from "react";
import { clsx } from "clsx";
import { Checkbox } from "../Checkbox";
import { ChevronLeft, ChevronRight } from "lucide-react";

function TableHeader({
  columns,
  selectable,
  selectedKeys,
  onSelectAll,
  sortKey,
  sortDirection,
  onSort,
}) {
  const handleSort = (key) => {
    if (!onSort) return;
    const newDirection = sortKey === key && sortDirection === "asc" ? "desc" : "asc";
    onSort(key, newDirection);
  };

  return (
    <thead className="bg-neutral-50 border-b border-border">
      <tr>
        {selectable && (
          <th className="w-10 px-3 py-3 text-left">
            <Checkbox
              checked={selectedKeys && selectedKeys.size > 0}
              indeterminate={selectedKeys && selectedKeys.size > 0 && selectedKeys.size < 100}
              onChange={onSelectAll}
              aria-label="Seleccionar todo"
            />
          </th>
        )}
        {columns.map((column) => (
          <th
            key={column.key}
            style={{ width: column.width }}
            className={clsx(
              "px-3 py-3 text-left font-medium text-text-muted text-sm whitespace-nowrap",
              column.sortable && "cursor-pointer hover:text-text select-none",
              column.align === "center" && "text-center",
              column.align === "right" && "text-right"
            )}
            onClick={() => column.sortable && handleSort(column.key)}
          >
            <div className="flex items-center gap-1 justify-start">
              {column.header}
              {column.sortable && sortKey === column.key && (
                <span className="flex-shrink-0">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}

function TableBody({
  columns,
  data,
  keyExtractor,
  selectable,
  selectedKeys,
  onSelectionChange,
  onRowClick,
  emptyMessage = "No hay datos disponibles",
}) {
  if (data.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-3 py-12 text-center text-text-muted">
            {emptyMessage}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="divide-y divide-border">
      {data.map((row, rowIndex) => {
        const rowKey = keyExtractor(row);
        const isSelected = selectedKeys?.has(rowKey);
        
        return (
          <tr
            key={rowKey}
            className={clsx(
              "transition-colors duration-fast",
              onRowClick && "cursor-pointer hover:bg-hover",
              isSelected && "bg-primary-light/50"
            )}
            onClick={() => onRowClick?.(row)}
          >
            {selectable && (
              <td className="px-3 py-3">
                <Checkbox
                  checked={isSelected}
                  onChange={(e) => {
                    const newKeys = new Set(selectedKeys || []);
                    if (e.target.checked) {
                      newKeys.add(rowKey);
                    } else {
                      newKeys.delete(rowKey);
                    }
                    onSelectionChange?.(newKeys);
                  }}
                  aria-label={`Seleccionar fila ${rowIndex + 1}`}
                />
              </td>
            )}
            {columns.map((column) => (
              <td
                key={column.key}
                className={clsx(
                  "px-3 py-3 text-sm text-text",
                  column.align === "center" && "text-center",
                  column.align === "right" && "text-right"
                )}
              >
                {column.render ? column.render(row, rowIndex) : String(row[column.key] ?? "")}
              </td>
            ))}
          </tr>
        );
      })}
    </tbody>
  );
}

function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-3 py-3 border-t border-border">
      <div className="text-sm text-text-muted">
        Mostrando {start} a {end} de {total} registros
      </div>
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-2 py-1 text-sm border border-border rounded-lg bg-card focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Registros por página"
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size} por página
            </option>
          ))}
        </select>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm text-text px-2">
          Página {page} de {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function Table({
  columns,
  data,
  keyExtractor,
  selectable,
  selectedKeys,
  onSelectionChange,
  onRowClick,
  sortKey,
  sortDirection,
  onSort,
  loading,
  emptyMessage,
  pagination,
  className,
  ...props
}) {
  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectedKeys && selectedKeys.size === data.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map(keyExtractor)));
    }
  };

  return (
    <div className={clsx("bg-card rounded-2xl border border-border overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full" {...props}>
          <TableHeader
            columns={columns}
            selectable={selectable}
            selectedKeys={selectedKeys}
            onSelectAll={handleSelectAll}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <TableBody
            columns={columns}
            data={data}
            keyExtractor={keyExtractor}
            selectable={selectable}
            selectedKeys={selectedKeys}
            onSelectionChange={onSelectionChange}
            onRowClick={onRowClick}
            emptyMessage={emptyMessage}
          />
        </table>
      </div>
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      )}
      {pagination && (
        <TablePagination {...pagination} />
      )}
    </div>
  );
}
