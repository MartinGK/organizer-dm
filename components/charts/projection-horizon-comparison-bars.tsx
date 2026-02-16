import { formatCurrency } from '@/lib/format/currency';
import type { ProjectionComparisonDatum } from '@/lib/finance/types';
import type { Currency } from '@/types/settings';

export function ProjectionHorizonComparisonBars({
  data,
  currency,
}: {
  data: ProjectionComparisonDatum[];
  currency: Currency;
}) {
  if (data.length === 0) {
    return <p className="text-sm muted">No horizon comparison available.</p>;
  }

  const maxMagnitude = Math.max(
    ...data.flatMap((row) => [Math.abs(row.total_income), Math.abs(row.total_expenses), Math.abs(row.net_result)]),
    1,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <Legend color="#2d6a4f" label="Income" />
        <Legend color="#9b2c2c" label="Expenses" />
        <Legend color="#1d4ed8" label="Net" />
      </div>

      <div className="space-y-4">
        {data.map((row) => (
          <article key={row.horizon.key} className="rounded-lg border p-3">
            <p className="text-sm font-medium">{row.horizon.label}</p>
            <div className="mt-3 space-y-2">
              <BarRow label="Income" value={row.total_income} maxMagnitude={maxMagnitude} color="#2d6a4f" currency={currency} />
              <BarRow label="Expenses" value={row.total_expenses} maxMagnitude={maxMagnitude} color="#9b2c2c" currency={currency} />
              <BarRow label="Net" value={row.net_result} maxMagnitude={maxMagnitude} color="#1d4ed8" currency={currency} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function BarRow({
  label,
  value,
  maxMagnitude,
  color,
  currency,
}: {
  label: string;
  value: number;
  maxMagnitude: number;
  color: string;
  currency: Currency;
}) {
  return (
    <div className="grid grid-cols-[72px_1fr_auto] items-center gap-2 text-sm">
      <p className="muted">{label}</p>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--border)]/70">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max((Math.abs(value) / maxMagnitude) * 100, 2)}%`,
            backgroundColor: color,
          }}
          aria-hidden="true"
        />
      </div>
      <p className="font-medium">{formatCurrency(value, currency)}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="muted">{label}</span>
    </div>
  );
}
