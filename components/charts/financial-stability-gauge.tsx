import { formatCurrency } from '@/lib/format/currency';
import type { FinancialStabilityState } from '@/lib/finance/types';
import type { Currency } from '@/types/settings';

const STATUS_LABEL: Record<FinancialStabilityState, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
};

const STATUS_TONE: Record<FinancialStabilityState, string> = {
  positive: 'text-[var(--success)]',
  neutral: 'text-[var(--text-primary)]',
  negative: 'text-[var(--danger)]',
};

const STATUS_COLOR: Record<FinancialStabilityState, string> = {
  positive: '#2d6a4f',
  neutral: '#475569',
  negative: '#9b2c2c',
};

export function FinancialStabilityGauge({
  netMonthlyMargin,
  state,
  currency,
}: {
  netMonthlyMargin: number;
  state: FinancialStabilityState;
  currency: Currency;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.13em] muted">Net monthly margin</p>
        <p className="mt-1 text-2xl font-semibold">{formatCurrency(netMonthlyMargin, currency)}</p>
      </div>

      <div className="space-y-2">
        <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--border)]/70">
          <div className="h-full rounded-full" style={{ width: '100%', backgroundColor: STATUS_COLOR[state] }} aria-hidden="true" />
        </div>
        <p className={`text-sm font-medium ${STATUS_TONE[state]}`}>Stability: {STATUS_LABEL[state]}</p>
      </div>
    </div>
  );
}
