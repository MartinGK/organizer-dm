import { monthLabel } from '@/lib/format/date';
import { formatCurrency } from '@/lib/format/currency';
import type { ProjectionRow } from '@/lib/finance/types';
import type { Currency } from '@/types/settings';

export function ProjectionTable({ rows, currency }: { rows: ProjectionRow[]; currency: Currency }) {
  return (
    <section className="panel p-4">
      <h2 className="mb-4 text-lg font-semibold">12-Month Projection</h2>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b text-left muted">
              <th className="px-3 py-2 font-medium">Month</th>
              <th className="px-3 py-2 font-medium">Income</th>
              <th className="px-3 py-2 font-medium">Expenses</th>
              <th className="px-3 py-2 font-medium">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const monthDate = new Date(`${row.month}-01T00:00:00`);
              return (
                <tr key={row.month} className="border-b border-[var(--border)]/60">
                  <td className="px-3 py-2">{monthLabel(monthDate)}</td>
                  <td className="px-3 py-2">{formatCurrency(row.income, currency)}</td>
                  <td className="px-3 py-2">{formatCurrency(row.expenses, currency)}</td>
                  <td className={`px-3 py-2 ${row.net < 0 ? 'metric-negative' : 'metric-positive'}`}>
                    {formatCurrency(row.net, currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 sm:hidden">
        {rows.map((row) => {
          const monthDate = new Date(`${row.month}-01T00:00:00`);
          return (
            <article key={row.month} className="rounded-xl border p-3">
              <p className="text-sm font-semibold">{monthLabel(monthDate)}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <p className="muted">Income</p>
                <p>{formatCurrency(row.income, currency)}</p>
                <p className="muted">Expenses</p>
                <p>{formatCurrency(row.expenses, currency)}</p>
                <p className="muted">Net</p>
                <p className={row.net < 0 ? 'metric-negative' : 'metric-positive'}>
                  {formatCurrency(row.net, currency)}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
