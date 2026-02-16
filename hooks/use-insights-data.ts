'use client';

import { useMemo } from 'react';
import { addMonths, parseISO } from 'date-fns';

import { monthlyEquivalentForMonth } from '@/lib/finance/calculations';
import { monthKey } from '@/lib/format/date';
import type {
  ExpenseDistributionDatum,
  FinancialStabilityState,
  IncomeExpenseTimelinePoint,
  RecurringCommitmentDatum,
} from '@/lib/finance/types';
import type { Entry } from '@/types/entry';

type InsightsData = {
  expenseDistribution: ExpenseDistributionDatum[];
  incomeExpensesTimeline: IncomeExpenseTimelinePoint[];
  recurringCommitments: RecurringCommitmentDatum[];
  netMonthlyMargin: number;
  financialStability: FinancialStabilityState;
};

export function useInsightsData(entries: Entry[], baseMonth: Date): InsightsData {
  return useMemo(() => buildInsightsData(entries, baseMonth), [baseMonth, entries]);
}

function buildInsightsData(entries: Entry[], baseMonth: Date): InsightsData {
  const baseKey = monthKey(baseMonth);
  const recurringStartedEntries = entries.filter((entry) => {
    if (entry.frequency !== 'monthly' && entry.frequency !== 'annual') {
      return false;
    }

    const start = monthKey(parseISO(entry.start_date));
    return start <= baseKey;
  });

  const startKey = getStartMonthKey(recurringStartedEntries, baseKey);
  const endKey = getEndMonthKey(recurringStartedEntries, baseKey);

  const timeline: IncomeExpenseTimelinePoint[] = [];
  const totalMonths = monthDifference(startKey, endKey) + 1;
  const startDate = new Date(`${startKey}-01T00:00:00`);

  for (let i = 0; i < totalMonths; i += 1) {
    const month = addMonths(startDate, i);
    const currentMonth = monthKey(month);
    let income = 0;
    let expenses = 0;

    for (const entry of recurringStartedEntries) {
      if (!entryIsActiveInMonth(entry, currentMonth)) {
        continue;
      }

      const monthlyEquivalent = monthlyEquivalentForMonth(entry, month);
      if (entry.type === 'income') {
        income += monthlyEquivalent;
      } else {
        expenses += monthlyEquivalent;
      }
    }

    timeline.push({
      month: currentMonth,
      income,
      expenses,
      net: income - expenses,
    });
  }

  const currentMonthPoint = timeline.find((point) => point.month === baseKey) ?? {
    month: baseKey,
    income: 0,
    expenses: 0,
    net: 0,
  };

  const expenseByConcept = new Map<string, number>();
  for (const entry of recurringStartedEntries) {
    if (entry.type !== 'expense' || !entryIsActiveInMonth(entry, baseKey)) {
      continue;
    }

    const monthlyEquivalent = monthlyEquivalentForMonth(entry, baseMonth);
    const prev = expenseByConcept.get(entry.concept) ?? 0;
    expenseByConcept.set(entry.concept, prev + monthlyEquivalent);
  }

  const totalExpenses = Array.from(expenseByConcept.values()).reduce((sum, value) => sum + value, 0);
  const expenseDistribution: ExpenseDistributionDatum[] = Array.from(expenseByConcept.entries())
    .map(([concept, value]) => ({
      concept,
      value,
      percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const recurringCommitments: RecurringCommitmentDatum[] = recurringStartedEntries
    .filter((entry) => entry.type === 'expense' && entryIsActiveInMonth(entry, baseKey))
    .map((entry) => ({
      concept: entry.concept,
      value: monthlyEquivalentForMonth(entry, baseMonth),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return {
    expenseDistribution,
    incomeExpensesTimeline: timeline,
    recurringCommitments,
    netMonthlyMargin: currentMonthPoint.net,
    financialStability: toFinancialStability(currentMonthPoint.net),
  };
}

function toFinancialStability(netMonthlyMargin: number): FinancialStabilityState {
  if (netMonthlyMargin > 0) return 'positive';
  if (netMonthlyMargin < 0) return 'negative';
  return 'neutral';
}

function getStartMonthKey(entries: Entry[], fallback: string) {
  if (entries.length === 0) {
    return fallback;
  }

  return entries
    .map((entry) => monthKey(parseISO(entry.start_date)))
    .sort((a, b) => a.localeCompare(b))[0];
}

function getEndMonthKey(entries: Entry[], currentKey: string) {
  const futureEndKeys = entries
    .filter((entry) => !!entry.end_date)
    .map((entry) => monthKey(parseISO(entry.end_date as string)))
    .filter((entryEndKey) => entryEndKey > currentKey)
    .sort((a, b) => a.localeCompare(b));

  if (futureEndKeys.length === 0) {
    return currentKey;
  }

  return futureEndKeys[futureEndKeys.length - 1];
}

function monthDifference(startMonth: string, endMonth: string) {
  const [startYear, startMonthIndex] = startMonth.split('-').map((value) => Number(value));
  const [endYear, endMonthIndex] = endMonth.split('-').map((value) => Number(value));

  return (endYear - startYear) * 12 + (endMonthIndex - startMonthIndex);
}

function entryIsActiveInMonth(entry: Entry, month: string) {
  const start = monthKey(parseISO(entry.start_date));
  const end = entry.end_date ? monthKey(parseISO(entry.end_date)) : null;

  if (month < start) {
    return false;
  }

  if (end && month > end) {
    return false;
  }

  return true;
}
