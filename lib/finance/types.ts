import type { Entry } from '@/types/entry';

export type KpiMetrics = {
  monthlyRecurringIncome: number;
  monthlyRecurringExpenses: number;
  netMonthlyResult: number;
  burnRate: number;
  runwayMonths: number | null;
};

export type ProjectionRow = {
  month: string;
  income: number;
  expenses: number;
  net: number;
};

export type EntryWithMonthlyEquivalent = Entry & {
  monthly_equivalent: number;
};

export type ProjectionHorizonKey = '6m' | '1y' | '2y' | '4y';

export type ProjectionHorizonConfig = {
  key: ProjectionHorizonKey;
  label: string;
  months: number;
};

export type ProjectionSummary = {
  horizon: ProjectionHorizonConfig;
  total_income: number;
  total_expenses: number;
  net_result: number;
  accumulated_cashflow: {
    from_zero: number;
    from_cash_on_hand: number | null;
  };
  burn_rate: number;
  runway_months: number | null;
  one_time_balance_disclaimer: number;
};

export type ProjectionResultMap = Record<ProjectionHorizonKey, ProjectionSummary>;

export type ProjectionEntryInput = Entry & {
  monthly_equivalent: number;
};

export type ExpenseDistributionDatum = {
  concept: string;
  value: number;
  percentage: number;
};

export type IncomeExpenseTimelinePoint = {
  month: string;
  income: number;
  expenses: number;
  net: number;
};

export type RecurringCommitmentDatum = {
  concept: string;
  value: number;
};

export type FinancialStabilityState = 'positive' | 'neutral' | 'negative';
