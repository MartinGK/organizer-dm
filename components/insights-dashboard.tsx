'use client';

import { ExpenseDistributionPie } from '@/components/charts/expense-distribution-pie';
import { FinancialStabilityGauge } from '@/components/charts/financial-stability-gauge';
import { IncomeExpensesLine } from '@/components/charts/income-expenses-line';
import { RecurringCommitmentsBar } from '@/components/charts/recurring-commitments-bar';
import { useInsightsData } from '@/hooks/use-insights-data';
import type { Entry } from '@/types/entry';
import type { Currency } from '@/types/settings';

export function InsightsDashboard({ entries, currency, baseMonth }: { entries: Entry[]; currency: Currency; baseMonth: Date }) {
  const insights = useInsightsData(entries, baseMonth);

  return (
    <section className="space-y-6">
      <article className="panel p-4">
        <h2 className="text-lg font-semibold">Expense Distribution</h2>
        <p className="mt-1 text-sm muted">Recurring expenses by concept and share of monthly total.</p>
        <div className="mt-4">
          <ExpenseDistributionPie data={insights.expenseDistribution} currency={currency} />
        </div>
      </article>

      <article className="panel p-4">
        <h2 className="text-lg font-semibold">Income vs Expenses Over Time</h2>
        <p className="mt-1 text-sm muted">Operational monthly timeline from entry start dates.</p>
        <div className="mt-4">
          <IncomeExpensesLine points={insights.incomeExpensesTimeline} currency={currency} />
        </div>
      </article>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="panel p-4">
          <h2 className="text-lg font-semibold">Recurring Commitments</h2>
          <p className="mt-1 text-sm muted">Highest monthly recurring expenses.</p>
          <div className="mt-4">
            <RecurringCommitmentsBar data={insights.recurringCommitments} currency={currency} />
          </div>
        </article>

        <article className="panel p-4">
          <h2 className="text-lg font-semibold">Financial Stability Indicator</h2>
          <p className="mt-1 text-sm muted">Current net monthly margin state.</p>
          <div className="mt-4">
            <FinancialStabilityGauge
              netMonthlyMargin={insights.netMonthlyMargin}
              state={insights.financialStability}
              currency={currency}
            />
          </div>
        </article>
      </div>
    </section>
  );
}
