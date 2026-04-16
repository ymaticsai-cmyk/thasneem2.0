import { cx } from './utils';

export default function DataTable({ columns, rows, emptyState = 'No data available' }) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface-muted p-5 text-sm text-text-muted">
        {emptyState}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)]">
      <table className="min-w-[640px] w-full divide-y divide-border text-left text-sm">
        <thead className="bg-surface-muted">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium text-text-muted">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, idx) => (
            <tr key={row.id || idx} className="transition-colors hover:bg-surface-muted">
              {columns.map((col) => (
                <td key={col.key} className={cx('px-4 py-3 text-text', col.className)}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
