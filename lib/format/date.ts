import { format } from 'date-fns';

export function monthKey(date: Date) {
  return format(date, 'yyyy-MM');
}

export function monthLabel(date: Date) {
  return format(date, 'MMM yyyy');
}
