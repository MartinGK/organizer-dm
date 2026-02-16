import { formatCurrency } from '@/lib/format/currency';
import type { Currency } from '@/types/settings';

type KpiCardProps = {
  label: string;
  value: number;
  currency: Currency;
  hint?: string;
  tone?: 'neutral' | 'positive' | 'negative';
};

export function KpiCard({ label, value, currency, hint, tone = 'neutral' }: KpiCardProps) {
  const toneClass =
    tone === 'positive' ? 'metric-positive' : tone === 'negative' ? 'metric-negative' : 'text-[var(--text-primary)]';

  return (
    <article className="panel p-5">
      <p className="text-xs uppercase tracking-[0.13em] muted">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${toneClass}`}>{formatCurrency(value, currency)}</p>
      {hint ? <p className="mt-2 text-sm muted">{hint}</p> : null}
    </article>
  );
}
