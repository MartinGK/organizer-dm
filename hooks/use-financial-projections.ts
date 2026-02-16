'use client';

import { useMemo } from 'react';

import { calculateFinancialProjection, monthlyEquivalentForMonth } from '@/lib/finance/calculations';
import type { ProjectionResultMap } from '@/lib/finance/types';
import type { Entry } from '@/types/entry';

export function useFinancialProjections(
  entries: Entry[],
  baseMonth: Date,
  cashOnHand: number | null,
): ProjectionResultMap {
  const projectionEntries = useMemo(
    () =>
      entries.map((entry) => ({
        ...entry,
        monthly_equivalent: monthlyEquivalentForMonth(entry, baseMonth),
      })),
    [baseMonth, entries],
  );

  return useMemo(
    () => calculateFinancialProjection(projectionEntries, { baseMonth, cashOnHand }),
    [baseMonth, cashOnHand, projectionEntries],
  );
}
