import type { Currency } from '@/types/settings';

const localeByCurrency: Record<Currency, string> = {
  USD: 'en-US',
  ARS: 'es-AR',
};

export function formatCurrency(value: number, currency: Currency) {
  return new Intl.NumberFormat(localeByCurrency[currency], {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
