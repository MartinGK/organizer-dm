'use client';

import { useMemo, useState } from 'react';

import { buildMonthlyProjection } from '@/lib/finance/calculations';
import { monthLabel } from '@/lib/format/date';
import { formatCurrency } from '@/lib/format/currency';
import type { Entry } from '@/types/entry';
import type { Currency } from '@/types/settings';

type HorizonKey = '6m' | '1y' | '2y' | '4y';

const HORIZONS: Array<{ key: HorizonKey; label: string; months: number }> = [
  { key: '6m', label: '6 Months', months: 6 },
  { key: '1y', label: '1 Year', months: 12 },
  { key: '2y', label: '2 Years', months: 24 },
  { key: '4y', label: '4 Years', months: 48 },
];

export function ProjectionExplorer({ entries, currency }: { entries: Entry[]; currency: Currency }) {
  const [horizon, setHorizon] = useState<HorizonKey>('1y');
  const [baseMonth] = useState(() => new Date());
  const selected = HORIZONS.find((item) => item.key === horizon) ?? HORIZONS[1];

  const rows = useMemo(
    () => buildMonthlyProjection(entries, baseMonth, selected.months),
    [baseMonth, entries, selected.months],
  );

  const metrics = useMemo(() => {
    const totalIncome = rows.reduce((sum, row) => sum + row.income, 0);
    const totalExpenses = rows.reduce((sum, row) => sum + row.expenses, 0);
    const totalNet = rows.reduce((sum, row) => sum + row.net, 0);
    const avgNet = rows.length > 0 ? totalNet / rows.length : 0;
    const positiveMonths = rows.filter((row) => row.net >= 0).length;
    const bestMonth = rows.reduce((best, row) => (row.net > best.net ? row : best), rows[0]);
    const worstMonth = rows.reduce((worst, row) => (row.net < worst.net ? row : worst), rows[0]);

    return { totalIncome, totalExpenses, totalNet, avgNet, positiveMonths, bestMonth, worstMonth };
  }, [rows]);

  const graph = useMemo(() => buildGraphPaths(rows), [rows]);

  return (
    <section className="space-y-6">
      <div className="panel p-4">
        <h2 className="text-lg font-semibold">Projection</h2>
        <p className="mt-1 text-sm muted">Analyze expected income, expenses, and net result across time horizons.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {HORIZONS.map((item) => (
            <button
              key={item.key}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                item.key === horizon ? 'bg-[var(--accent)]/20 border-[var(--accent)]/40' : 'hover:bg-white/5'
              }`}
              onClick={() => setHorizon(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Projected income" value={formatCurrency(metrics.totalIncome, currency)} />
        <MetricCard label="Projected expenses" value={formatCurrency(metrics.totalExpenses, currency)} />
        <MetricCard
          label="Projected net"
          value={formatCurrency(metrics.totalNet, currency)}
          tone={metrics.totalNet < 0 ? 'metric-negative' : 'metric-positive'}
        />
        <MetricCard label="Average monthly net" value={formatCurrency(metrics.avgNet, currency)} />
      </div>

      <div className="panel p-4">
        <div className="mb-4 flex flex-wrap gap-4 text-sm">
          <Legend color="#7bd7c6" label="Income" />
          <Legend color="#ff7a92" label="Expenses" />
          <Legend color="#4d7eff" label="Net" />
        </div>
        <div className="overflow-x-auto">
          <svg className="h-64 w-full min-w-[640px]" viewBox="0 0 720 240" role="img" aria-label="Projection chart">
            <line x1="30" y1={graph.zeroY} x2="700" y2={graph.zeroY} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <path d={graph.incomePath} fill="none" stroke="#7bd7c6" strokeWidth="2.5" />
            <path d={graph.expensesPath} fill="none" stroke="#ff7a92" strokeWidth="2.5" />
            <path d={graph.netPath} fill="none" stroke="#4d7eff" strokeWidth="2.5" />
          </svg>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Positive months"
          value={`${metrics.positiveMonths}/${rows.length}`}
          hint={`${Math.round((metrics.positiveMonths / Math.max(rows.length, 1)) * 100)}% non-negative`}
        />
        <MetricCard
          label="Best month"
          value={metrics.bestMonth ? formatCurrency(metrics.bestMonth.net, currency) : '—'}
          hint={metrics.bestMonth ? monthLabel(new Date(`${metrics.bestMonth.month}-01T00:00:00`)) : undefined}
          tone="metric-positive"
        />
        <MetricCard
          label="Worst month"
          value={metrics.worstMonth ? formatCurrency(metrics.worstMonth.net, currency) : '—'}
          hint={metrics.worstMonth ? monthLabel(new Date(`${metrics.worstMonth.month}-01T00:00:00`)) : undefined}
          tone="metric-negative"
        />
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'metric-positive' | 'metric-negative';
}) {
  return (
    <article className="panel p-4">
      <p className="text-xs uppercase tracking-[0.13em] muted">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${tone ?? ''}`}>{value}</p>
      {hint ? <p className="mt-2 text-sm muted">{hint}</p> : null}
    </article>
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

function buildGraphPaths(rows: Array<{ income: number; expenses: number; net: number }>) {
  const width = 670;
  const height = 180;
  const offsetX = 30;
  const offsetY = 20;

  const values = rows.flatMap((row) => [row.income, row.expenses, row.net]);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const span = max - min || 1;
  const stepX = rows.length > 1 ? width / (rows.length - 1) : width;

  const yFor = (value: number) => offsetY + ((max - value) / span) * height;
  const zeroY = yFor(0);

  const pathFor = (pick: (row: { income: number; expenses: number; net: number }) => number) =>
    rows
      .map((row, index) => `${index === 0 ? 'M' : 'L'} ${offsetX + index * stepX} ${yFor(pick(row))}`)
      .join(' ');

  return {
    incomePath: pathFor((row) => row.income),
    expensesPath: pathFor((row) => row.expenses),
    netPath: pathFor((row) => row.net),
    zeroY,
  };
}
