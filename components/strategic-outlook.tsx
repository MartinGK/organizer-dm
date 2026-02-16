import { PROJECTION_HORIZONS } from '@/lib/finance/calculations';
import { formatCurrency } from '@/lib/format/currency';
import type { ProjectionResultMap } from '@/lib/finance/types';
import type { Currency } from '@/types/settings';

export function StrategicOutlook({
  projection,
  currency,
}: {
  projection: ProjectionResultMap;
  currency: Currency;
}) {
  return (
    <section className="panel p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Strategic Outlook</h2>
        <p className="mt-1 text-sm muted">Deterministic scenarios based on active recurring entries.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {PROJECTION_HORIZONS.map((horizon) => {
          const row = projection[horizon.key];
          return (
            <article key={horizon.key} className="rounded-xl border p-4">
              <p className="text-xs uppercase tracking-[0.13em] muted">{row.horizon.label}</p>
              <p className={`mt-2 text-2xl font-semibold ${row.net_result < 0 ? 'metric-negative' : 'metric-positive'}`}>
                {formatCurrency(row.net_result, currency)}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <p className="muted">Total income</p>
                <p className="text-right">{formatCurrency(row.total_income, currency)}</p>
                <p className="muted">Total expenses</p>
                <p className="text-right">{formatCurrency(row.total_expenses, currency)}</p>
                <p className="muted">Accumulated result</p>
                <p className="text-right">{formatCurrency(row.accumulated_cashflow.from_zero, currency)}</p>
                <p className="muted">Accumulated (cash base)</p>
                <p className="text-right">
                  {row.accumulated_cashflow.from_cash_on_hand === null
                    ? 'N/A'
                    : formatCurrency(row.accumulated_cashflow.from_cash_on_hand, currency)}
                </p>
              </div>

              <p className="mt-3 text-xs muted">
                One-time balance in this horizon: {formatCurrency(row.one_time_balance_disclaimer, currency)} (income - expenses).
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
