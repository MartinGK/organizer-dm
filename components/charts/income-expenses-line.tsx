import { monthLabel } from '@/lib/format/date';
import { formatCurrency } from '@/lib/format/currency';
import type { IncomeExpenseTimelinePoint } from '@/lib/finance/types';
import type { Currency } from '@/types/settings';

export function IncomeExpensesLine({
  points,
  currency,
}: {
  points: IncomeExpenseTimelinePoint[];
  currency: Currency;
}) {
  if (points.length === 0) {
    return <p className="text-sm muted">No operational timeline data available.</p>;
  }

  const graph = buildGraphPaths(points);
  const start = points[0];
  const end = points[points.length - 1];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-sm">
        <Legend color="#2d6a4f" label="Income" />
        <Legend color="#9b2c2c" label="Expenses" />
        <Legend color="#1d4ed8" label="Net" />
      </div>

      <div className="overflow-x-auto">
        <svg className="h-64 w-full min-w-[640px]" viewBox="0 0 720 240" role="img" aria-label="Income versus expenses over time">
          <line x1="30" y1={graph.zeroY} x2="700" y2={graph.zeroY} stroke="rgba(148,163,184,0.5)" strokeWidth="1" />
          <path d={graph.incomePath} fill="none" stroke="#2d6a4f" strokeWidth="2.25" />
          <path d={graph.expensesPath} fill="none" stroke="#9b2c2c" strokeWidth="2.25" />
          <path d={graph.netPath} fill="none" stroke="#1d4ed8" strokeWidth="2.25" />
        </svg>
      </div>

      <p className="text-xs muted">
        Range: {monthLabel(new Date(`${start.month}-01T00:00:00`))} to {monthLabel(new Date(`${end.month}-01T00:00:00`))}.
        Current net: {formatCurrency(end.net, currency)}
      </p>
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

function buildGraphPaths(points: IncomeExpenseTimelinePoint[]) {
  const width = 670;
  const height = 180;
  const offsetX = 30;
  const offsetY = 20;

  const values = points.flatMap((point) => [point.income, point.expenses, point.net]);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const span = max - min || 1;
  const stepX = points.length > 1 ? width / (points.length - 1) : width;

  const yFor = (value: number) => offsetY + ((max - value) / span) * height;
  const zeroY = yFor(0);

  const pathFor = (pick: (point: IncomeExpenseTimelinePoint) => number) =>
    points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${offsetX + index * stepX} ${yFor(pick(point))}`).join(' ');

  return {
    incomePath: pathFor((point) => point.income),
    expensesPath: pathFor((point) => point.expenses),
    netPath: pathFor((point) => point.net),
    zeroY,
  };
}
