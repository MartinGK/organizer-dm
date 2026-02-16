import { monthLabel } from '@/lib/format/date';
import { formatCurrency } from '@/lib/format/currency';
import type { ProjectionGraphPoint } from '@/lib/finance/types';
import type { Currency } from '@/types/settings';

export function ProjectionCashflowArea({ points, currency }: { points: ProjectionGraphPoint[]; currency: Currency }) {
  if (points.length === 0) {
    return <p className="text-sm muted">No cumulative projection data available.</p>;
  }

  const graph = buildCashflowGraph(points);
  const first = points[0];
  const last = points[points.length - 1];
  const avgMonthlyNet = points.reduce((sum, point) => sum + point.net, 0) / points.length;
  const bestMonth = points.reduce((best, point) => (point.net > best.net ? point : best), points[0]);
  const worstMonth = points.reduce((worst, point) => (point.net < worst.net ? point : worst), points[0]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <Legend color="#1e3a8a" label="Cumulative from zero" />
        {last.cumulative_from_cash_on_hand !== null ? <Legend color="#166534" label="Cumulative with cash on hand" /> : null}
      </div>

      <div className="overflow-x-auto">
        <svg className="h-64 w-full min-w-[640px]" viewBox="0 0 720 260" role="img" aria-label="Projected cumulative cashflow">
          {graph.gridY.map((y) => (
            <line key={y} x1="30" y1={y} x2="700" y2={y} stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
          ))}
          <line x1="30" y1={graph.zeroY} x2="700" y2={graph.zeroY} stroke="rgba(148,163,184,0.45)" strokeWidth="1.1" />

          <path d={graph.areaPath} fill="rgba(30,58,138,0.18)" />
          <path d={graph.zeroPath} fill="none" stroke="#1e3a8a" strokeWidth="2.25" />
          {graph.cashPath ? <path d={graph.cashPath} fill="none" stroke="#166534" strokeWidth="2" /> : null}

          <circle cx={graph.startPoint.x} cy={graph.startPoint.y} r="2.8" fill="#1e3a8a" />
          <circle cx={graph.endPoint.x} cy={graph.endPoint.y} r="2.8" fill="#1e3a8a" />
        </svg>
      </div>

      <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <p className="muted">Start cumulative: {formatCurrency(first.cumulative_from_zero, currency)}</p>
        <p className="muted">End cumulative: {formatCurrency(last.cumulative_from_zero, currency)}</p>
        <p className="muted">Average monthly net: {formatCurrency(avgMonthlyNet, currency)}</p>
        <p className="muted">
          Range: {monthLabel(new Date(`${first.month}-01T00:00:00`))} to {monthLabel(new Date(`${last.month}-01T00:00:00`))}
        </p>
      </div>

      <div className="grid gap-3 text-xs sm:grid-cols-2">
        <p className="muted">
          Best month net: {formatCurrency(bestMonth.net, currency)} ({monthLabel(new Date(`${bestMonth.month}-01T00:00:00`))})
        </p>
        <p className="muted">
          Worst month net: {formatCurrency(worstMonth.net, currency)} ({monthLabel(new Date(`${worstMonth.month}-01T00:00:00`))})
        </p>
      </div>
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

function buildCashflowGraph(points: ProjectionGraphPoint[]) {
  const width = 670;
  const height = 190;
  const offsetX = 30;
  const offsetY = 20;
  const stepX = points.length > 1 ? width / (points.length - 1) : width;

  const values = points.flatMap((point) => [point.cumulative_from_zero, point.cumulative_from_cash_on_hand ?? 0]);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const span = max - min || 1;
  const yFor = (value: number) => offsetY + ((max - value) / span) * height;
  const xFor = (index: number) => offsetX + index * stepX;
  const zeroY = yFor(0);

  const zeroPath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index)} ${yFor(point.cumulative_from_zero)}`)
    .join(' ');

  const areaPath = `${zeroPath} L ${xFor(points.length - 1)} ${zeroY} L ${xFor(0)} ${zeroY} Z`;

  const hasCashPath = points.some((point) => point.cumulative_from_cash_on_hand !== null);
  const cashPath = hasCashPath
    ? points
        .map((point, index) => {
          const value = point.cumulative_from_cash_on_hand ?? point.cumulative_from_zero;
          return `${index === 0 ? 'M' : 'L'} ${xFor(index)} ${yFor(value)}`;
        })
        .join(' ')
    : null;

  return {
    areaPath,
    zeroPath,
    cashPath,
    gridY: [offsetY, offsetY + height / 2, offsetY + height],
    zeroY,
    startPoint: { x: xFor(0), y: yFor(points[0].cumulative_from_zero) },
    endPoint: { x: xFor(points.length - 1), y: yFor(points[points.length - 1].cumulative_from_zero) },
  };
}
