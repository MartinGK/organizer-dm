import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type BadgeProps = {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'danger';
};

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium',
        tone === 'neutral' && 'muted',
        tone === 'success' && 'text-[var(--success)] border-[var(--success)]/30',
        tone === 'danger' && 'text-[var(--danger)] border-[var(--danger)]/30',
      )}
    >
      {children}
    </span>
  );
}
