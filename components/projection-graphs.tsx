'use client';

import { useMemo, useState } from 'react';

import { ProjectionCashflowArea } from '@/components/charts/projection-cashflow-area';
import { ProjectionHorizonComparisonBars } from '@/components/charts/projection-horizon-comparison-bars';
import { ProjectionIncomeExpensesNetLine } from '@/components/charts/projection-income-expenses-net-line';
import { PROJECTION_HORIZONS } from '@/lib/finance/calculations';
import type { ProjectionComparisonDatum, ProjectionGraphSeriesByHorizon, ProjectionHorizonKey } from '@/lib/finance/types';
import type { Currency } from '@/types/settings';

export function ProjectionGraphs({
  seriesByHorizon,
  comparisonData,
  currency,
}: {
  seriesByHorizon: ProjectionGraphSeriesByHorizon;
  comparisonData: ProjectionComparisonDatum[];
  currency: Currency;
}) {
  const [horizon, setHorizon] = useState<ProjectionHorizonKey>('1y');

  const selectedPoints = useMemo(() => seriesByHorizon[horizon] ?? [], [horizon, seriesByHorizon]);

  return (
    <section className="space-y-6">
      <article className="panel p-4">
        <h2 className="text-lg font-semibold">Projection Graphs</h2>
        <p className="mt-1 text-sm muted">Executive visual summary of deterministic recurring-entry projections.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {PROJECTION_HORIZONS.map((item) => (
            <button
              key={item.key}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                item.key === horizon
                  ? 'border-[var(--text-primary)]/20 bg-[var(--surface-elevated)]'
                  : 'border-transparent hover:border-[var(--border)]'
              }`}
              onClick={() => setHorizon(item.key)}
              type="button"
            >
              {item.label.replace(' Projection', '')}
            </button>
          ))}
        </div>
      </article>

      <article className="panel p-4">
        <h3 className="text-base font-semibold">Projected Income vs Expenses vs Net</h3>
        <div className="mt-4">
          <ProjectionIncomeExpensesNetLine points={selectedPoints} currency={currency} />
        </div>
      </article>

      <article className="panel p-4">
        <h3 className="text-base font-semibold">Cumulative Cashflow Trend</h3>
        <div className="mt-4">
          <ProjectionCashflowArea points={selectedPoints} currency={currency} />
        </div>
      </article>

      <article className="panel p-4">
        <h3 className="text-base font-semibold">Horizon Comparison</h3>
        <div className="mt-4">
          <ProjectionHorizonComparisonBars data={comparisonData} currency={currency} />
        </div>
        <p className="mt-3 text-xs muted">Projection graphs include recurring entries only. One-time entries remain disclaimer-only.</p>
      </article>
    </section>
  );
}
