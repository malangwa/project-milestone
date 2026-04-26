import type { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function Table<T extends { id?: string }>({
  columns,
  data,
  loading,
  emptyMessage = 'No data available',
  onRowClick,
  className = '',
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="w-full">
        <div className="border-b border-gray-200">
          <div className="flex bg-gray-50 p-3 gap-4">
            {columns.map((col) => (
              <div key={col.key} className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
            ))}
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex p-3 gap-4 border-b border-gray-100">
            {columns.map((col) => (
              <div key={col.key} className="h-4 bg-gray-100 rounded animate-pulse flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4 ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td key={col.key} className={`py-3 px-4 text-sm text-gray-700 ${col.className || ''}`}>
                  {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}