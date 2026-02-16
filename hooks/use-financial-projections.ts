'use client';

import { useMemo } from 'react';

import {
  buildProjectionComparison,
  buildProjectionGraphSeries,
  calculateFinancialProjection,
  monthlyEquivalentForMonth,
} from '@/lib/finance/calculations';
import type { ProjectionComparisonDatum, ProjectionGraphSeriesByHorizon, ProjectionResultMap } from '@/lib/finance/types';
import type { Entry } from '@/types/entry';

type FinancialProjectionBundle = {
  projectionByHorizon: ProjectionResultMap;
  seriesByHorizon: ProjectionGraphSeriesByHorizon;
  comparisonData: ProjectionComparisonDatum[];
};

export function useFinancialProjections(
  entries: Entry[],
  baseMonth: Date,
  cashOnHand: number | null,
): FinancialProjectionBundle {
  const projectionEntries = useMemo(
    () =>
      entries.map((entry) => ({
        ...entry,
        monthly_equivalent: monthlyEquivalentForMonth(entry, baseMonth),
      })),
    [baseMonth, entries],
  );

  return useMemo(() => {
    const projectionByHorizon = calculateFinancialProjection(projectionEntries, { baseMonth, cashOnHand });
    const seriesByHorizon = buildProjectionGraphSeries(projectionEntries, { baseMonth, cashOnHand });
    const comparisonData = buildProjectionComparison(projectionByHorizon);

    return {
      projectionByHorizon,
      seriesByHorizon,
      comparisonData,
    };
  }, [baseMonth, cashOnHand, projectionEntries]);
}
