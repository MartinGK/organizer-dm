import { formatCurrency } from '@/lib/format/currency';
import type { RecurringCommitmentDatum } from '@/lib/finance/types';
import type { Currency } from '@/types/settings';

export function RecurringCommitmentsBar({
  data,
  currency,
}: {
  data: RecurringCommitmentDatum[];
  currency: Currency;
}) {
  if (data.length === 0) {
    return <p className="text-sm muted">No recurring commitments available.</p>;
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.concept} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="truncate">{item.concept}</p>
            <p className="font-medium">{formatCurrency(item.value, currency)}</p>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--border)]/70">
            <div
              className="h-full rounded-full bg-[#3f628f]"
              style={{ width: `${Math.max((item.value / maxValue) * 100, 2)}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
