import { addMonths, parseISO } from 'date-fns';

import { monthKey } from '@/lib/format/date';
import type {
  ProjectionEntryInput,
  ProjectionHorizonConfig,
  ProjectionResultMap,
  ProjectionSummary,
} from '@/lib/finance/types';
import type { Entry } from '@/types/entry';

export function isRecurringEntry(entry: Entry) {
  return entry.frequency === 'monthly' || entry.frequency === 'annual';
}

export function monthlyEquivalentForMonth(entry: Entry, selectedMonth: Date) {
  const selected = monthKey(selectedMonth);
  const start = monthKey(parseISO(entry.start_date));
  const end = entry.end_date ? monthKey(parseISO(entry.end_date)) : null;

  if (selected < start) {
    return 0;
  }

  if (end && selected > end) {
    return 0;
  }

  if (entry.frequency === 'monthly') {
    return entry.amount;
  }

  if (entry.frequency === 'annual') {
    return entry.amount / 12;
  }

  return selected === start ? entry.amount : 0;
}

export function calculateKpis(entries: Entry[], selectedMonth: Date, cashOnHand: number | null) {
  let monthlyRecurringIncome = 0;
  let monthlyRecurringExpenses = 0;

  for (const entry of entries) {
    const value = monthlyEquivalentForMonth(entry, selectedMonth);
    if (!isRecurringEntry(entry)) continue;

    if (entry.type === 'income') {
      monthlyRecurringIncome += value;
    } else {
      monthlyRecurringExpenses += value;
    }
  }

  const netMonthlyResult = monthlyRecurringIncome - monthlyRecurringExpenses;
  const burnRate = netMonthlyResult < 0 ? Math.abs(netMonthlyResult) : 0;
  const runwayMonths = cashOnHand !== null && burnRate > 0 ? cashOnHand / burnRate : null;

  return {
    monthlyRecurringIncome,
    monthlyRecurringExpenses,
    netMonthlyResult,
    burnRate,
    runwayMonths,
  };
}

export function buildMonthlyProjection(entries: Entry[], startMonth: Date, months = 12) {
  const projection = [];

  for (let i = 0; i < months; i += 1) {
    const month = addMonths(startMonth, i);
    let income = 0;
    let expenses = 0;

    for (const entry of entries) {
      const value = monthlyEquivalentForMonth(entry, month);
      if (value === 0) continue;

      if (entry.type === 'income') {
        income += value;
      } else {
        expenses += value;
      }
    }

    projection.push({
      month: monthKey(month),
      income,
      expenses,
      net: income - expenses,
    });
  }

  return projection;
}

export const PROJECTION_HORIZONS: ProjectionHorizonConfig[] = [
  { key: '6m', label: '6 Month Projection', months: 6 },
  { key: '1y', label: '1 Year Projection', months: 12 },
  { key: '2y', label: '2 Year Projection', months: 24 },
  { key: '4y', label: '4 Year Projection', months: 48 },
];

type ProjectionOptions = {
  baseMonth?: Date;
  cashOnHand?: number | null;
};

export function calculateFinancialProjection(
  entries: ProjectionEntryInput[],
  { baseMonth = new Date(), cashOnHand = null }: ProjectionOptions = {},
): ProjectionResultMap {
  const baseMonthKey = monthKey(baseMonth);

  const recurringEntries = entries.filter((entry) => {
    if (entry.frequency !== 'monthly' && entry.frequency !== 'annual') {
      return false;
    }

    const start = monthKey(parseISO(entry.start_date));
    return start <= baseMonthKey;
  });

  const oneTimeEntries = entries.filter((entry) => entry.frequency === 'one_time');

  const result = {} as ProjectionResultMap;

  for (const horizon of PROJECTION_HORIZONS) {
    const endMonthKey = monthKey(addMonths(baseMonth, horizon.months - 1));
    let totalIncome = 0;
    let totalExpenses = 0;

    for (let monthOffset = 0; monthOffset < horizon.months; monthOffset += 1) {
      const month = addMonths(baseMonth, monthOffset);
      const currentMonthKey = monthKey(month);

      for (const entry of recurringEntries) {
        if (!entryIsActiveInMonth(entry, currentMonthKey)) {
          continue;
        }

        if (entry.type === 'income') {
          totalIncome += entry.monthly_equivalent;
        } else {
          totalExpenses += entry.monthly_equivalent;
        }
      }
    }

    const netResult = totalIncome - totalExpenses;
    const burnRate = netResult < 0 ? Math.abs(netResult / horizon.months) : 0;
    const runwayMonths = cashOnHand !== null && burnRate > 0 ? cashOnHand / burnRate : null;
    const oneTimeBalanceDisclaimer = oneTimeEntries.reduce((sum, entry) => {
      const start = monthKey(parseISO(entry.start_date));
      if (start < baseMonthKey || start > endMonthKey) {
        return sum;
      }

      return sum + (entry.type === 'income' ? entry.amount : -entry.amount);
    }, 0);

    const summary: ProjectionSummary = {
      horizon,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_result: netResult,
      accumulated_cashflow: {
        from_zero: netResult,
        from_cash_on_hand: cashOnHand !== null ? cashOnHand + netResult : null,
      },
      burn_rate: burnRate,
      runway_months: runwayMonths,
      one_time_balance_disclaimer: oneTimeBalanceDisclaimer,
    };

    result[horizon.key] = summary;
  }

  return result;
}

function entryIsActiveInMonth(entry: ProjectionEntryInput, month: string) {
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
