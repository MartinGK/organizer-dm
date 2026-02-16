import { monthLabel } from '@/lib/format/date';
import { formatCurrency } from '@/lib/format/currency';
import type { ProjectionGraphPoint } from '@/lib/finance/types';
import type { Currency } from '@/types/settings';

export function ProjectionIncomeExpensesNetLine({
  points,
  currency,
}: {
  points: ProjectionGraphPoint[];
  currency: Currency;
}) {
  if (points.length === 0) {
    return <p className="text-sm muted">No projection data available.</p>;
  }

  const graph = buildGraphPaths(points);
  const minNet = Math.min(...points.map((point) => point.net));
  const maxNet = Math.max(...points.map((point) => point.net));
  const isStable = Math.abs(maxNet - minNet) < 0.01;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <Legend color="#2d6a4f" label="Income" />
        <Legend color="#9b2c2c" label="Expenses" />
        <Legend color="#1d4ed8" label="Net" />
      </div>

      <div className="overflow-x-auto">
        <svg className="h-64 w-full min-w-[640px]" viewBox="0 0 720 260" role="img" aria-label="Projected income expenses net">
          {graph.gridY.map((y) => (
            <line key={y} x1="30" y1={y} x2="700" y2={y} stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
          ))}
          <line x1="30" y1={graph.zeroY} x2="700" y2={graph.zeroY} stroke="rgba(148,163,184,0.45)" strokeWidth="1.1" />

          <path d={graph.incomePath} fill="none" stroke="#2d6a4f" strokeWidth="2.25" />
          <path d={graph.expensesPath} fill="none" stroke="#9b2c2c" strokeWidth="2.25" />
          <path d={graph.netPath} fill="none" stroke="#1d4ed8" strokeWidth="2.25" />

          {graph.markers.income.map((marker) => (
            <circle key={`income-${marker.x}-${marker.y}`} cx={marker.x} cy={marker.y} r="2.4" fill="#2d6a4f" />
          ))}
          {graph.markers.expenses.map((marker) => (
            <circle key={`expenses-${marker.x}-${marker.y}`} cx={marker.x} cy={marker.y} r="2.4" fill="#9b2c2c" />
          ))}
          {graph.markers.net.map((marker) => (
            <circle key={`net-${marker.x}-${marker.y}`} cx={marker.x} cy={marker.y} r="2.4" fill="#1d4ed8" />
          ))}
        </svg>
      </div>

      <div className="grid gap-3 text-xs sm:grid-cols-3">
        <p className="muted">
          Start: {monthLabel(new Date(`${points[0].month}-01T00:00:00`))} | End:{' '}
          {monthLabel(new Date(`${points[points.length - 1].month}-01T00:00:00`))}
        </p>
        <p className="muted">Final projected net: {formatCurrency(points[points.length - 1].net, currency)}</p>
        <p className="muted">Net range in horizon: {formatCurrency(maxNet - minNet, currency)}</p>
      </div>

      {isStable ? (
        <p className="text-xs muted">Projected values are stable month to month for this horizon based on current recurring entries.</p>
      ) : null}
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

function buildGraphPaths(points: ProjectionGraphPoint[]) {
  const width = 670;
  const height = 190;
  const offsetX = 30;
  const offsetY = 20;

  const values = points.flatMap((point) => [point.income, point.expenses, point.net]);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const span = max - min || 1;
  const stepX = points.length > 1 ? width / (points.length - 1) : width;

  const yFor = (value: number) => offsetY + ((max - value) / span) * height;
  const xFor = (index: number) => offsetX + index * stepX;
  const zeroY = yFor(0);

  const pathFor = (pick: (point: ProjectionGraphPoint) => number) =>
    points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index)} ${yFor(pick(point))}`).join(' ');

  const markerIndexes = Array.from(new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]));
  const markersFor = (pick: (point: ProjectionGraphPoint) => number) =>
    markerIndexes.map((index) => ({ x: xFor(index), y: yFor(pick(points[index])) }));

  return {
    incomePath: pathFor((point) => point.income),
    expensesPath: pathFor((point) => point.expenses),
    netPath: pathFor((point) => point.net),
    markers: {
      income: markersFor((point) => point.income),
      expenses: markersFor((point) => point.expenses),
      net: markersFor((point) => point.net),
    },
    gridY: [offsetY, offsetY + height / 2, offsetY + height],
    zeroY,
  };
}
