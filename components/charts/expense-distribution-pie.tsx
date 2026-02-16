import { formatCurrency } from '@/lib/format/currency';
import type { ExpenseDistributionDatum } from '@/lib/finance/types';
import type { Currency } from '@/types/settings';

const COLORS = ['#2e4a78', '#44699f', '#5f86c0', '#7a9ecf', '#94b4dc', '#aec9e8'];

export function ExpenseDistributionPie({
  data,
  currency,
}: {
  data: ExpenseDistributionDatum[];
  currency: Currency;
}) {
  if (data.length === 0) {
    return <p className="text-sm muted">No recurring expense distribution available.</p>;
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const slices = data.reduce<Array<{ concept: string; segment: number; dashOffset: number; color: string }>>(
    (acc, item, index) => {
      const consumed = acc.reduce((sum, slice) => sum + slice.segment, 0);
      const segment = total > 0 ? (item.value / total) * circumference : 0;
      const dashOffset = circumference - consumed;
      return [
        ...acc,
        {
          concept: item.concept,
          segment,
          dashOffset,
          color: COLORS[index % COLORS.length],
        },
      ];
    },
    [],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[200px_1fr] lg:items-center">
      <svg viewBox="0 0 200 200" className="mx-auto h-44 w-44" role="img" aria-label="Expense distribution pie chart">
        <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--border)" strokeWidth="28" />
        {slices.map((slice) => {
          return (
            <circle
              key={slice.concept}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth="28"
              strokeDasharray={`${slice.segment} ${circumference - slice.segment}`}
              strokeDashoffset={slice.dashOffset}
              transform="rotate(-90 100 100)"
              strokeLinecap="butt"
            />
          );
        })}
        <text x="100" y="95" textAnchor="middle" className="fill-current text-[11px] muted">
          Total
        </text>
        <text x="100" y="115" textAnchor="middle" className="fill-current text-[15px] font-semibold">
          {formatCurrency(total, currency)}
        </text>
      </svg>

      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.concept} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                aria-hidden="true"
              />
              <p className="text-sm">{item.concept}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{formatCurrency(item.value, currency)}</p>
              <p className="text-xs muted">{item.percentage.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
